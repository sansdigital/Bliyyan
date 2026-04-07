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

        Log::info("Pi Auth: UID: $uid, Token: " . substr($accessToken, 0, 10) . "...");

        try {
            // Verify token with Pi Network API (SSL verify disabled for better hosting compatibility)
            Log::info("Pi Auth: Attempting connection to " . config('services.pi.api_url'));

            $response = Http::withoutVerifying()
                ->timeout(15) // Explicit 15s timeout
                ->withToken($accessToken)
                ->get(config('services.pi.api_url') . "/me");

            Log::info("Pi Auth: Response Status: " . $response->status());

            if ($response->successful()) {
                $piUser = $response->json();
                Log::info("Pi Auth: API OK for UID: " . $piUser['uid'] . " Username: " . ($piUser['username'] ?? 'None'));
                
                // Ensure the UID matches our incoming request
                if ($piUser['uid'] !== $uid) {
                    Log::warning("Pi Auth: UID Mismatch! Server: " . $piUser['uid'] . ", Local: " . $uid);
                    return response()->json(['error' => 'UID mismatch.'], 403);
                }

                // Find or create the user in our database
                try {
                    Log::info("Pi Auth: Looking for user UID: " . $uid);
                    $user = User::where('pi_uid', $uid)->first();
                    
                    if (!$user) {
                        Log::info("Pi Auth: User not found, creating new user...");
                        $user = User::create([
                            'name' => $request->username ?? 'Pi User ' . substr($uid, 0, 8),
                            'email' => $uid . '@pi.network', // Virtual email for compatibility
                            'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(16)), // Dummy password
                            'pi_uid' => $uid,
                            'is_admin' => false
                        ]);
                        Log::info("Pi Auth: New user created with ID: " . $user->id);
                    } else {
                        Log::info("Pi Auth: User found with ID: " . $user->id);
                    }

                    // Log the user in
                    Log::info("Pi Auth: Attempting Auth::login...");
                    Auth::login($user, true);
                    Log::info("Pi Auth: Auth::login SUCCESS!");

                    return response()->json([
                        'message' => 'Authenticated successfully',
                        'user' => $user,
                        'redirect' => route('dashboard')
                    ]);
                } catch (\Exception $dbEx) {
                    Log::error("Pi Auth DB/Login Error: " . $dbEx->getMessage());
                    return response()->json(['error' => 'Database/Login Error: ' . $dbEx->getMessage()], 500);
                }
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
