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
                            'email_verified_at' => now(),
                        ]);
                    } elseif (!$user->email_verified_at) {
                        $user->update(['email_verified_at' => now()]);
                    }

                    $token = Str::random(64);
                    Cache::put("pi_login_token_{$token}", $user->id, now()->addSeconds(90));

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
     */
    public function callback(Request $request)
    {
        $token    = $request->query('token', '');
        $cacheKey = "pi_login_token_{$token}";
        $userId   = $token ? Cache::get($cacheKey) : null;

        if (!$userId) {
            Log::warning("Pi Callback: Invalid or expired token.");
            return $this->errorHtml('Token Tidak Ditemukan', 'Sesi login habis atau tidak valid. Silakan login ulang.');
        }

        Cache::forget($cacheKey);

        $user = User::find($userId);
        if (!$user) {
            Log::error("Pi Callback: User ID $userId not found.");
            return $this->errorHtml('User Tidak Ditemukan', 'Akun tidak ditemukan. Hubungi admin.');
        }

        Auth::login($user, true);
        $request->session()->save();

        Log::info("Pi Callback: User {$user->id} logged in. Showing DEBUG button.");

        $dashboardUrl = url('/auth/pi/debug');
        
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
        <p style='opacity:0.7; margin:0 0 35px; font-size:15px;'>Mohon klik tombol DEBUG di bawah ini.</p>
        <a href='" . e($dashboardUrl) . "' class='btn'>
            Cek Debug Info
            <svg class='icon' fill='none' stroke='currentColor' viewBox='0 0 24 24' stroke-width='2.5'><path stroke-linecap='round' stroke-linejoin='round' d='M14 5l7 7m0 0l-7 7m7-7H3'></path></svg>
        </a>
    </div>
</body>
</html>
        ")->header('Content-Type', 'text/html; charset=utf-8');
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
