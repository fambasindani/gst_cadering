<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Inventaire;
use App\Models\PeriodeInventaire;
use App\Models\Produit;
use App\Models\Lot;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventaireController extends Controller
{
    /**
     * Liste des inventaires
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $periodeId = $request->input('periode_id');
            $magasinId = $request->input('magasin_id');
            $produitId = $request->input('produit_id');
            $search = $request->input('search');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Inventaire::with(['periodeInventaire', 'produit', 'magasin', 'utilisateur']);

            if ($search) {
                $query->whereHas('produit', function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('code_article', 'like', "%{$search}%");
                });
            }

            if ($periodeId) {
                $query->where('id_periode_inventaire', $periodeId);
            }

            if ($magasinId) {
                $query->where('id_magasin', $magasinId);
            }

            if ($produitId) {
                $query->where('id_produit', $produitId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des inventaires récupérée avec succès'
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
     * Créer un inventaire (saisie de comptage)
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_periode_inventaire' => 'required|exists:periode_inventaire,id',
                'id_produit' => 'required|exists:produits,id',
                'id_magasin' => 'required|exists:magasins,id',
                'stock_physique_compte' => 'required|integer|min:0',
                'commentaire' => 'nullable|string',
            ]);

            // Vérifier que la période est en cours
            $periode = PeriodeInventaire::findOrFail($validated['id_periode_inventaire']);
            if ($periode->statut !== 'EN_COURS') {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'inventaire ne peut être saisi que pour une période en cours'
                ], 403);
            }

            // Calculer le stock théorique
            $stockTheorique = Lot::where('id_produit', $validated['id_produit'])
                ->where('id_magasin', $validated['id_magasin'])
                ->where('statut_validation', 'VALIDÉ')
                ->where('quantite_disponible', '>', 0)
                ->sum('quantite_disponible');

            // Vérifier si un inventaire existe déjà pour ce produit dans cette période
            $existing = Inventaire::where('id_periode_inventaire', $validated['id_periode_inventaire'])
                ->where('id_produit', $validated['id_produit'])
                ->where('id_magasin', $validated['id_magasin'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un inventaire existe déjà pour ce produit dans cette période'
                ], 422);
            }

            $inventaire = Inventaire::create([
                'id_periode_inventaire' => $validated['id_periode_inventaire'],
                'id_produit' => $validated['id_produit'],
                'id_magasin' => $validated['id_magasin'],
                'stock_theorique' => $stockTheorique,
                'stock_physique_compte' => $validated['stock_physique_compte'],
                'date_saisie' => now(),
                'id_utilisateur' => Auth::id(),
                'commentaire' => $validated['commentaire'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'data' => $inventaire->load(['periodeInventaire', 'produit', 'magasin']),
                'message' => 'Inventaire créé avec succès'
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
                'message' => 'Erreur lors de la création de l\'inventaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un inventaire
     */
    public function show($id)
    {
        try {
            $inventaire = Inventaire::with(['periodeInventaire', 'produit', 'magasin', 'utilisateur'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $inventaire,
                'message' => 'Détail de l\'inventaire récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Inventaire non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un inventaire (seulement si période en cours)
     */
    public function update(Request $request, $id)
    {
        try {
            $inventaire = Inventaire::findOrFail($id);

            // Vérifier que la période est en cours
            $periode = $inventaire->periodeInventaire;
            if ($periode->statut !== 'EN_COURS') {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'inventaire ne peut être modifié que pour une période en cours'
                ], 403);
            }

            $validated = $request->validate([
                'stock_physique_compte' => 'required|integer|min:0',
                'commentaire' => 'nullable|string',
            ]);

            $inventaire->update([
                'stock_physique_compte' => $validated['stock_physique_compte'],
                'commentaire' => $validated['commentaire'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'data' => $inventaire->load(['periodeInventaire', 'produit', 'magasin']),
                'message' => 'Inventaire mis à jour avec succès'
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
     * Supprimer un inventaire
     */
    public function destroy($id)
    {
        try {
            $inventaire = Inventaire::findOrFail($id);

            $periode = $inventaire->periodeInventaire;
            if ($periode->statut !== 'EN_COURS') {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'inventaire ne peut être supprimé que pour une période en cours'
                ], 403);
            }

            $inventaire->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inventaire supprimé avec succès'
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
     * Générer les ajustements automatiques à partir des écarts
     */
    public function genererAjustements($periodeId)
    {
        try {
            $periode = PeriodeInventaire::findOrFail($periodeId);

            if ($periode->statut !== 'CLOTURE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Les ajustements ne peuvent être générés que pour une période clôturée'
                ], 403);
            }

            $inventaires = Inventaire::where('id_periode_inventaire', $periodeId)
                ->where('ecart', '!=', 0)
                ->get();

            if ($inventaires->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'periode' => $periode->libelle,
                        'total_ecart' => 0,
                        'ajustements' => [],
                    ],
                    'message' => 'Aucun écart à ajuster'
                ]);
            }

            $ajustements = [];
            foreach ($inventaires as $inventaire) {
                $ajustements[] = [
                    'produit' => $inventaire->produit->nom,
                    'ecart' => $inventaire->ecart,
                    'stock_theorique' => $inventaire->stock_theorique,
                    'stock_physique' => $inventaire->stock_physique_compte,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'periode' => $periode->libelle,
                    'total_ecart' => $periode->getTotalEcart(),
                    'ajustements' => $ajustements,
                ],
                'message' => 'Ajustements générés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération des ajustements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Résumé de l'inventaire par période
     */
    public function resume($periodeId)
    {
        try {
            $periode = PeriodeInventaire::with(['magasin', 'inventaires.produit'])
                ->findOrFail($periodeId);

            $inventaires = $periode->inventaires;

            $totalTheorique = $inventaires->sum('stock_theorique');
            $totalPhysique = $inventaires->sum('stock_physique_compte');
            $totalEcart = $inventaires->sum('ecart');

            // Produits avec écart
            $ecartsPositifs = $inventaires->where('ecart', '>', 0)->count();
            $ecartsNegatifs = $inventaires->where('ecart', '<', 0)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'periode' => [
                        'id' => $periode->id,
                        'libelle' => $periode->libelle,
                        'statut' => $periode->statut,
                        'magasin' => $periode->magasin->nom,
                    ],
                    'total' => [
                        'stock_theorique' => $totalTheorique,
                        'stock_physique' => $totalPhysique,
                        'ecart' => $totalEcart,
                    ],
                    'statistiques' => [
                        'nombre_produits' => $inventaires->count(),
                        'ecarts_positifs' => $ecartsPositifs,
                        'ecarts_negatifs' => $ecartsNegatifs,
                        'sans_ecart' => $inventaires->where('ecart', 0)->count(),
                    ],
                ],
                'message' => 'Résumé de l\'inventaire récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du résumé',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}