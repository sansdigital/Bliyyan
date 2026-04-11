<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

use App\Models\Order;
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
        if (!in_array($order->status, ['paid', 'processing', 'shipped', 'completed'])) {
            return back()->with('error', 'Pesanan ini tidak dapat di-refund pada status saat ini.');
        }

        $user = $order->user;
        if (!$user->pi_uid) {
            return back()->with('error', 'User tidak memiliki Pi UID yang valid.');
        }

        $piUid = str_replace('@pi.network', '', $user->pi_uid);
        $apiKey = config('services.pi.api_key');
        $apiUrl = config('services.pi.api_url');

        try {
            Log::info("Processing Refund for Order #{$order->id} to User {$user->name} (UID: {$piUid})");

            // Step 1: Create the A2U payment for refund
            $createResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments", [
                    'payment' => [
                        'amount'   => (float) $order->total_price,
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
                throw new \Exception($createResponse->body());
            }

            $paymentData = $createResponse->json();
            $paymentId = $paymentData['identifier'];

            // Step 2: Approve the payment
            $approveResponse = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . $apiKey)
                ->post("{$apiUrl}/payments/{$paymentId}/approve");

            if ($approveResponse->failed()) {
                throw new \Exception($approveResponse->body());
            }

            $approveData = $approveResponse->json();
            $txid = $approveData['transaction']['txid'] ?? null;

            // Step 3: Complete the payment
            if ($txid) {
                $completeResponse = Http::withoutVerifying()
                    ->withHeader('Authorization', 'Key ' . $apiKey)
                    ->post("{$apiUrl}/payments/{$paymentId}/complete", [
                        'txid' => $txid
                    ]);
                
                if ($completeResponse->failed()) {
                    throw new \Exception($completeResponse->body());
                }

                // Update Order Status
                Log::info("REFUND: Attempting to update Order #{$order->id} status to 'refunded'");
                $order->update(['status' => 'refunded']);

                // Update associated Payment status to prevent auto-sync issues
                if ($order->payment) {
                    Log::info("REFUND: Attempting to update Payment for Order #{$order->id} to 'refunded'");
                    $order->payment->update(['status' => 'refunded']);
                }
                
                Log::info("REFUND: Order #{$order->id} successfully updated to 'refunded' in DB");

                return back()->with('success', "Refund senilai π{$order->total_price} berhasil dikirim ke user.");
            }

            return back()->with('error', 'Gagal mendapatkan TXID dari Pi Network.');

        } catch (\Exception $e) {
            Log::error("Refund Error Order #{$order->id}: " . $e->getMessage());
            $error = json_decode($e->getMessage(), true);
            $errorMsg = $error['error_message'] ?? $e->getMessage();
            return back()->with('error', 'Gagal memproses refund: ' . $errorMsg);
        }
    }
}
