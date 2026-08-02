<?php

namespace App\Http\Controllers\Api\Config;

use App\Helpers\CodeGenerator;
use App\Http\Controllers\Controller;
use App\Models\Inventaire;
use App\Models\PeriodeInventaire;
use App\Models\Produit;
use App\Models\Lot;
use App\Models\MouvementStock;
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

            // Le stock théorique est recalculé en direct (le stocké peut être obsolète si des mouvements ont eu lieu après la saisie)
            foreach ($data as $inventaire) {
                $theoriqueActuel = $this->getStockTheoriqueActuel((int) $inventaire->id_produit, (int) $inventaire->id_magasin);
                $inventaire->stock_theorique = $theoriqueActuel;
                $inventaire->ecart = (int) $inventaire->stock_physique_compte - $theoriqueActuel;
            }

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
     * Stock théorique actuel : somme des lots VALIDÉS non épuisés d'un produit dans un magasin.
     * Recalculé en direct car la valeur figée à la saisie peut être obsolète.
     */
    private function getStockTheoriqueActuel(int $idProduit, int $idMagasin): int
    {
        return (int) Lot::where('id_produit', $idProduit)
            ->where('id_magasin', $idMagasin)
            ->where('statut_validation', 'VALIDÉ')
            ->where('quantite_disponible', '>', 0)
            ->sum('quantite_disponible');
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
                'ecart_saisie' => $validated['stock_physique_compte'] - $stockTheorique,
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
     * Créer plusieurs inventaires (saisie multiple de produits)
     */
    public function storeMultiple(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_periode_inventaire' => 'required|exists:periode_inventaire,id',
                'id_magasin' => 'required|exists:magasins,id',
                'lignes' => 'required|array|min:1',
                'lignes.*.id_produit' => 'required|integer|distinct|exists:produits,id',
                'lignes.*.stock_physique_compte' => 'required|integer|min:0',
                'lignes.*.commentaire' => 'nullable|string',
            ]);

            // Vérifier que la période est en cours
            $periode = PeriodeInventaire::findOrFail($validated['id_periode_inventaire']);
            if ($periode->statut !== 'EN_COURS') {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'inventaire ne peut être saisi que pour une période en cours'
                ], 403);
            }

            // Produits déjà saisis pour cette période et ce magasin
            $dejaSaisis = Inventaire::where('id_periode_inventaire', $periode->id)
                ->where('id_magasin', $validated['id_magasin'])
                ->pluck('id_produit')
                ->map(fn($id) => (int) $id)
                ->all();

            $created = [];
            $ignores = [];

            DB::transaction(function () use ($validated, $periode, &$dejaSaisis, &$created, &$ignores) {
                foreach ($validated['lignes'] as $ligne) {
                    $idProduit = (int) $ligne['id_produit'];

                    if (in_array($idProduit, $dejaSaisis)) {
                        $ignores[] = $idProduit;
                        continue;
                    }

                    // Calculer le stock théorique
                    $stockTheorique = (int) Lot::where('id_produit', $idProduit)
                        ->where('id_magasin', $validated['id_magasin'])
                        ->where('statut_validation', 'VALIDÉ')
                        ->where('quantite_disponible', '>', 0)
                        ->sum('quantite_disponible');

                    $inventaire = Inventaire::create([
                        'id_periode_inventaire' => $periode->id,
                        'id_produit' => $idProduit,
                        'id_magasin' => $validated['id_magasin'],
                        'stock_theorique' => $stockTheorique,
                        'stock_physique_compte' => $ligne['stock_physique_compte'],
                        'ecart_saisie' => $ligne['stock_physique_compte'] - $stockTheorique,
                        'date_saisie' => now(),
                        'id_utilisateur' => Auth::id(),
                        'commentaire' => $ligne['commentaire'] ?? null,
                    ]);

                    $created[] = $inventaire;
                    $dejaSaisis[] = $idProduit;
                }
            });

            $inventaires = Inventaire::with(['periodeInventaire', 'produit', 'magasin'])
                ->whereIn('id', collect($created)->pluck('id'))
                ->get();

            $message = count($created) . ' inventaire(s) créé(s) avec succès';
            if (count($ignores) > 0) {
                $message .= ', ' . count($ignores) . ' ignoré(s) (produit déjà saisi)';
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'cree' => count($created),
                    'ignores' => $ignores,
                    'inventaires' => $inventaires,
                ],
                'message' => $message
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
                'message' => 'Erreur lors de la création des inventaires',
                'error' => $e->getMessage()
            ], 500);
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
                'ecart_saisie' => $validated['stock_physique_compte'] - $inventaire->stock_theorique,
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

            $inventaires = Inventaire::with('produit')->where('id_periode_inventaire', $periodeId)->get();

            $ajustements = [];
            $totalEcart = 0;
            foreach ($inventaires as $inventaire) {
                // Écart figé à la saisie : conserve l'historique même après « Mise à jour stock »
                $ecart = (int) $inventaire->ecart_saisie;

                if ($ecart === 0) {
                    continue;
                }

                $totalEcart += $ecart;
                $ajustements[] = [
                    'produit' => $inventaire->produit->nom,
                    'ecart' => $ecart,
                    'stock_theorique' => (int) $inventaire->stock_theorique,
                    'stock_physique' => (int) $inventaire->stock_physique_compte,
                ];
            }

            if (empty($ajustements)) {
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

            return response()->json([
                'success' => true,
                'data' => [
                    'periode' => $periode->libelle,
                    'total_ecart' => $totalEcart,
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
     * Mettre à jour le stock par rapport au stock physique compté
     */
    public function mettreAJourStock($periodeId)
    {
        try {
            $periode = PeriodeInventaire::findOrFail($periodeId);

            if ($periode->statut !== 'CLOTURE') {
                return response()->json([
                    'success' => false,
                    'message' => 'La mise à jour du stock ne peut être faite que pour une période clôturée'
                ], 403);
            }

            // Empêcher une double application sur la même période
            $dejaApplique = MouvementStock::where('id_periode_inventaire', $periodeId)
                ->whereIn('id_type_mouvement', [3, 4])
                ->exists();

            if ($dejaApplique) {
                return response()->json([
                    'success' => false,
                    'message' => 'La mise à jour du stock a déjà été appliquée pour cette période'
                ], 422);
            }

            $inventaires = Inventaire::where('id_periode_inventaire', $periodeId)->get();

            if ($inventaires->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'periode' => $periode->libelle,
                        'produits_ajustes' => 0,
                        'total_ajoute' => 0,
                        'total_retire' => 0,
                    ],
                    'message' => 'Aucun écart à appliquer'
                ]);
            }

            $produitsAjustes = 0;
            $totalAjoute = 0;
            $totalRetire = 0;

            DB::transaction(function () use ($inventaires, $periode, &$produitsAjustes, &$totalAjoute, &$totalRetire) {
                foreach ($inventaires as $inventaire) {
                    // Recalculer le disponible actuel (le stock théorique figé à la saisie peut être obsolète)
                    $disponibleActuel = (int) Lot::where('id_produit', $inventaire->id_produit)
                        ->where('id_magasin', $inventaire->id_magasin)
                        ->where('statut_validation', 'VALIDÉ')
                        ->where('quantite_disponible', '>', 0)
                        ->sum('quantite_disponible');

                    $delta = $inventaire->stock_physique_compte - $disponibleActuel;

                    if ($delta === 0) {
                        continue;
                    }

                    $reference = 'INV-' . $periode->id . '-' . $inventaire->id_produit;
                    $commentaire = 'Ajustement inventaire : ' . $periode->libelle;

                    if ($delta > 0) {
                        // Excédent : créer un lot d'ajustement positif
                        $numeroLot = CodeGenerator::lot();
                        $lot = Lot::create([
                            'id_produit' => $inventaire->id_produit,
                            'id_magasin' => $inventaire->id_magasin,
                            'numero_lot' => $numeroLot,
                            'code_qr' => Lot::generateQrCode($numeroLot),
                            'quantite_recue' => $delta,
                            'quantite_disponible' => $delta,
                            'date_reception' => now(),
                            'valide_par' => Auth::id(),
                            'date_validation' => now(),
                            'statut_validation' => 'VALIDÉ',
                            'commentaire' => $commentaire,
                        ]);

                        MouvementStock::create([
                            'id_lot' => $lot->id,
                            'id_type_mouvement' => 3, // Ajustement positif
                            'quantite' => $delta,
                            'date_mouvement' => now(),
                            'id_utilisateur' => Auth::id(),
                            'reference_document' => $reference,
                            'commentaire' => $commentaire,
                            'id_periode_inventaire' => $periode->id,
                            'valide_par' => Auth::id(),
                            'date_validation' => now(),
                            'statut_validation' => 'VALIDÉ',
                        ]);

                        $produitsAjustes++;
                        $totalAjoute += $delta;
                    } else {
                        // Manquant : retirer du stock (FIFO, lot le plus ancien d'abord)
                        $objectif = abs($delta);
                        $retire = 0;
                        $lots = Lot::where('id_produit', $inventaire->id_produit)
                            ->where('id_magasin', $inventaire->id_magasin)
                            ->where('statut_validation', 'VALIDÉ')
                            ->where('quantite_disponible', '>', 0)
                            ->orderBy('id', 'asc')
                            ->get();

                        foreach ($lots as $lot) {
                            if ($objectif <= 0) {
                                break;
                            }
                            $retrait = min($lot->quantite_disponible, $objectif);
                            $lot->decrement('quantite_disponible', $retrait);
                            $objectif -= $retrait;
                            $retire += $retrait;

                            MouvementStock::create([
                                'id_lot' => $lot->id,
                                'id_type_mouvement' => 4, // Ajustement négatif
                                'quantite' => $retrait,
                                'date_mouvement' => now(),
                                'id_utilisateur' => Auth::id(),
                                'reference_document' => $reference,
                                'commentaire' => $commentaire,
                                'id_periode_inventaire' => $periode->id,
                                'valide_par' => Auth::id(),
                                'date_validation' => now(),
                                'statut_validation' => 'VALIDÉ',
                            ]);
                        }

                        if ($retire > 0) {
                            $produitsAjustes++;
                            $totalRetire += $retire;
                        }
                    }
                }
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'periode' => $periode->libelle,
                    'produits_ajustes' => $produitsAjustes,
                    'total_ajoute' => $totalAjoute,
                    'total_retire' => $totalRetire,
                ],
                'message' => $produitsAjustes > 0 ? 'Stock mis à jour avec succès' : 'Aucun écart à appliquer'
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
                'message' => 'Erreur lors de la mise à jour du stock',
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

            $totalTheorique = 0;
            $totalPhysique = 0;
            $totalEcart = 0;
            $ecartsPositifs = 0;
            $ecartsNegatifs = 0;
            $sansEcart = 0;

            foreach ($inventaires as $inventaire) {
                $theoriqueActuel = $this->getStockTheoriqueActuel((int) $inventaire->id_produit, (int) $inventaire->id_magasin);
                $physique = (int) $inventaire->stock_physique_compte;
                $ecart = $physique - $theoriqueActuel;

                $totalTheorique += $theoriqueActuel;
                $totalPhysique += $physique;
                $totalEcart += $ecart;

                if ($ecart > 0) {
                    $ecartsPositifs++;
                } elseif ($ecart < 0) {
                    $ecartsNegatifs++;
                } else {
                    $sansEcart++;
                }
            }

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
                        'sans_ecart' => $sansEcart,
                    ],
                    'stock_mis_a_jour' => MouvementStock::where('id_periode_inventaire', $periodeId)
                        ->whereIn('id_type_mouvement', [3, 4])
                        ->exists(),
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