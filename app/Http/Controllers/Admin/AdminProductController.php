<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

class AdminProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Product::with(['category.categoryGroup']);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%");
            });
        }

        if ($request->category_group_id) {
            $query->whereHas('category', function($q) use ($request) {
                $q->where('category_group_id', $request->category_group_id);
            });
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        return \Inertia\Inertia::render('Admin/Products/Index', [
            'products'   => $query->latest()->paginate(10)->withQueryString(),
            'categories' => \App\Models\Category::with('categoryGroup')->orderBy('name')->get(),
            'category_groups' => \App\Models\CategoryGroup::orderBy('name')->get(),
            'filters'    => $request->only(['search', 'category_group_id', 'category_id']),
        ]);
    }

    public function create()
    {
        return \Inertia\Inertia::render('Admin/Products/Create', [
            'categories' => \App\Models\Category::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'distributor' => 'nullable|string|max:255',
        ]);

        $validated['slug'] = Str::slug($request->name);
        
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = Str::random(20) . '.webp';
            $path = 'products/' . $filename;
            
            // Process image: 1:1 Center Crop & Resize to 1000x1000, then convert to WebP
            $image = Image::read($file);
            $image->cover(1000, 1000);
            
            Storage::disk('public')->put($path, (string) $image->toWebp(85));
            $validated['image'] = $path;
        }
        
        \App\Models\Product::create($validated);

        return redirect()->route('admin.products.index')->with('success', 'Produk berhasil ditambahkan.');
    }

    public function edit(\App\Models\Product $product)
    {
        return \Inertia\Inertia::render('Admin/Products/Edit', [
            'product' => $product->load('images'),
            'categories' => \App\Models\Category::all()
        ]);
    }

    public function update(Request $request, \App\Models\Product $product)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'gallery.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'distributor' => 'nullable|string|max:255',
        ]);

        $validated['slug'] = Str::slug($request->name);
        
        if ($request->hasFile('image')) {
            if ($product->image && !Str::startsWith($product->image, 'http')) {
                Storage::disk('public')->delete($product->image);
            }
            
            $file = $request->file('image');
            $filename = Str::random(20) . '.webp';
            $path = 'products/' . $filename;
            
            $image = Image::read($file);
            $image->cover(1000, 1000);
            
            Storage::disk('public')->put($path, (string) $image->toWebp(85));
            $validated['image'] = $path;
        }

        $product->update($validated);

        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $file) {
                $filename = Str::random(20) . '.webp';
                $path = 'products/gallery/' . $filename;
                
                $image = Image::read($file);
                $image->cover(1000, 1000);
                
                Storage::disk('public')->put($path, (string) $image->toWebp(85));
                $product->images()->create(['image_path' => $path]);
            }
        }

        return redirect()->route('admin.products.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function deleteImage(\App\Models\ProductImage $image)
    {
        if (!Str::startsWith($image->image_path, 'http')) {
            Storage::disk('public')->delete($image->image_path);
        }
        $image->delete();
        return back()->with('success', 'Foto produk dihapus.');
    }

    public function destroy(\App\Models\Product $product)
    {
        if ($product->image && !Str::startsWith($product->image, 'http')) {
            Storage::disk('public')->delete($product->image);
        }
        foreach ($product->images as $img) {
            if (!Str::startsWith($img->image_path, 'http')) {
                Storage::disk('public')->delete($img->image_path);
            }
        }
        $product->delete();
        return redirect()->route('admin.products.index')->with('success', 'Produk berhasil dihapus.');
    }
}
