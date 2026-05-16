<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\Payment;
use Inertia\Inertia;

class AdminOrderController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Orders/Index', [
            'orders' => Order::with(['user', 'items.product', 'payment'])->latest()->get()
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,paid,processing,shipped,completed,cancelled,refunded',
            'tracking_number' => 'nullable|string|max:255',
            'shipping_courier' => 'nullable|string|max:255',
        ]);

        $order->update($validated);

        return redirect()->back()->with('success', 'Status dan informasi pelacakan pesanan diperbarui.');
    }

    public function refund(Request $request, Order $order)
    {
        try {
            return DB::transaction(function () use ($request, $order) {
                // PHASE 2: Complete the Refund after Frontend Signing
                if ($request->has('txid') && $request->has('payment_id')) {
                    $paymentId = $request->payment_id;
                    $txid = $request->txid;
                    $apiKey = config('services.pi.api_key');
                    $apiUrl = config('services.pi.api_url');

                    $completeResponse = Http::withoutVerifying()
                        ->withHeader('Authorization', 'Key ' . $apiKey)
                        ->post("{$apiUrl}/payments/{$paymentId}/complete", [
                            'txid' => $txid
                        ]);
                    
                    if (!$completeResponse->successful()) {
                        Log::error("REFUND COMPLETE FAILED: " . $completeResponse->body());
                    }

                    // Final Update Local DB
                    $order = Order::where('id', $order->id)->lockForUpdate()->first();
                    $order->update(['status' => 'refunded']);
                    if ($order->payment) {
                        $order->payment->update(['status' => 'refunded']);
                    }

                    return response()->json([
                        'success' => "Refund senilai π{$order->total_price} BERHASIL dikonfirmasi di Blockchain!",
                        'status' => 'refunded',
                        'txid'   => $txid
                    ]);
                }

                // PHASE 1: Prepare the Refund Payload for the Frontend
                $order = Order::where('id', $order->id)->lockForUpdate()->first();

                if ($order->status === 'refunded') {
                    return response()->json(['error' => 'Pesanan ini sudah di-refund.'], 400);
                }

                if (!in_array($order->status, ['paid', 'processing', 'shipped', 'completed'])) {
                    return response()->json(['error' => 'Status pesanan tidak mendukung refund.'], 400);
                }

                if (!$order->user) {
                    return response()->json(['error' => 'Data User untuk pesanan ini tidak ditemukan.'], 400);
                }

                $user = $order->user;
                if (!$user->pi_uid) {
                    return response()->json(['error' => 'User tidak memiliki Pi UID.'], 400);
                }

                $piUid = str_replace('@pi.network', '', $user->pi_uid);
                $apiKey = config('services.pi.api_key');
                $apiUrl = config('services.pi.api_url');
                $walletSeed = config('services.pi.wallet_seed');

                if (!$walletSeed) {
                    throw new \Exception("PI_WALLET_SEED is missing in .env");
                }

                Log::info("REFUND START: Order #{$order->id} (User: {$user->name}, UID: {$piUid})");

                // Step 1: Create A2U Payment record on Pi Server
                $createResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments", [
                        'payment' => [
                            'amount'   => (float)$order->total_price,
                            'memo'     => "Refund Order #" . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                            'metadata' => ['order_id' => (string)$order->id],
                            'uid'      => $piUid,
                        ],
                        'payment_type' => 'A2U',
                    ]);

                $paymentData = $createResponse->json();
                $paymentId = $paymentData['identifier'] ?? null;

                // Handle ongoing payment
                if (!$createResponse->successful()) {
                    if (($paymentData['error'] ?? '') === 'ongoing_payment_found') {
                        $paymentId = $paymentData['payment']['identifier'] ?? null;
                        $stuckUid = $paymentData['payment']['uid'] ?? '';
                        $stuckAmount = (float)($paymentData['payment']['amount'] ?? 0);
                        $currentAmount = (float)$order->total_price;

                        // CRITICAL: Only resume if it belongs to the EXACT SAME user and EXACT SAME amount
                        if ($stuckUid === $piUid && abs($stuckAmount - $currentAmount) < 0.00001) {
                            Log::info("REFUND: Using ongoing payment ID: {$paymentId} (Matching User & Amount)");
                        } else {
                            Log::warning("REFUND: Found mismatched stuck payment. Stuck UID: $stuckUid vs Current UID: $piUid");
                            throw new \Exception("Ditemukan antrean transaksi Pi milik pesanan/user lain yang menggantung di Pi Server. Anda WAJIB menekan tombol \"Bersihkan Antrean\" terlebih dahulu sebelum melanjutkan Refund ini. {\"identifier\":\"$paymentId\"}");
                        }
                    } else {
                        throw new \Exception("Pi API Create Error: " . ($paymentData['message'] ?? $createResponse->body()));
                    }
                }

                if (!$paymentId) {
                    throw new \Exception("Gagal mendapatkan Payment ID dari server Pi.");
                }

                // Step 2: Approve the payment
                $approveResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/approve");

                $approvedData = $approveResponse->json();
                if (!$approveResponse->successful() && ($approvedData['error'] ?? '') !== 'already_approved') {
                    throw new \Exception("Pi API Approve Error: " . $approveResponse->body());
                }

                // Step 3: BUILD, SIGN, and SUBMIT directly to Blockchain (MANUAL MODE)
                // We extract the destination address from the payment data
                $destAddress = $approvedData['to_address'] ?? ($approvedData['payment']['to_address'] ?? null);
                
                // If not in approve response, try to GET it
                if (!$destAddress) {
                    $getRes = Http::withoutVerifying()->withHeader('Authorization', 'Key ' . $apiKey)->get("{$apiUrl}/payments/{$paymentId}");
                    $getData = $getRes->json();
                    $destAddress = $getData['to_address'] ?? ($getData['payment']['to_address'] ?? null);
                }

                if (!$destAddress) {
                    throw new \Exception("Gagal mendapatkan Alamat Wallet tujuan (Destination Address).");
                }

                $horizonUrl = config('services.pi.horizon_url');

                $amountStr = number_format((float)$order->total_price, 7, '.', ''); // Stellar precision
                
                // Handoff to frontend!
                return response()->json([
                    'requires_frontend_signing' => true,
                    'payment_id'   => $paymentId,
                    'dest_address' => $destAddress,
                    'amount'       => $amountStr,
                    'wallet_seed'  => $walletSeed,
                    'horizon_url'  => $horizonUrl
                ]);
            });

        } catch (\Throwable $e) {
            Log::error("Refund Final Error #{$order->id}: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            return response()->json(['error' => 'Gagal refund: ' . $e->getMessage() . " (Line " . $e->getLine() . ")"], 500);
        }
    }

    public function syncStuckPayment(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|string'
        ]);

        $paymentId = $request->payment_id;
        $apiKey = config('services.pi.api_key');
        $apiUrl = config('services.pi.api_url');

        try {
            Log::info("MANUAL SYNC: Fetching payment info for $paymentId");

            $getResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->get("{$apiUrl}/payments/{$paymentId}");

            if ($getResponse->failed()) {
                throw new \Exception("Gagal mengambil data dari Pi Server: " . $getResponse->body());
            }

            $paymentData = $getResponse->json();
            Log::info("DIAGNOSIS DATA for $paymentId: " . json_encode($paymentData));

            $txid = $paymentData['transaction']['txid'] ?? null;
            $isApproved = $paymentData['status']['developer_approved'] ?? false;
            $isCompleted = $paymentData['status']['developer_completed'] ?? false;

            if ($isCompleted) {
                return response()->json(['success' => "Transaksi ini sebenarnya sudah Selesai (Completed)."]);
            }

            // AGGRESSIVE CANCEL: If no TXID (even if approved), try to CANCEL
            if ($isApproved && !$txid) {
                Log::warning("APPROVED BUT NO TXID: Attempting FORCE CANCEL for $paymentId");
                $cancelResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/cancel");
                
                if ($cancelResponse->successful()) {
                    return response()->json(['success' => "Pembersihan Berhasil! Transaksi tanpa TXID berhasil dibatalkan (Force Cancel). Antrean wallet terbuka."]);
                } else {
                    Log::error("FORCE CANCEL FAILED: " . $cancelResponse->body());
                    return response()->json(['error' => 'Gagal Batal Paksa: ' . $cancelResponse->body()], 400);
                }
            }

            // Standard Complete if TXID exists
            if ($isApproved && $txid) {
                $completeResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/complete", ['txid' => $txid]);

                if ($completeResponse->successful()) {
                    return response()->json(['success' => "Pembersihan Berhasil! Transaksi diselesaikan (Completed)."]);
                }
            }

            // Fallback: Cancel anything else
            $cancelResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/cancel");

            return response()->json(['success' => "Pembersihan Selesai (Cancelled). Silakan coba refund kembali."]);

        } catch (\Exception $e) {
            Log::error("Manual Sync Error: " . $e->getMessage());
            return response()->json(['error' => 'Gagal membersihkan antrean: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Order $order)
    {
        try {
            DB::transaction(function () use ($order) {
                // Delete related items first
                $order->items()->delete();
                
                // Delete related payment if exists
                if ($order->payment) {
                    $order->payment->delete();
                }
                
                $order->delete();
            });

            return redirect()->back()->with('success', 'Order #' . str_pad($order->id, 4, '0', STR_PAD_LEFT) . ' has been permanently deleted.');
        } catch (\Exception $e) {
            Log::error("Delete Error Order #{$order->id}: " . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete order.');
        }
    }
}
