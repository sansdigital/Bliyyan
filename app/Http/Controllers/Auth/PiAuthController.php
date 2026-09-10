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
     * To bypass iOS Safari's ITP (Intelligent Tracking Prevention) which strips
     * cookies on cross-site automatic redirects, we do the following:
     * 1. Validate the Pi token and get/create the user.
     * 2. Put a one-time login token in the Cache.
     * 3. Return an HTML response with a button "Lanjutkan ke Dashboard".
     * 4. When the user manually CLICKS the button, the browser makes a user-initiated
     *    GET request to /auth/pi/confirm.
     * 5. The confirm route logs the user in (setting the session cookie) and redirects to dashboard.
     *    Because it was a user click, Safari allows the Set-Cookie header.
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
            $response = Http::withoutVerifying()
                ->timeout(15)
                ->withToken($accessToken)
                ->get(config('services.pi.api_url') . "/me");

            if ($response->successful()) {
                $piUser = $response->json();
                
                if ($piUser['uid'] !== $uid) {
                    Log::warning("Pi Auth: UID Mismatch!");
                    return $this->errorHtml('Login Gagal', 'UID tidak cocok. Silakan coba lagi.');
                }

                try {
                    $user = User::where('pi_uid', $uid)->first();

                    if (!$user) {
                        $user = User::create([
                            'name'              => $request->username ?? 'Pi User ' . substr($uid, 0, 8),
                            'email'             => $uid . '@pi.network',
                            'password'          => Hash::make(Str::random(16)),
                            'pi_uid'            => $uid,
                            'is_admin'          => false,
                            'email_verified_at' => now(), // Bypass verified middleware
                        ]);
                    } elseif (!$user->email_verified_at) {
                        $user->update(['email_verified_at' => now()]);
                    }

                    // Generate a token and put it in cache for 5 minutes
                    $token = Str::random(64);
                    Cache::put("pi_login_token_{$token}", $user->id, now()->addMinutes(5));

                    $confirmUrl = route('pi.confirm') . '?token=' . urlencode($token);

                    Log::info("Pi Auth: User validated, showing manual continue button for ITP bypass.");

                    // Return the HTML page with the manual button.
                    // This is the response to the POST request.
                    return response("
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>Login Berhasil</title>
    <style>
        body { background:#111; color:#fff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; }
        .btn { display:inline-flex; align-items:center; gap:8px; padding:16px 32px; background:linear-gradient(135deg, #f53d2d, #ff6b5c); color:#fff; text-decoration:none; font-weight:800; border-radius:12px; font-size:18px; box-shadow:0 8px 25px rgba(245,61,45,0.4); transition:all 0.2s; letter-spacing:0.5px; }
        .btn:active { transform:scale(0.95); box-shadow:0 4px 15px rgba(245,61,45,0.3); }
        .icon { width:24px; height:24px; }
    </style>
</head>
<body>
    <div style='text-align:center; padding:20px;'>
        <div style='background:#22c55e; color:#fff; width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; box-shadow:0 4px 20px rgba(34,197,94,0.4);'>
            <svg class='icon' fill='none' stroke='currentColor' viewBox='0 0 24 24' stroke-width='3'><path stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'></path></svg>
        </div>
        <h2 style='margin:0 0 10px; font-size:24px;'>Login Berhasil!</h2>
        <p style='opacity:0.7; margin:0 0 35px; font-size:15px;'>Sesi telah diamankan. Silakan lanjutkan.</p>
        <a href='" . e($confirmUrl) . "' class='btn'>
            Masuk ke Dashboard
            <svg class='icon' fill='none' stroke='currentColor' viewBox='0 0 24 24' stroke-width='2.5'><path stroke-linecap='round' stroke-linejoin='round' d='M14 5l7 7m0 0l-7 7m7-7H3'></path></svg>
        </a>
    </div>
</body>
</html>
                    ")->header('Content-Type', 'text/html; charset=utf-8');

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
     * Consume the one-time login token when the user MANUALLY CLICKS the button.
     * Since this is a user-initiated GET request, iOS Safari ITP allows the Set-Cookie header.
     */
    public function confirm(Request $request)
    {
        $token    = $request->query('token', '');
        $cacheKey = "pi_login_token_{$token}";
        $userId   = $token ? Cache::get($cacheKey) : null;

        if (!$userId) {
            Log::warning("Pi Confirm: Invalid or expired token.");
            return $this->errorHtml('Token Kadaluarsa', 'Sesi login telah habis. Silakan login ulang dari awal.');
        }

        // Consume token
        Cache::forget($cacheKey);

        $user = User::find($userId);
        if (!$user) {
            Log::error("Pi Confirm: User ID $userId not found.");
            return $this->errorHtml('User Tidak Ditemukan', 'Akun tidak ditemukan. Hubungi admin.');
        }

        // Log the user in.
        // We use a 200 OK response with a JavaScript redirect instead of a 302 HTTP redirect.
        // iOS Safari (WebKit) often ignores Set-Cookie headers on 302 redirects during auth flows.
        Auth::login($user, true);
        $request->session()->regenerate();
        $request->session()->save();

        Log::info("Pi Confirm: User {$user->id} logged in successfully via manual click. Using JS redirect to dashboard.");

        $dashboardUrl = route('dashboard');

        return response(
            "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>Mengalihkan...</title>
</head>
<body style='background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;'>
    <div style='text-align:center;'>
        <div style='width:40px;height:40px;border:4px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px;'></div>
        <h3 style='opacity:0.8'>Memuat Dashboard...</h3>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    <script>
        setTimeout(function() {
            window.location.replace('" . e($dashboardUrl) . "');
        }, 500);
    </script>
</body>
</html>"
        )->header('Content-Type', 'text/html; charset=utf-8');
    }

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
        <p style='opacity:0.4;font-size:13px;margin-top:20px'>Kembali ke login dalam 3 detik...</p>
    </div>
    <script>setTimeout(function(){ window.location.replace('/login'); }, 3000);</script>
</body>
</html>"
        )->header('Content-Type', 'text/html; charset=utf-8');
    }
}
