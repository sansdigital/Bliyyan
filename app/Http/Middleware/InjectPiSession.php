<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class InjectPiSession
{
    /**
     * Handle an incoming request.
     *
     * iOS Safari/WKWebView aggressively blocks all cookies in third-party or iframe contexts
     * (which is how Pi Browser often runs apps). To circumvent this, we allow passing the session ID
     * via the query string (for initial page loads) or an X-Pi-Session header (for AJAX/Inertia requests).
     * This middleware intercepts those and injects them into the request's cookies BEFORE
     * Laravel's StartSession middleware runs.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $sessionCookieName = config('session.cookie');
        
        // 1. Try to get it from the custom header (used by Axios/Inertia)
        $token = $request->header('X-Pi-Session');
        
        // 2. If not in header, try Bearer token (more reliable against header stripping)
        if (!$token) {
            $token = $request->bearerToken();
        }
        
        // 3. If not in Bearer token, try request body or query string (Inertia sometimes sends in body)
        if (!$token) {
            $token = $request->input('pi_session') ?? $request->query('pi_session');
        }
        
        // 3. Inject it into the cookies bag so StartSession picks it up.
        // CRITICAL: Laravel encrypts all cookies. If we inject a raw token BEFORE EncryptCookies runs,
        // EncryptCookies will fail to decrypt it and destroy it (which broke Android).
        // We must manually add Laravel's cookie prefix and encrypt it so it survives!
        if ($token) {
            // Laravel uses a MAC prefix for cookie values to prevent tampering.
            // We use Laravel's built-in class to generate this prefix automatically.
            // We must use the decoded binary key from the encrypter, not the raw config string.
            $prefix = \Illuminate\Cookie\CookieValuePrefix::create($sessionCookieName, app('encrypter')->getKey());
            $encryptedToken = \Illuminate\Support\Facades\Crypt::encryptString($prefix . $token);
            
            $request->cookies->set($sessionCookieName, $encryptedToken);
        }

        $response = $next($request);

        return $response;
    }
}
