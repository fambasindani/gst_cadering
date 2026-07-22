<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PermissionController extends Controller
{
    /**
     * Liste des permissions
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Permission::query();

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'LIKE', "%{$search}%")
                      ->orWhere('code', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des permissions récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une permission
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:100|unique:permissions,nom',
                'code' => 'required|string|max:50|unique:permissions,code',
                'description' => 'nullable|string',
                'actif' => 'nullable|boolean',
            ]);

            $permission = Permission::create([
                'nom' => $validated['nom'],
                'code' => $validated['code'],
                'description' => $validated['description'] ?? null,
                'actif' => $validated['actif'] ?? true,
            ]);

            return response()->json([
                'success' => true,
                'data' => $permission,
                'message' => 'Permission créée avec succès'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'une permission
     */
    public function show($id)
    {
        try {
            $permission = Permission::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $permission,
                'message' => 'Détail de la permission'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }
    }

    /**
     * Modifier une permission
     */
    public function update(Request $request, $id)
    {
        try {
            $permission = Permission::findOrFail($id);

            $validated = $request->validate([
                'nom' => "sometimes|required|string|max:100|unique:permissions,nom,{$id}",
                'code' => "sometimes|required|string|max:50|unique:permissions,code,{$id}",
                'description' => 'nullable|string',
                'actif' => 'nullable|boolean',
            ]);

            $permission->update($validated);

            return response()->json([
                'success' => true,
                'data' => $permission,
                'message' => 'Permission mise à jour avec succès'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une permission
     */
    public function destroy($id)
    {
        try {
            $permission = Permission::findOrFail($id);

            // Vérifier si des rôles utilisent cette permission
            if ($permission->roles()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette permission est utilisée par des rôles. Supprimez-la des rôles d\'abord.'
                ], 403);
            }

            $permission->delete();

            return response()->json([
                'success' => true,
                'message' => 'Permission supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer/Désactiver une permission
     */
    public function toggleActif($id)
    {
        try {
            $permission = Permission::findOrFail($id);
            $permission->actif = !$permission->actif;
            $permission->save();

            return response()->json([
                'success' => true,
                'data' => $permission,
                'message' => 'Statut modifié avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut'
            ], 500);
        }
    }

    /**
     * Récupérer toutes les permissions (pour le frontend)
     */
    public function all()
    {
        try {
            $permissions = Permission::where('actif', true)->get();

            return response()->json([
                'success' => true,
                'data' => $permissions,
                'message' => 'Toutes les permissions récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}