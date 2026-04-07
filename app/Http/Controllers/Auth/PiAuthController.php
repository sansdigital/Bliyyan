<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;

use Illuminate\Support\Str;

class PiAuthController extends Controller
{
    /**

     * Handle the Pi Network authentication callback.
     */
    public function authenticate(Request $request)
    {
        $request->validate([
            'uid' => 'required',
            'accessToken' => 'required',
            'username' => 'nullable'
        ]);

        $uid = $request->uid;
        $accessToken = $request->accessToken;

        try {
            // Verify token with Pi Network API (SSL verify disabled for better hosting compatibility)
            $response = Http::withoutVerifying()
                ->withToken($accessToken)
                ->get(config('services.pi.api_url') . "/me");


            if ($response->successful()) {
                $piUser = $response->json();
                
                // Ensure the UID matches our incoming request
                if ($piUser['uid'] !== $uid) {
                    return response()->json(['error' => 'UID mismatch. Server: ' . $piUser['uid'] . ', Local: ' . $uid], 403);
                }

                // Find or create the user in our database
                $user = User::where('pi_uid', $uid)->first();
                
                if (!$user) {
                    // Check if we have an existing user with the same username (if we capture it)
                    $user = User::create([
                        'name' => $request->username ?? 'Pi User ' . substr($uid, 0, 8),
                        'email' => $uid . '@pi.network', // Virtual email for compatibility
                        'password' => bcrypt(Str::random(16)), // Dummy password
                        'pi_uid' => $uid,
                        'is_admin' => false
                    ]);
                }

                // Log the user in
                Auth::login($user, true);

                return response()->json([
                    'message' => 'Authenticated successfully',
                    'user' => $user,
                    'redirect' => route('dashboard')
                ]);
            }

            Log::error("Pi Auth Verification Failed: " . $response->body());
            return response()->json([
                'error' => 'Gagal verifikasi Token Pi. Pesan: ' . ($response->json()['error'] ?? $response->body()),
                'status' => $response->status()
            ], $response->status());

        } catch (\Exception $e) {
            Log::error("Pi Auth Exception: " . $e->getMessage());
            $errorMsg = $e->getMessage();
            if (str_contains($errorMsg, 'cURL error 6')) {
                $errorMsg = "Server Hostinger tidak bisa menemukan domain minepi.com (DNS Error). Coba cek di hPanel apakah ada pembatasan koneksi luar.";
            }
            return response()->json(['error' => 'Server Error: ' . $errorMsg], 500);
        }

    }
}
