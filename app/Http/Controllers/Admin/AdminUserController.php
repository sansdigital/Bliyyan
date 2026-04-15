<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::withCount('orders')
            ->with(['addresses' => function($q) {
                $q->where('is_default', true);
            }])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($user) {
                $user->default_address = $user->addresses->first();
                unset($user->addresses); // Clean up the collection to avoid confusion
                return $user;
            });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users
        ]);
    }

    public function destroy(User $user)
    {
        // Don't allow deleting admin users easily, but just basic protection
        if ($user->role === 'admin') {
            return back()->with('error', 'Cannot delete admin users.');
        }

        $user->delete();
        return back()->with('success', 'Customer deleted successfully.');
    }
}
