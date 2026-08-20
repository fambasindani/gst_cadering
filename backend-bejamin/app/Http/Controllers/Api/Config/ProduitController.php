<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use App\Models\HistoriquePrix;
use App\Models\Magasin;
use App\Models\Devise;
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

            $query = Produit::with(['categorie', 'unite', 'partenairePrincipal', 'ficheTechnique']);

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
                'id_devise' => 'required|exists:devises,id',
                'date_application' => 'nullable|date',
                'commentaire_prix' => 'nullable|string',
                // Seuils par magasin
                'seuils_magasin' => 'nullable|array',
                'seuils_magasin.*.id_magasin' => 'required|exists:magasins,id',
                'seuils_magasin.*.seuil_alerte' => 'required|integer|min:0',
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
                'id_devise' => $validated['id_devise'],
                'date_application' => $validated['date_application'] ?? now(),
                'commentaire' => $validated['commentaire_prix'] ?? 'Prix initial',
                'id_utilisateur' => Auth::id(),
            ]);

            // Seuils d'alerte spécifiques par magasin
            $this->syncSeuilsMagasin($produit, $request->input('seuils_magasin'));

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
                'ficheTechnique',
                'seuilsMagasin.magasin',
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
                // Seuils par magasin
                'seuils_magasin' => 'nullable|array',
                'seuils_magasin.*.id_magasin' => 'required|exists:magasins,id',
                'seuils_magasin.*.seuil_alerte' => 'required|integer|min:0',
            ]);

            $produit->update($validated);

            // Seuils d'alerte spécifiques par magasin
            $this->syncSeuilsMagasin($produit, $request->input('seuils_magasin'));

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
     * Synchronise les seuils d'alerte par magasin du produit.
     * Les entrées sans seuil (> 0) sont ignorées ; les seuils absents du
     * tableau sont supprimés (le tableau reçu fait foi).
     */
    private function syncSeuilsMagasin(Produit $produit, $seuils): void
    {
        if (!is_array($seuils)) {
            return;
        }

        $conserves = [];
        foreach ($seuils as $s) {
            $idMagasin = (int) ($s['id_magasin'] ?? 0);
            $seuil = (int) ($s['seuil_alerte'] ?? 0);
            if ($idMagasin <= 0 || $seuil <= 0) {
                continue;
            }
            $pm = $produit->seuilsMagasin()->updateOrCreate(
                ['id_magasin' => $idMagasin],
                ['seuil_alerte' => $seuil]
            );
            $conserves[] = $pm->id;
        }

        $produit->seuilsMagasin()->whereNotIn('id', $conserves)->delete();
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
        
        // Prix moyen pondéré : Σ(prix_achat × quantite_disponible) / Σ(quantite_disponible) sur les lots VALIDÉ en stock (non périmés)
        $lots = $produit->lots()->where('statut_validation', 'VALIDÉ')->where('quantite_disponible', '>', 0)->nonPerime()->get();
        $qteTotale = 0;
        $valeurTotale = 0;
        $devisePonderee = null;
        foreach ($lots as $lot) {
            $qteTotale += (int) $lot->quantite_disponible;
            $valeurTotale += (float) $lot->prix_achat_ht_unitaire * (int) $lot->quantite_disponible;
            if (!$devisePonderee && $lot->id_devise) {
                $devisePonderee = $lot->id_devise;
            }
        }
        $prixPondere = $qteTotale > 0 ? round($valeurTotale / $qteTotale, 4) : null;
        
        // Stock par magasin (avec le seuil d'alerte spécifique du magasin, s'il existe)
        $magasins = Magasin::where('actif', true)->get();
        $seuilsParMagasin = $produit->seuilsMagasin()->pluck('seuil_alerte', 'id_magasin');
        $stockParMagasin = [];
        foreach ($magasins as $magasin) {
            $stockParMagasin[] = [
                'magasin' => $magasin->nom,
                'magasin_id' => $magasin->id,
                'stock' => $produit->getStockParMagasin($magasin->id),
                'seuil_alerte' => isset($seuilsParMagasin[$magasin->id]) ? (int) $seuilsParMagasin[$magasin->id] : null,
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
                'stock_par_magasin' => $stockParMagasin,
                'seuil_alerte' => $produit->seuil_alerte,
                'statut' => $stockTotal <= $produit->seuil_alerte ? '⚠️ Stock bas' : '✅ Stock normal',
                'prix_pondere' => $prixPondere,
                'devise_ponderee' => $devisePonderee ? Devise::find($devisePonderee) : null,
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