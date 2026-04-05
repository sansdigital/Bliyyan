<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

use Inertia\Inertia;

class CartController extends Controller
{
    /**
     * Get the current user's cart.
     */
    public function index()
    {
        $cart = Cart::firstOrCreate(['user_id' => Auth::id()]);
        
        $cartItems = $cart->items()->with('product')->get();
        
        return Inertia::render('Cart/Index', [
            'cart' => $cart,
            'items' => $cartItems,
            'addresses' => Auth::user()->addresses()->latest()->get()
        ]);
    }

    /**
     * Add a product to the cart.
     */
    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $cart = Cart::firstOrCreate(['user_id' => Auth::id()]);

        $product = Product::findOrFail($request->product_id);

        if ($product->stock < $request->quantity) {
            return response()->json(['error' => 'Stok produk tidak mencukupi.'], 400);
        }

        $cartItem = $cart->items()->where('product_id', $request->product_id)->first();

        if ($cartItem) {
            // Check if adding to existing quantity exceeds stock
            if ($cartItem->quantity + $request->quantity > $product->stock) {
                return response()->json(['error' => 'Total kuantitas melebihi stok yang tersedia.'], 400);
            }
            $cartItem->quantity += $request->quantity;
            $cartItem->save();
        } else {
            $cartItem = $cart->items()->create([
                'product_id' => $request->product_id,
                'quantity' => $request->quantity
            ]);
        }

        return response()->json([
            'message' => 'Produk berhasil ditambahkan ke keranjang.',
            'item' => $cartItem
        ]);
    }

    /**
     * Update quantity of a cart item.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $cartItem = CartItem::whereHas('cart', function($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($id);

        if ($cartItem->product->stock < $request->quantity) {
            return response()->json(['error' => 'Kuantitas melebihi stok.'], 400);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json([
            'message' => 'Kuantitas berhasil diperbarui.',
            'item' => $cartItem
        ]);
    }

    /**
     * Remove an item from the cart.
     */
    public function remove($id)
    {
        $cartItem = CartItem::whereHas('cart', function($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($id);

        $cartItem->delete();

        return response()->json(['message' => 'Produk dihapus dari keranjang.']);
    }
}
