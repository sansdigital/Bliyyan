<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class PiAuthController extends Controller
{
    /**
     * Handle the Pi Network authentication.
     *
     * Flow (iOS-safe one-time token pattern):
     * 1. JS submits form POST → verify Pi token → generate cache token
     * 2. Return HTML page that navigates via window.location.replace() to GET /auth/pi/callback?token
     * 3. callback() consumes token, Auth::login(), returns 200 HTML with 1s delay → dashboard
     *
     * Why not cookies from POST? iOS WKWebView ITP drops cookies from POST responses
     * when the page was previously in contact with cross-origin content (Pi auth dialog).
     * A clean GET + 200 HTML response is treated as first-party and cookies are accepted.
     */
    public function authenticate(Request $request)
    {
        $request->validate([
            'uid'         => 'required',
            'accessToken' => 'required',
            'username'    => 'nullable',
        ]);

        $uid         = $request->uid;
        $accessToken = $request->accessToken;

        Log::info("Pi Auth: UID: $uid, Token: " . substr($accessToken, 0, 10) . "...");

        try {
            Log::info("Pi Auth: Attempting connection to " . config('services.pi.api_url'));

            $response = Http::withoutVerifying()
                ->timeout(15)
                ->withToken($accessToken)
                ->get(config('services.pi.api_url') . "/me");

            Log::info("Pi Auth: Response Status: " . $response->status());

            if ($response->successful()) {
                $piUser = $response->json();
                Log::info("Pi Auth: API OK for UID: " . $piUser['uid']);

                if ($piUser['uid'] !== $uid) {
                    Log::warning("Pi Auth: UID Mismatch!");
                    return $this->errorHtml('Login Gagal', 'UID tidak cocok. Silakan coba lagi.');
                }

                try {
                    $user = User::where('pi_uid', $uid)->first();

                    if (!$user) {
                        Log::info("Pi Auth: Creating new user for UID: $uid");
                        $user = User::create([
                            'name'              => $request->username ?? 'Pi User ' . substr($uid, 0, 8),
                            'email'             => $uid . '@pi.network',
                            'password'          => Hash::make(Str::random(16)),
                            'pi_uid'            => $uid,
                            'is_admin'          => false,
                            // Mark email as verified so 'verified' middleware doesn't block Pi users
                            'email_verified_at' => now(),
                        ]);
                        Log::info("Pi Auth: New user created with ID: " . $user->id);
                    } elseif (!$user->email_verified_at) {
                        // Fix existing Pi users that have no email_verified_at
                        $user->update(['email_verified_at' => now()]);
                        Log::info("Pi Auth: Fixed email_verified_at for user ID: " . $user->id);
                    }

                    // Generate a short-lived one-time token stored in cache.
                    // The GET /auth/pi/callback route consumes this token to establish the session.
                    $token = Str::random(64);
                    Cache::put("pi_login_token_{$token}", $user->id, now()->addSeconds(90));

                    Log::info("Pi Auth: One-time token generated for user ID: " . $user->id);

                    $callbackUrl = route('pi.callback') . '?token=' . urlencode($token);

                    return response(
                        "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
</head>
<body style='background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0'>
    <div style='text-align:center'>
        <p style='font-size:16px;opacity:0.7'>Masuk ke Dashboard...</p>
    </div>
    <script>
        window.location.replace(" . json_encode($callbackUrl) . ");
    </script>
</body>
</html>"
                    )->header('Content-Type', 'text/html; charset=utf-8');

                } catch (\Exception $dbEx) {
                    Log::error("Pi Auth DB Error: " . $dbEx->getMessage());
                    return $this->errorHtml('Error Server', $dbEx->getMessage());
                }
            }

            Log::error("Pi Auth Verification Failed: " . $response->body());
            $errMsg = $response->json()['error'] ?? $response->body();
            return $this->errorHtml('Verifikasi Gagal', 'Token Pi tidak valid: ' . $errMsg);

        } catch (\Exception $e) {
            Log::error("Pi Auth Exception: " . $e->getMessage());
            $msg = str_contains($e->getMessage(), 'cURL error 6')
                ? 'DNS Error: Server tidak bisa menghubungi minepi.com.'
                : $e->getMessage();
            return $this->errorHtml('Error', $msg);
        }
    }

    /**
     * Consume the one-time login token (GET request — iOS-safe).
     *
     * THE KEY FIX: Instead of redirecting to /dashboard (which causes iOS to
     * lose the session cookie on the navigation), we render the dashboard
     * content DIRECTLY from this callback URL.
     *
     * No navigation = no cookie-drop problem.
     * The user is already ON the dashboard page. Inertia SPA handles
     * all subsequent navigation correctly with the established session.
     */
    public function callback(Request $request)
    {
        $token    = $request->query('token', '');
        $cacheKey = "pi_login_token_{$token}";
        $userId   = $token ? Cache::get($cacheKey) : null;

        if (!$userId) {
            Log::warning("Pi Callback: Invalid or expired token. Prefix: " . substr($token, 0, 8));
            return response(
                "<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'></head>
<body style='background:#111;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px'>
    <div>
        <h2>Token Tidak Ditemukan</h2>
        <p style='opacity:0.7'>Sesi login habis atau tidak valid. Silakan login ulang.</p>
        <p style='opacity:0.4;font-size:12px;margin-top:20px'>Kembali ke login dalam 3 detik...</p>
    </div>
    <script>setTimeout(function(){ window.location.replace('/login'); }, 3000);</script>
</body>
</html>"
            )->header('Content-Type', 'text/html; charset=utf-8');
        }

        Cache::forget($cacheKey);

        $user = User::find($userId);
        if (!$user) {
            Log::error("Pi Callback: User ID $userId not found.");
            return $this->errorHtml('User Tidak Ditemukan', 'Akun tidak ditemukan. Hubungi admin.');
        }

        // Log in the user. This is a clean GET request so iOS accepts the cookie.
        Auth::login($user, true);
        $request->session()->save();

        Log::info("Pi Callback: User {$user->id} logged in. Rendering dashboard directly.");

        // *** THE REAL FIX ***
        // Instead of redirecting to /dashboard (which causes iOS to drop the cookie
        // on the navigation), render the Dashboard Inertia page directly HERE.
        //
        // The user is now ON the dashboard — no cookie needs to survive a navigation.
        // The session cookie is set in THIS response, and since there's no further
        // navigation, iOS has no chance to drop it.
        //
        // Inertia SPA takes over for all subsequent navigation (back button, links, etc.)
        // and sends the session cookie correctly because the page is already loaded.
        $dashboardController = app(\App\Http\Controllers\DashboardController::class);
        return $dashboardController->index($request);
    }

    /**
     * Helper: return a simple error HTML page.
     */
    private function errorHtml(string $title, string $message): \Illuminate\Http\Response
    {
        return response(
            "<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'></head>
<body style='background:#111;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px'>
    <div>
        <h2>" . e($title) . "</h2>
        <p style='opacity:0.8'>" . e($message) . "</p>
        <p style='opacity:0.4;font-size:13px;margin-top:20px'>Kembali ke login dalam 3 detik...</p>
    </div>
    <script>setTimeout(function(){ window.location.replace('/login'); }, 3000);</script>
</body>
</html>"
        )->header('Content-Type', 'text/html; charset=utf-8');
    }
}
