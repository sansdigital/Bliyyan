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
                // EXPLICIT LOCK: Prevent any other process (webhooks/sync) from touching this order
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

                $approveData = $approveResponse->json();
                $txid = $approveData['transaction']['txid'] ?? null;

                if (!$txid) {
                    throw new \Exception("No TXID returned from Pi Network during approval.");
                }

                // 3. Complete
                $completeResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/complete", [
                        'txid' => $txid
                    ]);
                
                if ($completeResponse->failed()) {
                    throw new \Exception("Complete Failure: " . $completeResponse->body());
                }

                // CRITICAL: Final Database Sync
                $order->update(['status' => 'refunded']);
                if ($order->payment) {
                    $order->payment->update(['status' => 'refunded']);
                }

                Log::info("REFUND SUCCESS: Order #{$order->id} explicitly locked and finalized as 'refunded'");

                return response()->json([
                    'success' => "Refund senilai π{$order->total_price} berhasil dikirim ke user.",
                    'status' => 'refunded'
                ]);
            });

        } catch (\Exception $e) {
            Log::error("Refund Critical Error Order #{$order->id}: " . $e->getMessage());
            return response()->json(['error' => 'Gagal memproses refund: ' . $e->getMessage()], 500);
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
            Log::info("MANUAL SYNC: Attempting to clear stuck payment $paymentId");

            // 1. Get payment info to see status
            $getResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->get("{$apiUrl}/payments/{$paymentId}");

            if ($getResponse->failed()) {
                throw new \Exception("Fetch Stuck Payment Failed: " . $getResponse->body());
            }

            $paymentData = $getResponse->json();

            // 2. If already approved but not completed, try to complete
            if (isset($paymentData['status']['developer_approved']) && $paymentData['status']['developer_approved'] === true) {
                
                // For A2U, if we don't have TXID, approval usually initiated it
                $txid = $paymentData['transaction']['txid'] ?? 'RECOVERY-' . time();

                $completeResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/complete", [
                        'txid' => $txid
                    ]);

                if ($completeResponse->successful()) {
                    return response()->json(['success' => "Payment $paymentId successfully SYNCED and cleared."]);
                }
            }

            // 3. Fallback: If not approved, try to cancel it
            $cancelResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/cancel");

            return response()->json(['success' => "Stuck payment $paymentId handled. Please try your refund again."]);

        } catch (\Exception $e) {
            Log::error("Manual Sync Error: " . $e->getMessage());
            return response()->json(['error' => 'Gagal sinkronisasi: ' . $e->getMessage()], 500);
        }
    }
}
