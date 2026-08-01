<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\FicheTechnique;
use App\Models\LigneFicheTechnique;
use App\Models\Produit;
use App\Helpers\CodeGenerator;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class FicheTechniqueController extends Controller
{
    /**
     * Liste des fiches techniques
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $magasinId = $request->input('magasin_id');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = FicheTechnique::with(['magasin', 'lignes.ingredient', 'lignes.unite']);

            if ($search) {
                $query->search($search);
            }

            if ($magasinId) {
                $query->byMagasin($magasinId);
            }

            if ($dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des fiches techniques récupérée avec succès'
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
     * Créer une fiche technique
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'code' => 'nullable|string|max:50|unique:fiche_technique,code',
                'nom' => 'required|string|max:200',
                'description' => 'nullable|string',
                'id_produit_fini' => 'nullable|exists:produits,id',
                'rendement' => 'required|integer|min:1',
                'poids_portion' => 'nullable|numeric|min:0',
                'unite_poids_portion' => 'nullable|string|in:mg,gm,kg',
                'id_magasin' => 'required|exists:magasins,id',
                'actif' => 'nullable|boolean',
                'lignes' => 'required|array|min:1',
                'lignes.*.id_produit_ingredient' => 'required|exists:produits,id',
                'lignes.*.id_unite' => 'required|exists:unites,id',
                'lignes.*.rendement' => 'nullable|numeric|min:0|max:100',
                'lignes.*.poids_net' => 'required|numeric|min:0.001',
                'lignes.*.poids_brut' => 'nullable|numeric|min:0',
                'lignes.*.rendement_apres_cuisson' => 'nullable|boolean',
                'lignes.*.commentaire' => 'nullable|string',
            ]);

            // Auto-générer le code si non fourni
            if (empty($validated['code'])) {
                $validated['code'] = CodeGenerator::ficheTechnique();
            }

            DB::beginTransaction();

            try {
                // Créer la fiche technique
                $fiche = FicheTechnique::create([
                    'code' => $validated['code'],
                    'nom' => $validated['nom'],
                    'description' => $validated['description'] ?? null,
                    'id_produit_fini' => $validated['id_produit_fini'] ?? null,
                    'rendement' => $validated['rendement'],
                    'poids_portion' => $validated['poids_portion'] ?? 0,
                    'unite_poids_portion' => $validated['unite_poids_portion'] ?? 'gm',
                    'id_magasin' => $validated['id_magasin'],
                    'actif' => $validated['actif'] ?? true,
                ]);

                // Créer les lignes
                foreach ($validated['lignes'] as $ligne) {
                    $ingredient = Produit::find($ligne['id_produit_ingredient']);
                    $prixUnitaire = $ingredient->getDernierPrixAchat()->prix_achat_ht ?? 0;
                    $coutTotal = $ligne['poids_net'] * $prixUnitaire;

                    LigneFicheTechnique::create([
                        'id_fiche_technique' => $fiche->id,
                        'id_produit_ingredient' => $ligne['id_produit_ingredient'],
                        'id_unite' => $ligne['id_unite'],
                        'rendement' => $ligne['rendement'] ?? 100,
                        'prix_unitaire' => $prixUnitaire,
                        'poids_net' => $ligne['poids_net'],
                        'poids_brut' => $ligne['poids_brut'] ?? $ligne['poids_net'],
                        'cout_total' => $coutTotal,
                        'rendement_apres_cuisson' => $ligne['rendement_apres_cuisson'] ?? false,
                        'commentaire' => $ligne['commentaire'] ?? null,
                    ]);
                }

                // Mettre à jour les coûts
                $fiche->updateCouts();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $fiche->load(['magasin', 'lignes.ingredient', 'lignes.unite']),
                    'message' => 'Fiche technique créée avec succès'
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
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'une fiche technique
     */
    public function show($id)
    {
        try {
            $fiche = FicheTechnique::with([
                'magasin',
                'lignes.ingredient',
                'lignes.ingredient.unite',
                'lignes.unite'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $fiche,
                'message' => 'Détail de la fiche technique récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fiche technique non trouvée'
            ], 404);
        }
    }

    /**
     * Modifier une fiche technique
     */
    public function update(Request $request, $id)
    {
        try {
            $fiche = FicheTechnique::findOrFail($id);

            $validated = $request->validate([
                'code' => 'sometimes|required|string|max:50|unique:fiche_technique,code,' . $id,
                'nom' => 'sometimes|required|string|max:200',
                'description' => 'nullable|string',
                'id_produit_fini' => 'nullable|exists:produits,id',
                'rendement' => 'sometimes|required|integer|min:1',
                'poids_portion' => 'nullable|numeric|min:0',
                'unite_poids_portion' => 'nullable|string|in:mg,gm,kg',
                'id_magasin' => 'sometimes|required|exists:magasins,id',
                'actif' => 'nullable|boolean',
                'lignes' => 'nullable|array|min:1',
                'lignes.*.id_produit_ingredient' => 'required_with:lignes|exists:produits,id',
                'lignes.*.id_unite' => 'required_with:lignes|exists:unites,id',
                'lignes.*.rendement' => 'nullable|numeric|min:0|max:100',
                'lignes.*.poids_net' => 'required_with:lignes|numeric|min:0.001',
                'lignes.*.poids_brut' => 'nullable|numeric|min:0',
                'lignes.*.rendement_apres_cuisson' => 'nullable|boolean',
                'lignes.*.commentaire' => 'nullable|string',
            ]);

            DB::beginTransaction();

            try {
                $fiche->update([
                    'code' => $validated['code'] ?? $fiche->code,
                    'nom' => $validated['nom'] ?? $fiche->nom,
                    'description' => $validated['description'] ?? $fiche->description,
                    'id_produit_fini' => array_key_exists('id_produit_fini', $validated) ? ($validated['id_produit_fini'] ?? null) : $fiche->id_produit_fini,
                    'rendement' => $validated['rendement'] ?? $fiche->rendement,
                    'poids_portion' => $validated['poids_portion'] ?? $fiche->poids_portion,
                    'unite_poids_portion' => $validated['unite_poids_portion'] ?? $fiche->unite_poids_portion,
                    'id_magasin' => $validated['id_magasin'] ?? $fiche->id_magasin,
                    'actif' => $validated['actif'] ?? $fiche->actif,
                ]);

                if ($request->has('lignes')) {
                    $fiche->lignes()->delete();

                    foreach ($validated['lignes'] as $ligne) {
                        $ingredient = Produit::find($ligne['id_produit_ingredient']);
                        $prixUnitaire = $ingredient->getDernierPrixAchat()->prix_achat_ht ?? 0;
                        $coutTotal = $ligne['poids_net'] * $prixUnitaire;

                        LigneFicheTechnique::create([
                            'id_fiche_technique' => $fiche->id,
                            'id_produit_ingredient' => $ligne['id_produit_ingredient'],
                            'id_unite' => $ligne['id_unite'],
                            'rendement' => $ligne['rendement'] ?? 100,
                            'prix_unitaire' => $prixUnitaire,
                            'poids_net' => $ligne['poids_net'],
                            'poids_brut' => $ligne['poids_brut'] ?? $ligne['poids_net'],
                            'cout_total' => $coutTotal,
                            'rendement_apres_cuisson' => $ligne['rendement_apres_cuisson'] ?? false,
                            'commentaire' => $ligne['commentaire'] ?? null,
                        ]);
                    }
                }

                $fiche->updateCouts();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $fiche->load(['magasin', 'lignes.ingredient', 'lignes.unite']),
                    'message' => 'Fiche technique mise à jour avec succès'
                ]);

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
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une fiche technique
     */
    public function destroy($id)
    {
        try {
            $fiche = FicheTechnique::findOrFail($id);

            DB::beginTransaction();
            try {
                $fiche->lignes()->delete();
                $fiche->delete();
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            return response()->json([
                'success' => true,
                'message' => 'Fiche technique supprimée avec succès'
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), '23000')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cette fiche technique car elle a déjà été utilisée dans une production (Entrée recette). Vous pouvez plutôt la désactiver.'
                ], 409);
            }
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer/Désactiver une fiche technique
     */
    public function toggleActif($id)
    {
        try {
            $fiche = FicheTechnique::findOrFail($id);
            $fiche->actif = !$fiche->actif;
            $fiche->save();

            return response()->json([
                'success' => true,
                'data' => $fiche,
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
     * Dupliquer une fiche technique
     */
    public function duplicate($id)
    {
        try {
            $fiche = FicheTechnique::with('lignes')->findOrFail($id);

            DB::beginTransaction();

            try {
                // Créer une copie
                $newFiche = FicheTechnique::create([
                    'code' => $fiche->code . '-COPY',
                    'nom' => $fiche->nom . ' (Copie)',
                    'description' => $fiche->description,
                    'id_produit_fini' => $fiche->id_produit_fini,
                    'rendement' => $fiche->rendement,
                    'poids_portion' => $fiche->poids_portion,
                    'unite_poids_portion' => $fiche->unite_poids_portion,
                    'id_magasin' => $fiche->id_magasin,
                    'actif' => false,
                ]);

                // Copier les lignes
                foreach ($fiche->lignes as $ligne) {
                    LigneFicheTechnique::create([
                        'id_fiche_technique' => $newFiche->id,
                        'id_produit_ingredient' => $ligne->id_produit_ingredient,
                        'id_unite' => $ligne->id_unite,
                        'rendement' => $ligne->rendement,
                        'prix_unitaire' => $ligne->prix_unitaire,
                        'poids_net' => $ligne->poids_net,
                        'poids_brut' => $ligne->poids_brut,
                        'cout_total' => $ligne->cout_total,
                        'rendement_apres_cuisson' => $ligne->rendement_apres_cuisson,
                        'commentaire' => $ligne->commentaire,
                    ]);
                }

                $newFiche->updateCouts();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $newFiche->load(['magasin', 'lignes.ingredient']),
                    'message' => 'Fiche technique dupliquée avec succès'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la duplication',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculer le coût d'une fiche technique
     */
    public function calculateCost($id)
    {
        try {
            $fiche = FicheTechnique::with('lignes.ingredient')->findOrFail($id);

            foreach ($fiche->lignes as $ligne) {
                $ligne->calculateCout();
            }

            $fiche->updateCouts();

            return response()->json([
                'success' => true,
                'data' => [
                    'fiche' => $fiche,
                    'cout_total' => $fiche->cout_total,
                    'cout_unitaire' => $fiche->cout_unitaire,
                    'prix_kg' => $fiche->prix_kg,
                ],
                'message' => 'Coût calculé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul du coût',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
