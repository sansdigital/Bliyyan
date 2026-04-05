<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Review;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'order_id' => 'required|exists:orders,id',
        ]);

        // Verify the user owns the order and it's paid/completed
        $order = Order::where('id', $request->order_id)
            ->where('user_id', Auth::id())
            ->whereIn('status', ['paid', 'processing', 'shipped', 'completed'])
            ->whereHas('items', function($q) use ($product) {
                $q->where('product_id', $product->id);
            })
            ->firstOrFail();

        // Check already reviewed for this specific order/product
        if (Review::where('user_id', Auth::id())
                ->where('order_id', $order->id)
                ->where('product_id', $product->id)
                ->exists()) {
            return back()->with('error', 'Anda sudah memberikan ulasan untuk produk ini di pesanan ini.');
        }

        Review::create([
            'user_id' => Auth::id(),
            'product_id' => $product->id,
            'order_id' => $order->id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        return back()->with('success', 'Terima kasih atas ulasan Anda!');
    }
}
