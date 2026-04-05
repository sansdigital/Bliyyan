<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Product;
use App\Models\Order;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $today_sales     = Order::where('status', 'paid')->whereDate('created_at', now())->sum('total_price');
        $yesterday_sales = Order::where('status', 'paid')->whereDate('created_at', now()->yesterday())->sum('total_price');

        // Simple 7-day trend (days as name, order count as value)
        $order_trends = collect(range(6, 0))->map(function($i) {
            $date = now()->subDays($i);
            return [
                'name'  => $date->format('j M'),
                'value' => Order::whereDate('created_at', $date)->count(),
            ];
        });

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_products'  => Product::count(),
                'total_orders'    => Order::count(),
                'total_pi_earned' => Order::where('status', 'paid')->sum('total_price'),
                'pending_orders'  => Order::where('status', 'pending')->count(),
                'today_sales'     => $today_sales,
                'yesterday_sales' => $yesterday_sales,
            ],
            'order_trends'    => $order_trends,
            'recent_orders'   => Order::with(['user', 'items.product'])
                ->latest()
                ->take(6)
                ->get(),
            'low_stock_products' => Product::where('stock', '<', 5)
                ->where('is_active', true)
                ->orderBy('stock')
                ->take(5)
                ->get(['id', 'name', 'stock', 'image']),
        ]);
    }
}
