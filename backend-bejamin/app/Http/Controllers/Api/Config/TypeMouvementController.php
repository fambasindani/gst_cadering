<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\TypeMouvement;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TypeMouvementController extends Controller
{
    /**
     * Liste des types de mouvement
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $sens = $request->input('sens'); // 1=entrée, -1=sortie
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'asc');

            $query = TypeMouvement::query();

            if ($search) {
                $query->where('libelle', 'LIKE', "%{$search}%");
            }

            if ($sens) {
                $query->where('sens', $sens);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des types de mouvement récupérée avec succès'
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
     * Créer un type de mouvement
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'libelle' => 'required|string|max:50|unique:type_mouvement,libelle',
                'sens' => 'required|in:1,-1',
                'actif' => 'nullable|boolean',
            ]);

            $type = TypeMouvement::create([
                'libelle' => $validated['libelle'],
                'sens' => $validated['sens'],
                'actif' => $validated['actif'] ?? true,
            ]);

            return response()->json([
                'success' => true,
                'data' => $type,
                'message' => 'Type de mouvement créé avec succès'
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
     * Détail d'un type de mouvement
     */
    public function show($id)
    {
        try {
            $type = TypeMouvement::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $type,
                'message' => 'Détail du type de mouvement récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Type de mouvement non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un type de mouvement
     */
    public function update(Request $request, $id)
    {
        try {
            $type = TypeMouvement::findOrFail($id);

            $validated = $request->validate([
                'libelle' => "sometimes|required|string|max:50|unique:type_mouvement,libelle,{$id}",
                'sens' => 'sometimes|required|in:1,-1',
                'actif' => 'nullable|boolean',
            ]);

            $type->update($validated);

            return response()->json([
                'success' => true,
                'data' => $type,
                'message' => 'Type de mouvement mis à jour avec succès'
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
     * Supprimer un type de mouvement
     */
    public function destroy($id)
    {
        try {
            $type = TypeMouvement::findOrFail($id);

            // Vérifier si le type est utilisé
            if ($type->mouvements()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce type de mouvement est utilisé. Impossible de le supprimer.'
                ], 403);
            }

            $type->delete();

            return response()->json([
                'success' => true,
                'message' => 'Type de mouvement supprimé avec succès'
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
     * Activer/Désactiver un type de mouvement
     */
    public function toggleActif($id)
    {
        try {
            $type = TypeMouvement::findOrFail($id);
            $type->actif = !$type->actif;
            $type->save();

            return response()->json([
                'success' => true,
                'data' => $type,
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
     * Liste des types d'entrée
     */
    public function getEntree()
    {
        try {
            $types = TypeMouvement::where('sens', 1)->where('actif', true)->get();

            return response()->json([
                'success' => true,
                'data' => $types,
                'message' => 'Types d\'entrée récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des types de sortie
     */
    public function getSortie()
    {
        try {
            $types = TypeMouvement::where('sens', -1)->where('actif', true)->get();

            return response()->json([
                'success' => true,
                'data' => $types,
                'message' => 'Types de sortie récupérés avec succès'
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