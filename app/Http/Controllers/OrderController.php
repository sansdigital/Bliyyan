<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::where('user_id', Auth::id())
            ->with(['items.product'])
            ->latest()
            ->get();

        return Inertia::render('Orders/Index', [
            'orders' => $orders
        ]);
    }

    public function show(Order $order)
    {
        // Ensure user can only see their own orders
        abort_unless($order->user_id === Auth::id(), 403);

        $order->load('items.product');

        return Inertia::render('Orders/Show', [
            'order' => $order
        ]);
    }
}
