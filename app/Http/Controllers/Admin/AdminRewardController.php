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
            $amountStr = number_format((float) $request->amount, 3, '.', '');
            $createResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments", [
                    'payment' => [
                        'amount'   => (float) $amountStr,
                        'memo'     => "Bliyyan Reward", // Simplified memo
                        'metadata' => ['id' => (string) ($user->id ?? 0)], // Extremely simple metadata
                        'uid' => (string) $piUid,
                    ],
                    'payment_type' => 'A2U',
                ]);

            Log::info("A2U Create Response: " . $createResponse->body());

            if (!$createResponse->successful()) {
                Log::error("A2U Create Failed: " . $createResponse->body());
                $errorData = $createResponse->json();
                
                // If there's an ongoing payment, store the ID so the user can cancel it
                if (($errorData['error'] ?? '') === 'ongoing_payment_found') {
                    $stuckId = $errorData['payment']['identifier'] ?? null;
                    return back()->with('error', 'Transaksi Tertunda Ditemukan: Silakan batalkan transaksi yang sedang berjalan (ID: ' . $stuckId . ') sebelum mencoba lagi.')
                                 ->with('stuck_payment_id', $stuckId);
                }

                return back()->with('error', 'Gagal membuat pembayaran: ' . ($errorData['error_type'] ?? $createResponse->body()));
            }

            $payment = $createResponse->json();
            $paymentId = $payment['identifier'] ?? null;

            if (!$paymentId) {
                return back()->with('error', 'Payment ID tidak ditemukan dari response Pi API.');
            }

            // Step 2: Approve the payment (This gets the transaction payload)
            $approveResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/approve");

            Log::info("A2U Approve Response: " . $approveResponse->body());

            $approvedData = $approveResponse->json();
            
            // Handle "already_approved" gracefully
            if (!$approveResponse->successful() && ($approvedData['error'] ?? '') === 'already_approved') {
                Log::info("A2U: Payment $paymentId was already approved. Fetching current state...");
                $approvedData = $approvedData['payment'] ?? null;
            } elseif (!$approveResponse->successful()) {
                Log::error("A2U Approve Failed: " . $approveResponse->body());
                return back()->with('error', 'Gagal approve pembayaran: ' . ($approvedData['error_type'] ?? $approveResponse->body()))
                             ->with('stuck_payment_id', $paymentId);
            }

            // Step 3: BUILD, SIGN, and SUBMIT directly to Blockchain (MANUAL MODE)
            $walletSeed = config('services.pi.wallet_seed');
            if (!$walletSeed) {
                return back()->with('error', 'PI_WALLET_SEED belum dikonfigurasi di file .env');
            }

            // Get target address
            $destAddress = $approvedData['to_address'] ?? ($approvedData['payment']['to_address'] ?? null);
            if (!$destAddress) {
                $getRes = Http::withoutVerifying()->withHeader('Authorization', 'Key ' . $apiKey)->get("{$apiUrl}/payments/{$paymentId}");
                $getData = $getRes->json();
                $destAddress = $getData['to_address'] ?? ($getData['payment']['to_address'] ?? null);
            }

            if (!$destAddress) {
                return back()->with('error', 'Gagal mendapatkan alamat wallet tujuan (Destination Address).')
                             ->with('stuck_payment_id', $paymentId);
            }

            $workingNode = $this->getBestHorizonUrl();
            Log::info("A2U Reward: Constructing manual transaction to $destAddress via $workingNode");

            $nodeScript = base_path('sign_pi.js');
            $amountStr = number_format((float) $request->amount, 7, '.', '');
            
            // Command: build <seed> <destination> <amount> <memoText> <horizonUrl>
            $command = "node $nodeScript build \"$walletSeed\" \"$destAddress\" \"$amountStr\" \"$paymentId\" \"$workingNode\"";
            $output = shell_exec($command);
            $result = json_decode($output, true);

            Log::info("A2U Reward Blockchain Result: " . $output);

            if (!isset($result['success']) || !$result['success']) {
                $errMsg = $result['error'] ?? 'Gagal melakukan signing transaksi blockchain.';
                return back()->with('error', 'Blockchain Error: ' . (is_array($errMsg) ? json_encode($errMsg) : $errMsg))
                             ->with('stuck_payment_id', $paymentId);
            }

            $txid = $result['txid'];

            // Step 4: Complete the payment on Pi Server
            $completeResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/complete", [
                    'txid' => $txid,
                ]);

            Log::info("A2U Reward Complete Status: " . $completeResponse->status());

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
            return back()->with('success', "Reward π{$request->amount} BERHASIL dikirim via Blockchain ke {$user->name}!");

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

            $amountStr = number_format((float) $request->amount, 3, '.', '');
            $createResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments", [
                    'payment' => [
                        'amount'   => (float) $amountStr,
                        'memo'     => "Reward",
                        'metadata' => ['reward_type' => 'manual'],
                        'uid'      => (string) $piUid,
                    ],
                    'payment_type' => 'A2U',
                ]);

            Log::info("A2U Direct Create: " . $createResponse->body());

            if (!$createResponse->successful()) {
                $errorData = $createResponse->json();
                $message = 'Gagal membuat pembayaran: ' . ($errorData['error_type'] ?? $createResponse->body());
                $stuckId = null;

                if (($errorData['error'] ?? '') === 'ongoing_payment_found') {
                    $stuckId = $errorData['payment']['identifier'] ?? null;
                    $message = 'Ada transaksi nyangkut (ID: ' . $stuckId . '). Silakan batalkan dulu.';
                }

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'raw'     => $errorData,
                    'stuck_payment_id' => $stuckId
                ], 400);
            }

            $payment = $createResponse->json();
            $paymentId = $payment['identifier'] ?? null;

            // Step 2: Approve
            $approveResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/approve");

            Log::info("A2U Direct Approve: " . $approveResponse->body());
            $approvedData = $approveResponse->json();

            if (!$approveResponse->successful() && ($approvedData['error'] ?? '') === 'already_approved') {
                $approvedData = $approvedData['payment'] ?? null;
            } elseif (!$approveResponse->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal approve: ' . ($approvedData['error_type'] ?? $approveResponse->body()),
                    'stuck_payment_id' => $paymentId
                ], 400);
            }

            // Step 3: BUILD, SIGN, and SUBMIT directly to Blockchain (MANUAL MODE)
            $walletSeed = config('services.pi.wallet_seed');
            if (!$walletSeed) {
                return response()->json(['success' => false, 'message' => 'PI_WALLET_SEED belum dikonfigurasi.'], 400);
            }

            // Get target address
            $destAddress = $approvedData['to_address'] ?? ($approvedData['payment']['to_address'] ?? null);
            if (!$destAddress) {
                $getRes = Http::withoutVerifying()->withHeader('Authorization', 'Key ' . $apiKey)->get("{$apiUrl}/payments/{$paymentId}");
                $getData = $getRes->json();
                $destAddress = $getData['to_address'] ?? ($getData['payment']['to_address'] ?? null);
            }

            if (!$destAddress) {
                return response()->json(['success' => false, 'message' => 'Gagal mendapatkan alamat wallet tujuan.'], 400);
            }

            $workingNode = $this->getBestHorizonUrl();
            $nodeScript = base_path('sign_pi.js');
            $amountStr = number_format((float) $request->amount, 7, '.', '');
            
            // Command: build <seed> <destination> <amount> <memoText> <horizonUrl>
            $command = "node $nodeScript build \"$walletSeed\" \"$destAddress\" \"$amountStr\" \"$paymentId\" \"$workingNode\"";
            $output = shell_exec($command);
            $result = json_decode($output, true);

            Log::info("A2U Direct Blockchain Result: " . $output);

            if (!isset($result['success']) || !$result['success']) {
                $errMsg = $result['error'] ?? 'Gagal melakukan signing transaksi blockchain.';
                return response()->json(['success' => false, 'message' => 'Blockchain Error: ' . (is_array($errMsg) ? json_encode($errMsg) : $errMsg)], 400);
            }

            $txid = $result['txid'];

            // Step 4: Complete the payment on Pi Server
            Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/complete", ['txid' => $txid]);

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
                'message'    => "Reward π{$request->amount} BERHASIL dikirim via Blockchain!",
                'payment_id' => $paymentId,
                'txid'       => $txid,
            ]);

        } catch (\Exception $e) {
            Log::error("A2U Direct Exception: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Cancel a stuck A2U payment identifier.
     */
    public function cancelStuckPayment(Request $request)
    {
        $request->validate(['payment_id' => 'required|string']);
        $apiKey = config('services.pi.api_key');
        $apiUrl = config('services.pi.api_url');
        $paymentId = $request->payment_id;

        try {
            Log::info("A2U: Attempting to CANCEL stuck payment: {$paymentId}");

            $response = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/cancel");

            Log::info("A2U Cancel Response for {$paymentId}: Status " . $response->status() . " Body: " . $response->body());

            if ($response->successful() || $response->status() === 400) {
                // Status 400 often means it's already cancelled or not found (which is good for us)
                session()->forget('stuck_payment_id');
                return response()->json([
                    'success' => true, 
                    'message' => 'Perintah pembatalan dikirim. Silakan cek status kembali.',
                    'api_status' => $response->status(),
                    'api_response' => $response->json()
                ]);
            }

            return response()->json([
                'success' => false, 
                'message' => 'Gagal membatalkan: ' . $response->body()
            ], 400);
        } catch (\Exception $e) {
            Log::error("A2U Cancel Exception: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Check for any incomplete A2U payments on Pi Server.
     */
    public function checkIncompletePayments()
    {
        $apiKey = config('services.pi.api_key');
        $apiUrl = config('services.pi.api_url');
        $walletAddress = "GBJMXW5TOWM7CFUYBXWEJE5NJ33X7I2RFVPFC7J67MY4AAF5A3OQ5TC6";

        try {
            // 1. Fetch Incomplete Payments from Pi API
            $paymentsResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->get("{$apiUrl}/payments/incomplete_server_payments");

            // 2. Fetch Wallet Balance from BEST working Horizon node
            $balance = "N/A";
            $workingNode = rtrim($this->getBestHorizonUrl(), '/');
            
            try {
                $horizonUrl = "{$workingNode}/accounts/{$walletAddress}";
                Log::info("A2U: Fetching balance from $horizonUrl");
                
                // Increase timeout for real balance fetch to 10s
                $horizonRes = Http::withoutVerifying()
                    ->withHeaders(['User-Agent' => 'PiNetwork-A2U-Diagnostic/1.0'])
                    ->timeout(10)
                    ->get($horizonUrl);
                if ($horizonRes->successful()) {
                    $balances = $horizonRes->json()['balances'] ?? [];
                    foreach ($balances as $b) {
                        if (($b['asset_type'] ?? '') === 'native') {
                            $balance = $b['balance'];
                            break;
                        }
                    }
                } else {
                    Log::error("A2U: Horizon balance call failed on $workingNode. Status: " . $horizonRes->status() . " Body: " . $horizonRes->body());
                }
            } catch (\Exception $e) {
                Log::warning("Horizon balance fetch exception on $workingNode: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'data'    => $paymentsResponse->json(),
                'balance' => $balance,
                'address' => $walletAddress,
                'node'    => $workingNode
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Find the most responsive Horizon node.
     */
    private function getBestHorizonUrl()
    {
        $nodes = [
            'https://api.testnet.minepi.com',
            'https://rpc.testnet.minepi.com',
            'http://18.138.151.181:8000',
            'https://horizon-testnet.pi2.network', // Moved to bottom as it's dns-blocked
        ];

        foreach ($nodes as $node) {
            try {
                // Check if we can reach the node root. MUST be 200.
                $response = Http::withoutVerifying()
                    ->withHeaders(['User-Agent' => 'PiNetwork-A2U-Diagnostic/1.0'])
                    ->timeout(3)
                    ->get(rtrim($node, '/'));
                
                if ($response->successful()) { 
                    Log::info("A2U: Found working node: $node (Status: " . $response->status() . ")");
                    return $node;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        Log::error("A2U: ALL blockchain nodes failed. Defaulting to primary.");
        return $nodes[0]; 
    }
}
