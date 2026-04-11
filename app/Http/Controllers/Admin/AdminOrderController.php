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
                // LOCK the order row
                $order = Order::where('id', $order->id)->lockForUpdate()->first();

                if ($order->status === 'refunded') {
                    return response()->json(['error' => 'Pesanan ini sudah di-refund.'], 400);
                }

                if (!in_array($order->status, ['paid', 'processing', 'shipped', 'completed'])) {
                    return response()->json(['error' => 'Status pesanan tidak mendukung refund.'], 400);
                }

                $user = $order->user;
                if (!$user->pi_uid) {
                    return response()->json(['error' => 'User tidak memiliki Pi UID.'], 400);
                }

                $piUid = str_replace('@pi.network', '', $user->pi_uid);
                $apiKey = config('services.pi.api_key');
                $apiUrl = config('services.pi.api_url');

                Log::info("REFUND ATTEMPT: Order #{$order->id} (User: {$user->name}, UID: {$piUid})");

                // 1. Create A2U Payment
                $createResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments", [
                        'payment' => [
                            'amount'   => (float)$order->total_price,
                            'memo'     => "Refund Order #" . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                            'metadata' => [
                                'type'     => 'refund',
                                'order_id' => $order->id,
                            ],
                            'uid' => $piUid,
                        ],
                        'payment_type' => 'A2U',
                    ]);

                if ($createResponse->failed()) {
                    throw new \Exception("Create Failure: " . $createResponse->body());
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

                // 3. Polling for TXID
                $txid = null;
                for ($i = 0; $i < 5; $i++) {
                    $checkResponse = Http::withoutVerifying()
                        ->withHeader('Authorization', 'Key ' . $apiKey)
                        ->get("{$apiUrl}/payments/{$paymentId}");
                    
                    if ($checkResponse->successful()) {
                        $checkData = $checkResponse->json();
                        $txid = $checkData['transaction']['txid'] ?? null;
                        if ($txid) break;
                    }
                    sleep(1);
                }

                if (!$txid) {
                    throw new \Exception("TXID Kosong (Lag Blockchain). Gunakan tombol Bersihkan Antrean.");
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

                // Final Update
                $order->update(['status' => 'refunded']);
                if ($order->payment) {
                    $order->payment->update(['status' => 'refunded']);
                }

                return response()->json([
                    'success' => "Refund senilai π{$order->total_price} berhasil dikirim.",
                    'status' => 'refunded'
                ]);
            });

        } catch (\Exception $e) {
            Log::error("Refund Critical Error #{$order->id}: " . $e->getMessage());
            return response()->json(['error' => 'Gagal refund: ' . $e->getMessage()], 500);
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
