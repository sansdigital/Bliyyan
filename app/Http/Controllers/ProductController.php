<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function show($slug)
    {
        $product = Product::with(['category', 'reviews.user', 'images'])->where('slug', $slug)->firstOrFail();
        
        $can_review = false;
        $active_order = null;
        
        if (auth()->check()) {
            $order = \App\Models\Order::where('user_id', auth()->id())
                ->whereIn('status', ['paid', 'processing', 'shipped', 'completed'])
                ->whereHas('items', function ($q) use ($product) {
                    $q->where('product_id', $product->id);
                })
                ->whereDoesntHave('reviews', function ($q) use ($product) {
                    $q->where('product_id', $product->id);
                })
                ->first();

            if ($order) {
                $can_review = true;
                $active_order = $order;
            }
        }

        return Inertia::render('Products/Show', [
            'product' => $product,
            'can_review' => $can_review,
            'active_order_id' => $active_order ? $active_order->id : null,
            'addresses' => auth()->check() ? auth()->user()->addresses()->latest()->get() : [],
            'is_wishlisted' => auth()->check() ? auth()->user()->wishlists()->where('product_id', $product->id)->exists() : false,
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->get('q', '');

        $products = Product::with('category')
            ->where('is_active', true)
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->latest()
            ->get();

        $categories = Category::withCount(['products' => fn($q) => $q->where('is_active', true)])->get();

        return Inertia::render('Products/Search', [
            'products'   => $products,
            'categories' => $categories,
            'query'      => $query,
        ]);
    }

    public function byCategory(Category $category)
    {
        $products = Product::with('category')
            ->where('category_id', $category->id)
            ->where('is_active', true)
            ->latest()
            ->get();

        $categories = Category::withCount(['products' => fn($q) => $q->where('is_active', true)])->get();

        return Inertia::render('Products/Search', [
            'products'         => $products,
            'categories'       => $categories,
            'query'            => '',
            'active_category'  => $category,
        ]);
    }
}
