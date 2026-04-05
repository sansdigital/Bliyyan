<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Category::with(['categoryGroup'])->withCount('products');

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->category_group_id) {
            $query->where('category_group_id', $request->category_group_id);
        }

        return \Inertia\Inertia::render('Admin/Categories/Index', [
            'categories' => $query->latest()->paginate(10)->withQueryString(),
            'groups'     => \App\Models\CategoryGroup::all(),
            'filters'    => $request->only(['search', 'category_group_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'category_group_id' => 'required|exists:category_groups,id'
        ]);

        $validated['slug'] = \Illuminate\Support\Str::slug($request->name);
        
        \App\Models\Category::create($validated);

        return redirect()->route('admin.categories.index')->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, \App\Models\Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'category_group_id' => 'required|exists:category_groups,id'
        ]);

        $validated['slug'] = \Illuminate\Support\Str::slug($request->name);
        
        $category->update($validated);

        return redirect()->route('admin.categories.index')->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(\App\Models\Category $category)
    {
        if ($category->products()->count() > 0) {
            return redirect()->route('admin.categories.index')->with('error', 'Kategori tidak dapat dihapus karena masih memiliki produk.');
        }

        $category->delete();
        return redirect()->route('admin.categories.index')->with('success', 'Kategori berhasil dihapus.');
    }
}
