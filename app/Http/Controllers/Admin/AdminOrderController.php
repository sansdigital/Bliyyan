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

    public function refund(Order $order)
    {
        try {
            return DB::transaction(function () use ($order) {
                // LOCK the order row to prevent race conditions
                $order = Order::where('id', $order->id)->lockForUpdate()->first();

                if ($order->status === 'refunded') {
                    return response()->json(['error' => 'Pesanan ini sudah di-refund sebelumnya.'], 400);
                }

                if (!in_array($order->status, ['paid', 'processing', 'shipped', 'completed'])) {
                    return response()->json(['error' => 'Status pesanan saat ini tidak mendukung refund.'], 400);
                }

                $user = $order->user;
                if (!$user->pi_uid) {
                    return response()->json(['error' => 'User tidak memiliki Pi UID yang valid.'], 400);
                }

                $piUid = str_replace('@pi.network', '', $user->pi_uid);
                $apiKey = config('services.pi.api_key');
                $apiUrl = config('services.pi.api_url');

                Log::info("START REFUND: Order #{$order->id} (User: {$user->name}, UID: {$piUid})");

                // 1. Create the A2U payment
                $createResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments", [
                        'payment' => [
                            'amount'   => (float)$order->total_price,
                            'memo'     => "Refund for Order #" . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                            'metadata' => [
                                'type'     => 'refund',
                                'order_id' => $order->id,
                            ],
                            'uid' => $piUid,
                        ],
                        'payment_type' => 'A2U',
                    ]);

                if ($createResponse->failed()) {
                    throw new \Exception("Create Payment Failure: " . $createResponse->body());
                }

                $paymentData = $createResponse->json();
                $paymentId = $paymentData['identifier'];

                // 2. Approve
                $approveResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/approve");

                if ($approveResponse->failed()) {
                    throw new \Exception("Approve Failure: " . $approveResponse->body());
                }

                // 3. INTERNAL POLLING for TXID (Blockchain delay handling)
                $txid = null;
                for ($i = 0; $i < 5; $i++) {
                    Log::info("Polling for TXID: Attempt $i for Payment $paymentId");
                    
                    $checkResponse = Http::withoutVerifying()
                        ->withHeader('Authorization', 'Key ' . $apiKey)
                        ->get("{$apiUrl}/payments/{$paymentId}");
                    
                    if ($checkResponse->successful()) {
                        $checkData = $checkResponse->json();
                        $txid = $checkData['transaction']['txid'] ?? null;
                        if ($txid) break;
                    }
                    
                    sleep(1); // Wait for blockchain
                }

                if (!$txid) {
                    throw new \Exception("Transaxion ID (TXID) belum muncul di Blockchain Pi setelah Approval. ID: $paymentId. Antrean tersumbat, gunakan tombol Bersihkan Antrean.");
                }

                // 4. Complete
                $completeResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/complete", [
                        'txid' => $txid
                    ]);
                
                if ($completeResponse->failed()) {
                    throw new \Exception("Complete Failure: " . $completeResponse->body());
                }

                // Final Database Sync
                $order->update(['status' => 'refunded']);
                if ($order->payment) {
                    $order->payment->update(['status' => 'refunded']);
                }

                Log::info("REFUND SUCCESS: Order #{$order->id} finalized as 'refunded'");

                return response()->json([
                    'success' => "Refund senilai π{$order->total_price} berhasil dikirim ke user.",
                    'status' => 'refunded'
                ]);
            });

        } catch (\Exception $e) {
            Log::error("Refund Critical Error Order #{$order->id}: " . $e->getMessage());
            return response()->json(['error' => 'Gagal memproses refund: ' . $e->getMessage()], 500);
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
            Log::info("MANUAL SYNC START: Payment ID $paymentId");

            // 1. Get payment info
            $getResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->get("{$apiUrl}/payments/{$paymentId}");

            if ($getResponse->failed()) {
                throw new \Exception("Gagal mengambil data dari Pi Server: " . $getResponse->body());
            }

            $paymentData = $getResponse->json();

            // Check if transaction exists on blockchain
            $txid = $paymentData['transaction']['txid'] ?? null;
            $isApproved = $paymentData['status']['developer_approved'] ?? false;
            $isCompleted = $paymentData['status']['developer_completed'] ?? false;

            if ($isCompleted) {
                return response()->json(['success' => "Transaksi ini sebenarnya sudah Selesai (Completed) di server Pi. Status diperbarui."]);
            }

            if ($isApproved) {
                if (!$txid) {
                    return response()->json(['error' => 'Blockchain Pi masih memproses transaksi ini (TXID Kosong). Mohon tunggu 1-2 menit lalu klik lagi.'], 422);
                }

                // Try to Complete
                $completeResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/complete", [
                        'txid' => $txid
                    ]);

                if ($completeResponse->successful()) {
                    return response()->json(['success' => "Antrean dibersihkan! Transaksi $paymentId berhasil diselesaikan (Completed)."]);
                } else {
                    return response()->json(['error' => 'Gagal menyelesaikan: ' . $completeResponse->body()], 400);
                }
            }

            // If not even approved, try to Cancel
            $cancelResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/cancel");

            return response()->json(['success' => "Transaksi menggantung berhasil dibatalkan (Cancelled). Anda bisa mencoba refund kembali sekarang."]);

        } catch (\Exception $e) {
            Log::error("Manual Sync Error: " . $e->getMessage());
            return response()->json(['error' => 'Pembersihan Gagal: ' . $e->getMessage()], 500);
        }
    }
}
