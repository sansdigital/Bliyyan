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
            ->orderBy('created_at', 'desc')
            ->get();

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
