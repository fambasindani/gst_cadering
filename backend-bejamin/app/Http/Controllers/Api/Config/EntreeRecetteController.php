<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\EntreeRecette;
use App\Models\FicheTechnique;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EntreeRecetteController extends Controller
{
    /**
     * Liste des entrées recette
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $ficheId = $request->input('fiche_id');
            $partenaireId = $request->input('partenaire_id');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = EntreeRecette::with([
                'ficheTechnique.lignes.ingredient',
                'ficheTechnique.lignes.unite',
                'partenaire',
            ]);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('ficheTechnique', fn ($f) => $f->where('nom', 'LIKE', "%{$search}%"))
                      ->orWhereHas('partenaire', fn ($p) => $p->where('nom', 'LIKE', "%{$search}%"));
                });
            }

            if ($ficheId) {
                $query->where('id_fiche_technique', $ficheId);
            }

            if ($partenaireId) {
                $query->where('id_partenaire', $partenaireId);
            }

            if ($dateFrom) {
                $query->whereDate('date_production', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->whereDate('date_production', '<=', $dateTo);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des entrées recette récupérée avec succès'
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
     * Créer une entrée recette (commande de production client)
     */
    public function produire(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_fiche_technique' => 'required|exists:fiche_technique,id',
                'id_partenaire' => 'required|exists:partenaires,id',
                'nombre_portions' => 'required|integer|min:1',
                'date_production' => 'nullable|date',
                'commentaire' => 'nullable|string',
            ]);

            $fiche = FicheTechnique::with('lignes.ingredient')->findOrFail($validated['id_fiche_technique']);

            // 1 portion = 1 passager. Nombre de passages (batchs) nécessaires pour produire ces portions.
            $nombrePassages = (int) max(1, ceil($validated['nombre_portions'] / max((int) $fiche->rendement, 1)));

            DB::beginTransaction();

            try {
                $recette = EntreeRecette::create([
                    'id_fiche_technique' => $fiche->id,
                    'id_partenaire' => $validated['id_partenaire'],
                    'nombre_portions' => $validated['nombre_portions'],
                    'nombre_passages' => $nombrePassages,
                    'date_production' => $validated['date_production'] ?? now()->toDateString(),
                    'commentaire' => $validated['commentaire'] ?? null,
                    'id_utilisateur' => Auth::id(),
                ]);

                DB::commit();

                $recette->load(['ficheTechnique', 'partenaire']);

                $coutTotal = (float) $fiche->cout_unitaire * $recette->nombre_portions;

                return response()->json([
                    'success' => true,
                    'data' => [
                        'recette' => $recette,
                        'fiche_technique' => $fiche,
                        'nombre_portions' => $recette->nombre_portions,
                        'nombre_passages' => $recette->nombre_passages,
                        'cout_total' => $coutTotal,
                        'cout_unitaire' => $fiche->cout_unitaire,
                    ],
                    'message' => 'Entrée recette enregistrée avec succès'
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la production',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'une entrée recette
     */
    public function show($id)
    {
        try {
            $recette = EntreeRecette::with(['ficheTechnique.lignes.ingredient', 'ficheTechnique.lignes.unite', 'partenaire', 'utilisateur'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $recette,
                'message' => 'Détail de l\'entrée recette récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Entrée recette non trouvée'
            ], 404);
        }
    }

    /**
     * Supprimer une entrée recette
     */
    public function destroy($id)
    {
        try {
            $recette = EntreeRecette::findOrFail($id);
            $recette->delete();

            return response()->json([
                'success' => true,
                'message' => 'Entrée recette supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
