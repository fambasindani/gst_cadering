<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use App\Models\HistoriquePrix;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CodeGenerator;

class ProduitController extends Controller
{
    /**
     * Liste des produits
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $categorieId = $request->input('categorie_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Produit::with(['categorie', 'unite', 'partenairePrincipal']);

            if ($search) {
                $query->search($search);
            }

            if ($categorieId) {
                $query->byCategorie($categorieId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des produits récupérée avec succès'
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
     * Créer un produit
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'code_article' => 'nullable|string|max:50|unique:produits,code_article',
                'code_barre' => 'nullable|string|max:50|unique:produits,code_barre',
                'nom' => 'required|string|max:200',
                'description' => 'nullable|string',
                'id_categorie' => 'nullable|exists:categories,id',
                'id_partenaire_principal' => 'nullable|exists:partenaires,id',
                'id_unite' => 'required|exists:unites,id',
                'seuil_alerte' => 'nullable|integer|min:0',
                'actif' => 'nullable|boolean',
                // Prix
                'prix_achat_ht' => 'required|numeric|min:0',
                'prix_vente_ht' => 'nullable|numeric|min:0',
                'id_devise' => 'required|exists:devises,id',
                'date_application' => 'nullable|date',
                'commentaire_prix' => 'nullable|string',
            ]);

            // Auto-générer le code article si non fourni
            if (empty($validated['code_article'])) {
                $validated['code_article'] = CodeGenerator::produit();
            }

            // Créer le produit
            $produit = Produit::create([
                'code_article' => $validated['code_article'],
                'code_barre' => $validated['code_barre'] ?? null,
                'nom' => $validated['nom'],
                'description' => $validated['description'] ?? null,
                'id_categorie' => $validated['id_categorie'] ?? null,
                'id_partenaire_principal' => $validated['id_partenaire_principal'] ?? null,
                'id_unite' => $validated['id_unite'],
                'seuil_alerte' => $validated['seuil_alerte'] ?? 0,
                'actif' => $validated['actif'] ?? true,
            ]);

            // Créer l'historique de prix
            HistoriquePrix::create([
                'id_produit' => $produit->id,
                'prix_achat_ht' => $validated['prix_achat_ht'],
                'prix_vente_ht' => $validated['prix_vente_ht'] ?? null,
                'id_devise' => $validated['id_devise'],
                'date_application' => $validated['date_application'] ?? now(),
                'commentaire' => $validated['commentaire_prix'] ?? 'Prix initial',
                'id_utilisateur' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $produit->load(['categorie', 'unite', 'partenairePrincipal', 'historiquePrix']),
                'message' => 'Produit créé avec succès'
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
                'message' => 'Erreur lors de la création du produit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un produit
     */
    public function show($id)
    {
        try {
            $produit = Produit::with([
                'categorie',
                'unite',
                'partenairePrincipal',
                'historiquePrix' => function($query) {
                    $query->orderBy('date_application', 'desc');
                },
                'historiquePrix.devise'
            ])->findOrFail($id);

            // Ajouter le stock total
            $produit->stock_total = $produit->getStockTotal();

            return response()->json([
                'success' => true,
                'data' => $produit,
                'message' => 'Détail du produit récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Produit non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un produit
     */
    public function update(Request $request, $id)
    {
        try {
            $produit = Produit::findOrFail($id);

            $validated = $request->validate([
                'code_article' => "sometimes|required|string|max:50|unique:produits,code_article,{$id}",
                'code_barre' => "nullable|string|max:50|unique:produits,code_barre,{$id}",
                'nom' => 'sometimes|required|string|max:200',
                'description' => 'nullable|string',
                'id_categorie' => 'nullable|exists:categories,id',
                'id_partenaire_principal' => 'nullable|exists:partenaires,id',
                'id_unite' => 'sometimes|required|exists:unites,id',
                'seuil_alerte' => 'nullable|integer|min:0',
                'actif' => 'nullable|boolean',
            ]);

            $produit->update($validated);

            return response()->json([
                'success' => true,
                'data' => $produit->load(['categorie', 'unite', 'partenairePrincipal']),
                'message' => 'Produit mis à jour avec succès'
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
     * Supprimer un produit
     */
    public function destroy($id)
    {
        try {
            $produit = Produit::findOrFail($id);

            // Vérifier si le produit a des lots
            if ($produit->lots()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce produit a des lots associés. Supprimez-les d\'abord.'
                ], 403);
            }

            $produit->delete();

            return response()->json([
                'success' => true,
                'message' => 'Produit supprimé avec succès'
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
 * Stock d'un produit
 */
public function getStock($id)
{
    try {
        $produit = Produit::with(['categorie', 'unite'])->findOrFail($id);
        
        // Stock total
        $stockTotal = $produit->getStockTotal();
        
        // Stock par ville
        $villes = \App\Models\Ville::where('actif', true)->get();
        $stockParVille = [];
        foreach ($villes as $ville) {
            $stockParVille[] = [
                'ville' => $ville->nom,
                'ville_id' => $ville->id,
                'stock' => $produit->getStockParVille($ville->id)
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'produit' => [
                    'id' => $produit->id,
                    'nom' => $produit->nom,
                    'code_article' => $produit->code_article,
                    'code_barre' => $produit->code_barre,
                    'unite' => $produit->unite->symbole ?? 'pc',
                ],
                'stock_total' => $stockTotal,
                'stock_par_ville' => $stockParVille,
                'seuil_alerte' => $produit->seuil_alerte,
                'statut' => $stockTotal <= $produit->seuil_alerte ? '⚠️ Stock bas' : '✅ Stock normal'
            ],
            'message' => 'Stock du produit récupéré avec succès'
        ]);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Produit non trouvé'
        ], 404);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération du stock',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Activer/Désactiver un produit
     */
    public function toggleActif($id)
    {
        try {
            $produit = Produit::findOrFail($id);
            $produit->actif = !$produit->actif;
            $produit->save();

            return response()->json([
                'success' => true,
                'data' => $produit,
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