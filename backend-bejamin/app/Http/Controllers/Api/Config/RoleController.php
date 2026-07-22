<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    /**
     * Liste des rôles
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Role::with('permissions')->withCount(['permissions', 'utilisateurs']);

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des rôles récupérée avec succès'
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
     * Créer un rôle
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:50|unique:roles,nom',
                'description' => 'nullable|string',
                'permissions' => 'nullable|array',
                'permissions.*' => 'exists:permissions,id',
                'actif' => 'nullable|boolean',
            ]);

            $role = Role::create([
                'nom' => $validated['nom'],
                'description' => $validated['description'] ?? null,
                'actif' => $validated['actif'] ?? true,
            ]);

            if (!empty($validated['permissions'])) {
                $role->permissions()->sync($validated['permissions']);
            }

            return response()->json([
                'success' => true,
                'data' => $role->load('permissions'),
                'message' => 'Rôle créé avec succès'
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
     * Détail d'un rôle
     */
    public function show($id)
    {
        try {
            $role = Role::with('permissions')->withCount(['permissions', 'utilisateurs'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $role,
                'message' => 'Détail du rôle'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un rôle
     */
    public function update(Request $request, $id)
    {
        try {
            $role = Role::findOrFail($id);

            $validated = $request->validate([
                'nom' => "sometimes|required|string|max:50|unique:roles,nom,{$id}",
                'description' => 'nullable|string',
                'permissions' => 'nullable|array',
                'permissions.*' => 'exists:permissions,id',
                'actif' => 'nullable|boolean',
            ]);

            $role->update($validated);

            if ($request->has('permissions')) {
                $role->permissions()->sync($validated['permissions']);
            }

            return response()->json([
                'success' => true,
                'data' => $role->load('permissions'),
                'message' => 'Rôle mis à jour avec succès'
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
     * Supprimer un rôle
     */
    public function destroy($id)
    {
        try {
            $role = Role::findOrFail($id);

            // Vérifier si des utilisateurs utilisent ce rôle
            if ($role->utilisateurs()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce rôle est utilisé par des utilisateurs. Supprimez-les d\'abord.'
                ], 403);
            }

            $role->permissions()->detach();
            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rôle supprimé avec succès'
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
     * Activer/Désactiver un rôle
     */
    public function toggleActif($id)
    {
        try {
            $role = Role::findOrFail($id);
            $role->actif = !$role->actif;
            $role->save();

            return response()->json([
                'success' => true,
                'data' => $role,
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
     * Assigner des permissions à un rôle
     */
    public function assignPermissions(Request $request, $id)
    {
        try {
            $role = Role::findOrFail($id);

            $validated = $request->validate([
                'permissions' => 'required|array',
                'permissions.*' => 'exists:permissions,id',
            ]);

            $role->permissions()->sync($validated['permissions']);

            return response()->json([
                'success' => true,
                'data' => $role->load('permissions'),
                'message' => 'Permissions assignées avec succès'
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
                'message' => 'Erreur lors de l\'assignation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}