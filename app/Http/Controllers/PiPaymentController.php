<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PiPaymentController extends Controller
{
    public function approve(Request $request)
    {
        $id = $request->paymentId;
        $orderId = $request->order_id;
        Log::info("Pi Approve Payment: " . $id . " for order: " . $orderId);

        try {
            $response = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . config('services.pi.api_key'))
                ->post(config('services.pi.api_url') . "/payments/{$id}/approve");

            if ($response->successful()) {
                // Create a Payment record linking this pi_payment_id to the order
                if ($orderId) {
                    $order = Order::find($orderId);
                    if ($order) {
                        Payment::updateOrCreate(
                            ['pi_payment_id' => $id],
                            [
                                'order_id' => $order->id,
                                'amount'   => $order->total_price,
                                'status'   => 'pending',
                            ]
                        );
                    }
                }

                Log::info("Payment approved by server: " . $id);
                return response()->json(["message" => "Approved"]);
            }

            Log::error("Pi Approve Failed: " . $response->body());
            return response()->json(["error" => "Approve failed"], 400);
        } catch (\Exception $e) {
            Log::error("Pi Approve Exception: " . $e->getMessage());
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }


    public function complete(Request $request)
    {
        $id = $request->paymentId;
        $txid = $request->txid;
        Log::info("Pi Completing Payment: " . $id . " Tx: " . $txid);

        try {
            $response = Http::withoutVerifying()
                ->withHeader('Authorization', 'Key ' . config('services.pi.api_key'))
                ->post(config('services.pi.api_url') . "/payments/{$id}/complete", [
                    'txid' => $txid
                ]);


            if ($response->successful()) {
                $payment = Payment::where('pi_payment_id', $id)->first();
                if ($payment) {
                    $payment->update([
                        'status'       => 'completed',
                        'raw_response' => $response->json(),
                    ]);

                    $order = $payment->order;
                    if ($order && !in_array($order->status, ['refunded', 'cancelled'])) {
                        $order->update(['status' => 'paid']);

                        // Reduce stock for each item in the order
                        foreach ($order->items as $item) {
                            $product = $item->product;
                            if ($product) {
                                $product->decrement('stock', $item->quantity);
                            }
                        }
                    }
                } else {
                    // Fallback: find order by order_id and mark as paid
                    $orderId = $request->order_id;
                    if ($orderId) {
                        $order = Order::find($orderId);
                        if ($order && !in_array($order->status, ['refunded', 'cancelled'])) {
                            $order->update(['status' => 'paid']);
                            Payment::create([
                                'order_id'     => $order->id,
                                'pi_payment_id' => $id,
                                'amount'       => $order->total_price,
                                'status'       => 'completed',
                                'raw_response' => $response->json(),
                            ]);
                        }
                    }
                }

                Log::info("Payment completed by server: " . $id);
                return response()->json(["message" => "Completed"]);
            }
            
            Log::error("Pi Complete Failed: " . $response->body());
            return response()->json(["error" => "Complete failed"], 400);
        } catch (\Exception $e) {
            Log::error("Pi Complete Exception: " . $e->getMessage());
            return response()->json(["error" => $e->getMessage()], 500);
        }
    }

    public function cancel(Request $request)
    {
        $id = $request->paymentId;
        Log::info("Pi Cancelled Payment: " . $id);
        
        $payment = Payment::where('pi_payment_id', $id)->first();
        if ($payment) {
            $payment->update(['payment_status' => 'cancelled']);
            $payment->order->update(['status' => 'cancelled']);
        }

        return response()->json(["message" => "Cancelled"]);
    }

    public function createOrder(Request $request)
    {
        $discountAmount = 0;
        $voucherId = null;
        $shippingAddress = 'Alamat belum diatur';

        if ($request->has('address_id')) {
            $address = \App\Models\UserAddress::where('user_id', auth()->id())
                ->where('id', $request->address_id)
                ->first();
            if ($address) {
                $shippingAddress = "{$address->recipient_name} ({$address->phone_number})\n{$address->address_line_1}" . 
                                  ($address->address_line_2 ? ", {$address->address_line_2}" : "") . 
                                  "\n{$address->city}, {$address->province}, {$address->postal_code}";
            }
        }

        if ($request->has('discount_code') && $request->discount_code) {
            $voucher = \App\Models\Voucher::where('code', $request->discount_code)
                ->where('is_active', true)
                ->first();
            
            if ($voucher && $voucher->isValid()) {
                $voucherId = $voucher->id;
            }
        }

        if ($request->has('cart_checkout') && $request->cart_checkout) {
            $user = auth()->user();
            $cart = \App\Models\Cart::where('user_id', $user->id)->first();
            
            if (!$cart || $cart->items->isEmpty()) {
                return response()->json(['error' => 'Keranjang kosong.'], 400);
            }

            $subtotal = 0;
            $memoNames = [];
            
            $order = Order::create([
                'user_id' => $user->id,
                'total_price' => 0,
                'status' => 'pending',
                'shipping_address' => $shippingAddress,
                'voucher_id' => $voucherId
            ]);

            foreach ($cart->items as $item) {
                $product = $item->product;
                if ($product->stock < $item->quantity) {
                    return response()->json(['error' => "Stok produk {$product->name} tidak mencukupi."], 400);
                }

                $itemPrice = $product->price * $item->quantity;
                $subtotal += $itemPrice;
                $memoNames[] = $product->name;

                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'price' => $product->price
                ]);
            }

            if ($voucherId) {
                $voucher = \App\Models\Voucher::find($voucherId);
                if ($subtotal >= $voucher->min_purchase) {
                    $discountAmount = $voucher->calculateDiscount($subtotal);
                    $voucher->increment('used_count');
                }
            }

            $finalPrice = $subtotal - $discountAmount;
            $order->update([
                'total_price' => $finalPrice,
                'discount_amount' => $discountAmount
            ]);
            
            $cart->items()->delete();

            return response()->json([
                'order_id' => $order->id,
                'amount' => (float)$finalPrice,
                'memo' => "Pembelian " . implode(', ', array_slice($memoNames, 0, 2)) . (count($memoNames) > 2 ? ' dll' : '') . " di Bliyyan"
            ]);
        }

        $product = Product::findOrFail($request->product_id);
        $subtotal = $product->price;

        if ($voucherId) {
            $voucher = \App\Models\Voucher::find($voucherId);
            if ($subtotal >= $voucher->min_purchase) {
                $discountAmount = $voucher->calculateDiscount($subtotal);
                $voucher->increment('used_count');
            }
        }

        $finalPrice = $subtotal - $discountAmount;
        
        $order = Order::create([
            'user_id' => auth()->id(),
            'total_price' => $finalPrice,
            'discount_amount' => $discountAmount,
            'voucher_id' => $voucherId,
            'status' => 'pending',
            'shipping_address' => $shippingAddress
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => $product->price
        ]);

        return response()->json([
            'order_id' => $order->id,
            'amount' => (float)$finalPrice,
            'memo' => "Pembelian " . $product->name . " di Bliyyan"
        ]);
    }
}
