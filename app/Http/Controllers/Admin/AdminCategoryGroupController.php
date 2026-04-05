<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CategoryGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminCategoryGroupController extends Controller
{
    public function index(Request $request)
    {
        $query = CategoryGroup::withCount('categories');

        // Search Filter
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('key', 'like', '%' . $request->search . '%');
        }

        return Inertia::render('Admin/CategoryGroups/Index', [
            'groups'  => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255|unique:category_groups,name',
            'image' => 'nullable|image|max:2048',
        ]);

        $group = new CategoryGroup();
        $group->name = $validated['name'];
        $group->key  = Str::slug($validated['name']);
        
        if ($request->hasFile('image')) {
            $group->icon_path = $request->file('image')->store('groups', 'public');
        }

        $group->save();

        return redirect()->back()->with('success', 'Grup baru berhasil ditambahkan.');
    }

    public function update(Request $request, CategoryGroup $category_group)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255|unique:category_groups,name,'.$category_group->id,
            'image' => 'nullable|image|max:2048',
        ]);

        $category_group->name = $validated['name'];
        $category_group->key  = Str::slug($validated['name']);

        if ($request->hasFile('image')) {
            // Delete old icon if exists
            if ($category_group->icon_path) {
                Storage::disk('public')->delete($category_group->icon_path);
            }
            $category_group->icon_path = $request->file('image')->store('groups', 'public');
        }

        $category_group->save();

        return redirect()->back()->with('success', 'Grup berhasil diperbarui.');
    }

    public function destroy(CategoryGroup $category_group)
    {
        // Safety: Check if categories exist
        if ($category_group->categories()->count() > 0) {
            return redirect()->back()->with('error', 'Grup tidak bisa dihapus karena masih memiliki kategori aktif.');
        }

        // Delete icon if exists
        if ($category_group->icon_path) {
            Storage::disk('public')->delete($category_group->icon_path);
        }

        $category_group->delete();

        return redirect()->back()->with('success', 'Grup berhasil dihapus.');
    }
}
