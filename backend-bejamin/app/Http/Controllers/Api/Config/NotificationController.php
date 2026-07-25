<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $userId = Auth::id();
            $perPage = $request->input('per_page', 20);
            $unreadOnly = $request->boolean('unread_only');

            $query = Notification::byUtilisateur($userId)->orderBy('created_at', 'desc');

            if ($unreadOnly) {
                $query->nonLues();
            }

            $notifications = $query->paginate($perPage);
            $unreadCount = Notification::byUtilisateur($userId)->nonLues()->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $notifications->items(),
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                ],
                'unread_count' => $unreadCount,
                'message' => 'Notifications récupérées',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function markAsRead($id)
    {
        try {
            $notification = Notification::where('id', $id)
                ->where('id_utilisateur', Auth::id())
                ->firstOrFail();

            $notification->update(['read_at' => now()]);

            return response()->json([
                'success' => true,
                'data' => $notification,
                'message' => 'Notification marquée comme lue',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function markAllAsRead()
    {
        try {
            Notification::byUtilisateur(Auth::id())
                ->nonLues()
                ->update(['read_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Toutes les notifications marquées comme lues',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function unreadCount()
    {
        try {
            $count = Notification::byUtilisateur(Auth::id())->nonLues()->count();

            return response()->json([
                'success' => true,
                'data' => ['count' => $count],
                'message' => 'Compteur récupéré',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}