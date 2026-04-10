<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AdminReportController extends Controller
{
    public function index()
    {
        // 1. Revenue last 7 days
        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $days[] = Carbon::now()->subDays($i)->format('Y-m-d');
        }

        $daily_revenue = Order::where('status', 'paid')
            ->where('created_at', '>=', Carbon::now()->subDays(6)->startOfDay())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_price) as total'))
            ->groupBy('date')
            ->get()
            ->pluck('total', 'date');

        $chart_data = [];
        foreach ($days as $day) {
            $chart_data[] = [
                'date' => Carbon::parse($day)->format('d M'),
                'total' => (float) ($daily_revenue[$day] ?? 0),
            ];
        }

        // 2. Top Selling Products
        $top_products = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(price * quantity) as total_revenue'))
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->with('product:id,name,image')
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get();

        // 3. Order Status Distribution
        $status_stats = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        // 4. Monthly vs Previous Month
        $this_month_revenue = Order::where('status', 'paid')
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('total_price');

        $last_month_revenue = Order::where('status', 'paid')
            ->whereMonth('created_at', Carbon::now()->subMonth()->month)
            ->whereYear('created_at', Carbon::now()->subMonth()->year)
            ->sum('total_price');

        return Inertia::render('Admin/Reports/Index', [
            'chart_data' => $chart_data,
            'top_products' => $top_products,
            'status_stats' => $status_stats,
            'revenue' => [
                'this_month' => (float)$this_month_revenue,
                'last_month' => (float)$last_month_revenue,
                'total_all_time' => (float)Order::where('status', 'paid')->sum('total_price'),
            ]
        ]);
    }

    public function sales()
    {
        $orders = Order::with(['user', 'items.product'])
            ->where('status', 'paid')
            ->latest()
            ->get();

        return Inertia::render('Admin/Reports/Sales', [
            'orders' => $orders
        ]);
    }
}
