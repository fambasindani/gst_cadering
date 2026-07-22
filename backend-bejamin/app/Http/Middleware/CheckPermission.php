<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckPermission
{
    public function handle(Request $request, Closure $next, ...$permissions)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        // Si l'utilisateur est ADMIN, il a accès à tout
        if ($user->role && $user->role->nom === 'ADMIN') {
            return $next($request);
        }

        // Vérifier les permissions
        foreach ($permissions as $permission) {
            if (!$user->hasPermission($permission)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permission non accordée: ' . $permission
                ], 403);
            }
        }

        return $next($request);
    }
}