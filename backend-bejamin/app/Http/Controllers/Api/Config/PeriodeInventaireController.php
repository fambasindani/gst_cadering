<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\PeriodeInventaire;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;

class PeriodeInventaireController extends Controller
{
    /**
     * Liste des périodes d'inventaire
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $villeId = $request->input('ville_id');
            $statut = $request->input('statut');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = PeriodeInventaire::with('ville');

            if ($search) {
                $query->where('libelle', 'LIKE', "%{$search}%");
            }

            if ($villeId) {
                $query->where('id_ville', $villeId);
            }

            if ($statut) {
                $query->where('statut', $statut);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des périodes d\'inventaire récupérée avec succès'
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
     * Créer une période d'inventaire
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'libelle' => 'required|string|max:100',
                'date_debut' => 'required|date|before:date_fin',
                'date_fin' => 'required|date|after:date_debut',
                'id_ville' => 'required|exists:villes,id',
                'description' => 'nullable|string',
                'statut' => 'nullable|in:PREVU,EN_COURS,CLOTURE,ANNULE',
            ]);

            $periode = PeriodeInventaire::create([
                'libelle' => $validated['libelle'],
                'date_debut' => $validated['date_debut'],
                'date_fin' => $validated['date_fin'],
                'id_ville' => $validated['id_ville'],
                'description' => $validated['description'] ?? null,
                'statut' => $validated['statut'] ?? 'PREVU',
            ]);

            return response()->json([
                'success' => true,
                'data' => $periode->load('ville'),
                'message' => 'Période d\'inventaire créée avec succès'
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
     * Détail d'une période
     */
    public function show($id)
    {
        try {
            $periode = PeriodeInventaire::with(['ville', 'inventaires.produit'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $periode,
                'message' => 'Détail récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Période non trouvée'
            ], 404);
        }
    }

    /**
     * Modifier une période
     */
    public function update(Request $request, $id)
    {
        try {
            $periode = PeriodeInventaire::findOrFail($id);

            $validated = $request->validate([
                'libelle' => 'sometimes|required|string|max:100',
                'date_debut' => 'sometimes|required|date|before:date_fin',
                'date_fin' => 'sometimes|required|date|after:date_debut',
                'id_ville' => 'sometimes|required|exists:villes,id',
                'description' => 'nullable|string',
                'statut' => 'nullable|in:PREVU,EN_COURS,CLOTURE,ANNULE',
            ]);

            $periode->update($validated);

            return response()->json([
                'success' => true,
                'data' => $periode->load('ville'),
                'message' => 'Période mise à jour avec succès'
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
     * Supprimer une période
     */
    public function destroy($id)
    {
        try {
            $periode = PeriodeInventaire::findOrFail($id);

            if ($periode->inventaires()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette période a des inventaires associés. Supprimez-les d\'abord.'
                ], 403);
            }

            $periode->delete();

            return response()->json([
                'success' => true,
                'message' => 'Période supprimée avec succès'
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
     * Démarrer une période
     */
    public function start($id)
    {
        try {
            $periode = PeriodeInventaire::findOrFail($id);

            if ($periode->statut !== 'PREVU') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seule une période en statut PREVU peut être démarrée'
                ], 403);
            }

            $periode->statut = 'EN_COURS';
            $periode->save();

            return response()->json([
                'success' => true,
                'data' => $periode,
                'message' => 'Période démarrée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du démarrage',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clôturer une période
     */
    public function close($id)
    {
        try {
            $periode = PeriodeInventaire::findOrFail($id);

            if ($periode->statut !== 'EN_COURS') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seule une période en cours peut être clôturée'
                ], 403);
            }

            $periode->statut = 'CLOTURE';
            $periode->save();

            return response()->json([
                'success' => true,
                'data' => $periode,
                'message' => 'Période clôturée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la clôture',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}