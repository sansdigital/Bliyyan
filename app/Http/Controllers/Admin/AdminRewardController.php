<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Inertia\Inertia;

class AdminRewardController extends Controller
{
    /**
     * Show the reward management page.
     */
    public function index()
    {
        $users = User::whereNotNull('pi_uid')
            ->where('is_admin', false)
            ->select('id', 'name', 'pi_uid', 'created_at')
            ->latest()
            ->get();

        // Get existing reward transaction log from our records
        $rewardLog = \App\Models\PiReward::with('user')
            ->latest()
            ->get();

        return Inertia::render('Admin/Rewards/Index', [
            'users'     => $users,
            'rewardLog' => $rewardLog,
        ]);
    }

    /**
     * Send App-to-User (A2U) Pi payment to a specific user.
     */
    public function send(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount'  => 'required|numeric|min:0.001|max:10',
            'memo'    => 'required|string|max:255',
        ]);

        $user = User::findOrFail($request->user_id);
        $piUid = str_replace('@pi.network', '', $user->pi_uid);

        if (!$piUid) {
            return back()->with('error', 'User belum memiliki Pi UID (belum login via Pi Browser).');
        }

        $apiKey = config('services.pi.api_key');
        $apiUrl = config('services.pi.api_url');

        try {
            Log::info("A2U Reward: Sending {$request->amount} Pi to user {$user->name} (UID: {$piUid})");

            // Step 1: Create the A2U payment
            $createResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments", [
                    'payment' => [
                        'amount'   => (float) $request->amount,
                        'memo'     => $request->memo,
                        'metadata' => [
                            'type'    => 'reward',
                            'user_id' => $user->id,
                        ],
                        'uid' => $piUid,
                    ],
                    'payment_type' => 'A2U',
                ]);

            Log::info("A2U Create Response: " . $createResponse->body());

            if (!$createResponse->successful()) {
                Log::error("A2U Create Failed: " . $createResponse->body());
                return back()->with('error', 'Gagal membuat pembayaran: ' . ($createResponse->json()['error_type'] ?? $createResponse->body()));
            }

            $payment = $createResponse->json();
            $paymentId = $payment['identifier'] ?? null;

            if (!$paymentId) {
                return back()->with('error', 'Payment ID tidak ditemukan dari response Pi API.');
            }

            // Step 2: Approve the payment
            $approveResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/approve");

            Log::info("A2U Approve Response: " . $approveResponse->body());

            if (!$approveResponse->successful()) {
                Log::error("A2U Approve Failed: " . $approveResponse->body());
                return back()->with('error', 'Gagal approve pembayaran: ' . ($approveResponse->json()['error_type'] ?? $approveResponse->body()));
            }

            // Step 3: Complete the payment (using txid from blockchain)
            $approvedData = $approveResponse->json();
            $txid = $approvedData['transaction']['txid'] ?? null;

            if ($txid) {
                $completeResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/complete", [
                        'txid' => $txid,
                    ]);

                Log::info("A2U Complete Response: " . $completeResponse->body());
            }

            // Save reward record
            \App\Models\PiReward::create([
                'user_id'    => $user->id,
                'pi_uid'     => $user->pi_uid,
                'amount'     => $request->amount,
                'memo'       => $request->memo,
                'payment_id' => $paymentId,
                'txid'       => $txid ?? null,
                'status'     => 'completed',
            ]);

            Log::info("A2U Reward SUCCESS: Payment {$paymentId} sent to {$user->name}");
            return back()->with('success', "Reward π{$request->amount} berhasil dikirim ke {$user->name}!");

        } catch (\Exception $e) {
            Log::error("A2U Reward Exception: " . $e->getMessage());
            return back()->with('error', 'Server Error: ' . $e->getMessage());
        }
    }

    /**
     * Send reward to user identified by pi_uid directly (for manual input).
     */
    public function sendByUid(Request $request)
    {
        $request->validate([
            'pi_uid' => 'required|string',
            'amount' => 'required|numeric|min:0.001|max:10',
            'memo'   => 'required|string|max:255',
        ]);

        $piUid = str_replace('@pi.network', '', $request->pi_uid);
        $apiKey = config('services.pi.api_key');
        $apiUrl = config('services.pi.api_url');

        try {
            Log::info("A2U Direct: Sending {$request->amount} Pi to UID: {$piUid}");

            $createResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments", [
                    'payment' => [
                        'amount'   => (float) $request->amount,
                        'memo'     => $request->memo,
                        'metadata' => ['type' => 'reward'],
                        'uid'      => $piUid,
                    ],
                    'payment_type' => 'A2U',
                ]);

            Log::info("A2U Direct Create: " . $createResponse->body());

            if (!$createResponse->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal membuat pembayaran: ' . ($createResponse->json()['error_type'] ?? $createResponse->body()),
                    'raw'     => $createResponse->json(),
                ], 400);
            }

            $payment = $createResponse->json();
            $paymentId = $payment['identifier'] ?? null;

            // Approve
            $approveResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/approve");

            Log::info("A2U Direct Approve: " . $approveResponse->body());

            $approvedData = $approveResponse->json();
            $txid = $approvedData['transaction']['txid'] ?? null;

            // Complete if txid available
            if ($txid) {
                Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/complete", ['txid' => $txid]);
            }

            // Try to find if user exists in our DB
            $user = User::where('pi_uid', $request->pi_uid)->first();

            \App\Models\PiReward::create([
                'user_id'    => $user?->id,
                'pi_uid'     => $request->pi_uid,
                'amount'     => $request->amount,
                'memo'       => $request->memo,
                'payment_id' => $paymentId,
                'txid'       => $txid,
                'status'     => 'completed',
            ]);

            return response()->json([
                'success'    => true,
                'message'    => "Reward π{$request->amount} berhasil dikirim!",
                'payment_id' => $paymentId,
                'txid'       => $txid,
            ]);

        } catch (\Exception $e) {
            Log::error("A2U Direct Exception: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
