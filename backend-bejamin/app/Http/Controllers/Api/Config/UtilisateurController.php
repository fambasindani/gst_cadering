<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UtilisateurController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $villeId = $request->input('ville_id');
            $roleId = $request->input('role_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Utilisateur::with(['role', 'ville', 'departement', 'zone', 'emplacement']);

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'LIKE', "%{$search}%")
                      ->orWhere('prenom', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            if ($villeId) {
                $query->where('id_ville', $villeId);
            }

            if ($roleId) {
                $query->where('id_role', $roleId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des utilisateurs récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:100',
                'prenom' => 'nullable|string|max:100',
                'email' => 'required|string|email|max:100|unique:utilisateurs,email',
                'mot_de_passe' => 'required|string|min:6|confirmed',
                'id_role' => 'required|exists:roles,id',
                'id_ville' => 'required|exists:villes,id',
                'id_departement' => 'required|exists:departements,id',
                'id_zone' => 'nullable|exists:zones,id',
                'id_emplacement' => 'nullable|exists:emplacements,id',
                'actif' => 'nullable|boolean',
            ]);

            $utilisateur = Utilisateur::create([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'] ?? null,
                'email' => $validated['email'],
                'mot_de_passe_hash' => Hash::make($validated['mot_de_passe']),
                'id_role' => $validated['id_role'],
                'id_ville' => $validated['id_ville'],
                'id_departement' => $validated['id_departement'],
                'id_zone' => $validated['id_zone'] ?? null,
                'id_emplacement' => $validated['id_emplacement'] ?? null,
                'actif' => $validated['actif'] ?? true,
            ]);

            return response()->json([
                'success' => true,
                'data' => $utilisateur->load(['role', 'ville', 'departement']),
                'message' => 'Utilisateur créé avec succès'
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

    public function show($id)
    {
        try {
            $utilisateur = Utilisateur::with(['role', 'ville', 'departement', 'zone', 'emplacement'])
                                     ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $utilisateur,
                'message' => 'Détail de l\'utilisateur'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $utilisateur = Utilisateur::findOrFail($id);

            $validated = $request->validate([
                'nom' => 'sometimes|required|string|max:100',
                'prenom' => 'nullable|string|max:100',
                'email' => "sometimes|required|email|max:100|unique:utilisateurs,email,{$id}",
                'mot_de_passe' => 'nullable|string|min:6|confirmed',
                'id_role' => 'sometimes|required|exists:roles,id',
                'id_ville' => 'sometimes|required|exists:villes,id',
                'id_departement' => 'sometimes|required|exists:departements,id',
                'id_zone' => 'nullable|exists:zones,id',
                'id_emplacement' => 'nullable|exists:emplacements,id',
                'actif' => 'nullable|boolean',
            ]);

            if ($request->filled('mot_de_passe')) {
                $validated['mot_de_passe_hash'] = Hash::make($validated['mot_de_passe']);
                unset($validated['mot_de_passe']);
            }

            $utilisateur->update($validated);

            return response()->json([
                'success' => true,
                'data' => $utilisateur->load(['role', 'ville', 'departement']),
                'message' => 'Utilisateur mis à jour avec succès'
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

    public function destroy($id)
    {
        try {
            if (auth()->id() == $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez pas supprimer votre propre compte'
                ], 403);
            }

            $utilisateur = Utilisateur::findOrFail($id);
            $utilisateur->delete();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function toggleActif($id)
    {
        try {
            $utilisateur = Utilisateur::findOrFail($id);
            $utilisateur->actif = !$utilisateur->actif;
            $utilisateur->save();

            return response()->json([
                'success' => true,
                'data' => $utilisateur,
                'message' => 'Statut modifié avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut'
            ], 500);
        }
    }
}