<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Product;
use App\Models\Order;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // 1. Fetch Wallet Balance from Blockchain (Horizon)
        $wallet_balance = 0;
        $wallet_address = config('services.pi.wallet_address');
        $horizon_url    = config('services.pi.horizon_url');

        if ($wallet_address) {
            try {
                $response = Http::withoutVerifying()
                    ->timeout(5)
                    ->get("{$horizon_url}/accounts/{$wallet_address}");

                if ($response->successful()) {
                    $balances = $response->json('balances');
                    foreach ($balances as $balance) {
                        if ($balance['asset_type'] === 'native') {
                            $wallet_balance = $balance['balance'];
                            break;
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::error("Dashboard: Failed to fetch wallet balance: " . $e->getMessage());
                $wallet_balance = 0;
            }
        }

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
                'total_products'  => \App\Models\Product::count(),
                'total_orders'    => \App\Models\Order::count(),
                'total_pi_earned' => \App\Models\Order::where('status', 'paid')->sum('total_price'),
                'pending_orders'  => \App\Models\Order::where('status', 'pending')->count(),
                'today_sales'     => $today_sales,
                'yesterday_sales' => $yesterday_sales,
                'wallet_balance'  => $wallet_balance,
                'wallet_address'  => $wallet_address ? (substr($wallet_address, 0, 4) . '...' . substr($wallet_address, -4)) : null,
            ],
            'order_trends'    => $order_trends,
            'recent_orders'   => \App\Models\Order::with(['user', 'items.product'])
                ->latest()
                ->take(6)
                ->get(),
            'low_stock_products' => \App\Models\Product::where('stock', '<', 5)
                ->where('is_active', true)
                ->orderBy('stock')
                ->take(5)
                ->get(['id', 'name', 'stock', 'image']),
        ]);
    }
}
