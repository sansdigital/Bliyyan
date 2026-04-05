<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Order;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Stats logic
        $stats = [
            'pending'    => $user->orders()->where('status', 'pending')->count(),
            'processing' => $user->orders()->whereIn('status', ['paid', 'processing'])->count(),
            'shipped'    => $user->orders()->where('status', 'shipped')->count(),
            'to_review'  => $user->orders()->where('status', 'delivered')
                                ->whereDoesntHave('reviews')
                                ->count(),
        ];

        // Recommendations
        $products = Product::with('category')
            ->where('is_active', true)
            ->latest()
            ->take(15)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'products' => $products,
        ]);
    }
}
