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
     * Returns a 200 HTML page (NOT a 302 redirect) so iOS WKWebView properly
     * stores the session cookie before navigating to the dashboard.
     * A 302 redirect races against iOS cookie storage and often loses.
     */
    public function callback(Request $request)
    {
        $token    = $request->query('token', '');
        $cacheKey = "pi_login_token_{$token}";
        $userId   = $token ? Cache::get($cacheKey) : null;

        if (!$userId) {
            Log::warning("Pi Callback: Invalid or expired token. Token prefix: " . substr($token, 0, 8));
            // Show visible error message (not a silent redirect) so user/developer can debug
            return response(
                "<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'></head>
<body style='background:#111;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px'>
    <div>
        <h2>Token Tidak Ditemukan</h2>
        <p style='opacity:0.7'>Sesi login habis atau tidak valid.<br>Silakan login ulang.</p>
        <p style='opacity:0.4;font-size:12px;margin-top:20px'>Kembali ke login dalam 3 detik...</p>
    </div>
    <script>setTimeout(function(){ window.location.replace('/login'); }, 3000);</script>
</body>
</html>"
            )->header('Content-Type', 'text/html; charset=utf-8');
        }

        // Consume the token immediately (one-time use)
        Cache::forget($cacheKey);

        $user = User::find($userId);

        if (!$user) {
            Log::error("Pi Callback: User ID $userId not found.");
            return $this->errorHtml('User Tidak Ditemukan', 'Akun tidak ditemukan. Hubungi admin.');
        }

        // Auth::login on a clean GET request — iOS WKWebView will accept this cookie.
        Auth::login($user, true);
        $request->session()->save(); // Save WITHOUT regenerate to keep the same session ID

        Log::info("Pi Callback: User {$user->id} logged in successfully.");

        // Return 200 HTML (NOT a 302 redirect!) with a 1-second delay.
        // This gives iOS WKWebView time to fully commit the session cookie
        // before window.location.replace() triggers the navigation to dashboard.
        $dashboardUrl = route('dashboard');
        return response(
            "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <meta http-equiv='refresh' content='1; url=" . e($dashboardUrl) . "'>
</head>
<body style='background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0'>
    <div style='text-align:center'>
        <p style='font-size:16px;opacity:0.8'>Berhasil! Membuka Dashboard...</p>
    </div>
    <script>
        setTimeout(function() {
            window.location.replace(" . json_encode($dashboardUrl) . ");
        }, 1000);
    </script>
</body>
</html>"
        )->header('Content-Type', 'text/html; charset=utf-8');
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
