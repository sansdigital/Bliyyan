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
     * Handle the Pi Network authentication callback.
     *
     * Why one-time token?
     * iOS Pi Browser (WKWebView + ITP) drops cookies set from POST responses
     * or from navigations triggered inside a cross-origin WebView context
     * (the Pi auth dialog). A subsequent GET request from a clean navigation
     * is treated as first-party, and iOS accepts the session cookie normally.
     *
     * Flow:
     * 1. JS submits form POST → this method verifies with Pi API → generates token
     * 2. HTML page redirects to GET /auth/pi/callback?token=xxx
     * 3. callback() method consumes token, calls Auth::login(), redirects to dashboard
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
                            'name'     => $request->username ?? 'Pi User ' . substr($uid, 0, 8),
                            'email'    => $uid . '@pi.network',
                            'password' => Hash::make(Str::random(16)),
                            'pi_uid'   => $uid,
                            'is_admin' => false,
                        ]);
                    }

                    // Generate a short-lived one-time token.
                    // The token is stored in cache and consumed by the /auth/pi/callback GET route.
                    $token = Str::random(64);
                    Cache::put("pi_login_token_{$token}", $user->id, now()->addSeconds(90));

                    Log::info("Pi Auth: One-time token generated for user ID: " . $user->id);

                    $callbackUrl = route('pi.callback') . '?token=' . urlencode($token);

                    // Return a 200 HTML page that immediately navigates to the callback URL.
                    // We use window.location.replace (GET) so iOS treats it as a normal navigation.
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
     * Because this is a plain GET navigation, iOS WKWebView treats it as a
     * normal first-party page load. The session cookie set here will be
     * stored and sent on all subsequent requests correctly.
     */
    public function callback(Request $request)
    {
        $token    = $request->query('token', '');
        $cacheKey = "pi_login_token_{$token}";
        $userId   = $token ? Cache::get($cacheKey) : null;

        if (!$userId) {
            Log::warning("Pi Callback: Invalid or expired token.");
            return redirect()->route('login')->withErrors(['pi' => 'Sesi login habis. Silakan login ulang.']);
        }

        // Consume the token immediately (one-time use only)
        Cache::forget($cacheKey);

        $user = User::find($userId);

        if (!$user) {
            Log::error("Pi Callback: User ID $userId not found.");
            return redirect()->route('login')->withErrors(['pi' => 'User tidak ditemukan.']);
        }

        // This is now a clean GET request — iOS will accept the session cookie.
        Auth::login($user, true);
        $request->session()->regenerate();
        $request->session()->save();

        Log::info("Pi Callback: User {$user->id} logged in successfully via one-time token.");

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Helper to return a simple error HTML page that redirects back to login.
     */
    private function errorHtml(string $title, string $message): \Illuminate\Http\Response
    {
        return response(
            "<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'></head>
<body style='background:#111;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px'>
    <div>
        <h2 style='margin-bottom:12px'>" . e($title) . "</h2>
        <p style='opacity:0.8'>" . e($message) . "</p>
        <p style='opacity:0.5;font-size:13px;margin-top:20px'>Kembali ke halaman login dalam 3 detik...</p>
    </div>
    <script>setTimeout(function(){ window.location.replace('/login'); }, 3000);</script>
</body>
</html>"
        )->header('Content-Type', 'text/html; charset=utf-8');
    }
}
