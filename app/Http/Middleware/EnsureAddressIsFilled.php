<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class EnsureAddressIsFilled
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // If not logged in or is admin, skip the check
        if (!$user || $user->is_admin) {
            return $next($request);
        }

        // List of routes that should ALWAYS be accessible to prevent redirect loops
        $allowedRoutes = [
            'profile.edit',
            'profile.update',
            'profile.destroy',
            'profile.addresses.store',
            'profile.addresses.update',
            'profile.addresses.destroy',
            'profile.addresses.set-default',
            'logout',
        ];

        if ($request->routeIs($allowedRoutes)) {
            return $next($request);
        }

        // Check if the user has any address
        if ($user->addresses()->count() === 0) {
            return redirect()->route('profile.edit')->with('warning', 'Please complete your shipping address before continuing.');
        }

        return $next($request);
    }
}
