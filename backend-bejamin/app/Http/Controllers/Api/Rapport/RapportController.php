<?php

namespace App\Http\Controllers\Api\Rapport;

use App\Http\Controllers\Controller;
use App\Models\BonCommande;
use App\Models\LigneCommande;
use App\Models\Lot;
use App\Models\MouvementStock;
use App\Models\Produit;
use App\Models\Partenaire;
use App\Models\Retour;
use App\Models\Inventaire;
use App\Models\Categorie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RapportController extends Controller
{
    /**
     * Calcul automatique du tableau de variation stock
     */
    public function variationStockCalcul(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');

            // Catégories FOOD vs Lessiviels (Linge & Textile, Hygiène & Entretien)
            $foodCatIds = [2, 3, 4, 5, 6];
            $lessivielsCatIds = Categorie::whereIn('nom', ['Linge & Textile', 'Hygiène & Entretien'])
                ->pluck('id')->toArray();
            if (empty($lessivielsCatIds)) {
                $lessivielsCatIds = [7, 8];
            }

            $isFood = function ($categorieId) use ($foodCatIds, $lessivielsCatIds) {
                return in_array($categorieId, $foodCatIds);
            };

            // ===== Achats du mois (bons de commande) =====
            $achatsFood = 0;
            $achatsLessiviels = 0;

            $bcs = BonCommande::with('lignes.produit.categorie')
                ->where('statut', '!=', 'CLOTURE');
            if ($dateDebut) {
                $bcs->whereDate('date_commande', '>=', $dateDebut);
            }
            if ($dateFin) {
                $bcs->whereDate('date_commande', '<=', $dateFin);
            }

            foreach ($bcs->get() as $bc) {
                foreach ($bc->lignes as $ligne) {
                    $montant = (float) $ligne->prix_unitaire_ht * (int) $ligne->quantite_commandee;
                    $catId = $ligne->produit ? $ligne->produit->id_categorie : null;
                    if ($isFood($catId)) {
                        $achatsFood += $montant;
                    } elseif (in_array($catId, $lessivielsCatIds)) {
                        $achatsLessiviels += $montant;
                    } else {
                        $achatsFood += $montant;
                    }
                }
            }

            // ===== Stock initial (lots validés actuels, valorisés) =====
            $stockInitialFood = 0;
            $stockInitialLessiviels = 0;

            $lots = Lot::with(['produit.categorie', 'devise'])
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->get();

            foreach ($lots as $lot) {
                $prix = (float) ($lot->prix_achat_ht_unitaire ?? 0);
                if ($prix <= 0) {
                    $dernierPrix = $lot->produit->getDernierPrixAchat();
                    $prix = (float) ($dernierPrix->prix_achat_ht ?? 0);
                }
                $valeur = $lot->quantite_disponible * $prix;
                $catId = $lot->produit ? $lot->produit->id_categorie : null;
                if ($isFood($catId)) {
                    $stockInitialFood += $valeur;
                } elseif (in_array($catId, $lessivielsCatIds)) {
                    $stockInitialLessiviels += $valeur;
                } else {
                    $stockInitialFood += $valeur;
                }
            }

            // ===== Consommation du mois (sorties stock validées) =====
            $consoFood = 0;

            $sorties = MouvementStock::with(['lot.produit.categorie', 'lot.devise'])
                ->where('id_type_mouvement', 2)
                ->where('statut_validation', 'VALIDÉ');
            if ($dateDebut) {
                $sorties->whereDate('date_mouvement', '>=', $dateDebut);
            }
            if ($dateFin) {
                $sorties->whereDate('date_mouvement', '<=', $dateFin);
            }

            foreach ($sorties->get() as $mvt) {
                $lot = $mvt->lot;
                $prix = (float) ($lot->prix_achat_ht_unitaire ?? 0);
                if ($prix <= 0) {
                    $dernierPrix = $lot->produit->getDernierPrixAchat();
                    $prix = (float) ($dernierPrix->prix_achat_ht ?? 0);
                }
                $valeur = $mvt->quantite * $prix;
                $catId = $lot->produit ? $lot->produit->id_categorie : null;
                if ($isFood($catId)) {
                    $consoFood += $valeur;
                } elseif (in_array($catId, $lessivielsCatIds)) {
                    $consoFood += $valeur;
                } else {
                    $consoFood += $valeur;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'stock_initial' => round($stockInitialFood, 2),
                    'achats_food' => round($achatsFood, 2),
                    'stock_initial_lessiviels' => round($stockInitialLessiviels, 2),
                    'achats_lessiviels' => round($achatsLessiviels, 2),
                    'conso_food' => round($consoFood, 2),
                ],
                'message' => 'Calcul de variation stock effectué'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 1. Rapport Bon de Commande
     */
    public function bonCommande(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $magasinId = $request->input('magasin_id');
            $statut = $request->input('statut');

            $query = BonCommande::with(['partenaire', 'magasinDestination', 'lignes.produit']);

            if ($dateDebut) {
                $query->whereDate('date_commande', '>=', $dateDebut);
            }
            if ($dateFin) {
                $query->whereDate('date_commande', '<=', $dateFin);
            }
            if ($magasinId) {
                $query->where('id_magasin_destination', $magasinId);
            }
            if ($statut) {
                $query->where('statut', $statut);
            }

            $data = $query->orderBy('date_commande', 'desc')->get();

            // Calcul des totaux
            $totalCommande = $data->sum('montant_total_ht');
            $totalLignes = 0;
            foreach ($data as $bon) {
                $totalLignes += $bon->lignes->count();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'bons_commande' => $data,
                    'statistiques' => [
                        'total_bons' => $data->count(),
                        'total_lignes' => $totalLignes,
                        'total_montant_ht' => $totalCommande,
                    ]
                ],
                'message' => 'Rapport bon de commande récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 2. Rapport Bon de Livraison
     */
    public function bonLivraison(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $magasinId = $request->input('magasin_id');

            $query = BonCommande::with(['partenaire', 'magasinDestination', 'lignes.produit'])
                ->whereIn('statut', ['REÇU', 'REÇU PARTIELLEMENT']);

            if ($dateDebut) {
                $query->whereDate('date_commande', '>=', $dateDebut);
            }
            if ($dateFin) {
                $query->whereDate('date_commande', '<=', $dateFin);
            }
            if ($magasinId) {
                $query->where('id_magasin_destination', $magasinId);
            }

            $data = $query->orderBy('date_commande', 'desc')->get();

            $totalRecu = 0;
            foreach ($data as $bon) {
                $totalRecu += $bon->lignes->sum('quantite_recue');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'bons_livraison' => $data,
                    'statistiques' => [
                        'total_bons' => $data->count(),
                        'total_quantite_recue' => $totalRecu,
                    ]
                ],
                'message' => 'Rapport bon de livraison récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 3. Rapport Stock
     */
    public function rapportStock(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut', now()->startOfMonth()->toDateString());
            $dateFin = $request->input('date_fin', now()->toDateString());
            $magasinId = $request->input('magasin_id');
            $categorieId = $request->input('categorie_id');

            // Lots validés en stock (stock final)
            $lotQuery = Lot::with(['produit.unite', 'produit.categorie'])
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ');

            if ($magasinId) {
                $lotQuery->where('id_magasin', $magasinId);
            }
            if ($categorieId) {
                $lotQuery->whereHas('produit', function($q) use ($categorieId) {
                    $q->where('id_categorie', $categorieId);
                });
            }

            $lots = $lotQuery->get();

            // Mouvements validés de la période
            $mouvementQuery = MouvementStock::with(['lot.produit', 'typeMouvement'])
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin])
                ->where('statut_validation', 'VALIDÉ');

            if ($magasinId) {
                $mouvementQuery->whereHas('lot', function($q) use ($magasinId) {
                    $q->where('id_magasin', $magasinId);
                });
            }
            if ($categorieId) {
                $mouvementQuery->whereHas('lot.produit', function($q) use ($categorieId) {
                    $q->where('id_categorie', $categorieId);
                });
            }

            $mouvements = $mouvementQuery->get();

            // Entrées / sorties par produit sur la période
            $entreesParProduit = [];
            $sortiesParProduit = [];
            foreach ($mouvements as $mvt) {
                $produitId = $mvt->lot->id_produit;
                if ($mvt->typeMouvement && $mvt->typeMouvement->sens === 1) {
                    $entreesParProduit[$produitId] = ($entreesParProduit[$produitId] ?? 0) + $mvt->quantite;
                } else {
                    $sortiesParProduit[$produitId] = ($sortiesParProduit[$produitId] ?? 0) + $mvt->quantite;
                }
            }

            // Produits concernés : ceux en stock final + ceux ayant des mouvements dans la période
            $produitIds = [];
            foreach ($lots as $lot) {
                $produitIds[$lot->id_produit] = true;
            }
            foreach (array_merge(array_keys($entreesParProduit), array_keys($sortiesParProduit)) as $id) {
                $produitIds[$id] = true;
            }

            $produits = Produit::with(['unite', 'categorie'])
                ->whereIn('id', array_keys($produitIds))
                ->get();

            $lignes = [];
            $totalValeurInitiale = 0;
            $totalValeurEntrees = 0;
            $totalValeurSorties = 0;
            $totalValeurFinale = 0;
            $totalQteInitiale = 0;
            $totalQteEntrees = 0;
            $totalQteSorties = 0;
            $totalQteFinale = 0;

            $n = 0;
            foreach ($produits as $produit) {
                // Stock final = somme des quantités disponibles des lots validés
                $qteFinale = 0;
                foreach ($lots as $lot) {
                    if ($lot->id_produit === $produit->id) {
                        $qteFinale += $lot->quantite_disponible;
                    }
                }

                $entrees = $entreesParProduit[$produit->id] ?? 0;
                $sorties = $sortiesParProduit[$produit->id] ?? 0;

                // Stock initial reconstitué : final - entrées + sorties
                $qteInitiale = $qteFinale - $entrees + $sorties;

                // Prix unitaire : dernier prix d'achat, sinon prix du lot
                $prixUnitaire = 0;
                $devise = 'USD';
                $dernierPrix = $produit->getDernierPrixAchat();
                if ($dernierPrix) {
                    $prixUnitaire = (float) ($dernierPrix->prix_achat_ht ?? 0);
                    if ($dernierPrix->devise) {
                        $devise = $dernierPrix->devise->code;
                    }
                }
                if ($prixUnitaire <= 0) {
                    foreach ($lots as $lot) {
                        if ($lot->id_produit === $produit->id && $lot->prix_achat_ht_unitaire > 0) {
                            $prixUnitaire = (float) $lot->prix_achat_ht_unitaire;
                            break;
                        }
                    }
                }

                $n++;
                $lignes[] = [
                    'numero' => $n,
                    'designation' => $produit->nom,
                    'code_article' => $produit->code_article,
                    'unite' => $produit->unite->symbole ?? '-',
                    'prix_unitaire' => round($prixUnitaire, 2),
                    'devise' => $devise,
                    'qte_initiale' => round($qteInitiale, 2),
                    'valeur_initiale' => round($qteInitiale * $prixUnitaire, 2),
                    'qte_entree' => round($entrees, 2),
                    'valeur_entree' => round($entrees * $prixUnitaire, 2),
                    'qte_sortie' => round($sorties, 2),
                    'valeur_sortie' => round($sorties * $prixUnitaire, 2),
                    'qte_finale' => round($qteFinale, 2),
                    'valeur_finale' => round($qteFinale * $prixUnitaire, 2),
                ];

                $totalQteInitiale += $qteInitiale;
                $totalQteEntrees += $entrees;
                $totalQteSorties += $sorties;
                $totalQteFinale += $qteFinale;
                $totalValeurInitiale += $qteInitiale * $prixUnitaire;
                $totalValeurEntrees += $entrees * $prixUnitaire;
                $totalValeurSorties += $sorties * $prixUnitaire;
                $totalValeurFinale += $qteFinale * $prixUnitaire;
            }

            usort($lignes, function($a, $b) {
                return $b['qte_finale'] - $a['qte_finale'];
            });
            // Renumérotation après tri
            foreach ($lignes as $i => &$ligne) {
                $ligne['numero'] = $i + 1;
            }
            unset($ligne);

            return response()->json([
                'success' => true,
                'data' => [
                    'lignes' => $lignes,
                    'periode' => [
                        'debut' => $dateDebut,
                        'fin' => $dateFin,
                    ],
                    'statistiques' => [
                        'total_produits' => count($lignes),
                        'total_qte_initiale' => round($totalQteInitiale, 2),
                        'total_qte_entree' => round($totalQteEntrees, 2),
                        'total_qte_sortie' => round($totalQteSorties, 2),
                        'total_qte_finale' => round($totalQteFinale, 2),
                        'total_valeur_initiale' => round($totalValeurInitiale, 2),
                        'total_valeur_entree' => round($totalValeurEntrees, 2),
                        'total_valeur_sortie' => round($totalValeurSorties, 2),
                        'total_valeur_finale' => round($totalValeurFinale, 2),
                    ]
                ],
                'message' => 'Rapport stock récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 3bis. Rapport Stock logique/physique
     */
    public function rapportStockPhysiqueLogique(Request $request)
    {
        try {
            $magasinId = $request->input('magasin_id');
            $categorieId = $request->input('categorie_id');

            // Stock logique = somme des quantités disponibles des lots validés
            $lotQuery = Lot::with(['produit.unite', 'produit.categorie', 'devise'])
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ');

            if ($magasinId) {
                $lotQuery->where('id_magasin', $magasinId);
            }
            if ($categorieId) {
                $lotQuery->whereHas('produit', function($q) use ($categorieId) {
                    $q->where('id_categorie', $categorieId);
                });
            }

            $lots = $lotQuery->get();

            // Stock logique par produit
            $qteLogiqueParProduit = [];
            foreach ($lots as $lot) {
                $qteLogiqueParProduit[$lot->id_produit] = ($qteLogiqueParProduit[$lot->id_produit] ?? 0) + $lot->quantite_disponible;
            }

            // Saisies inventaire physiques (les plus récentes par produit)
            $inventaires = Inventaire::with('produit')
                ->orderBy('date_saisie', 'desc')
                ->get()
                ->groupBy('id_produit')
                ->map(function($group) {
                    return $group->first();
                });

            // Produits concernés : en stock logique + inventoriés
            $produitIds = array_keys($qteLogiqueParProduit);
            foreach ($inventaires as $inv) {
                $produitIds[$inv->id_produit] = $inv->id_produit;
            }
            $produitIds = array_values($produitIds);

            if (empty($produitIds)) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'lignes' => [],
                        'statistiques' => [
                            'total_produits' => 0,
                            'total_qte_logique' => 0,
                            'total_valeur_logique' => 0,
                            'total_qte_physique' => 0,
                            'total_valeur_physique' => 0,
                            'total_ecart' => 0,
                            'total_valeur_ecart' => 0,
                        ],
                    ],
                    'message' => 'Rapport stock logique/physique récupéré avec succès'
                ]);
            }

            $produits = Produit::with(['unite', 'categorie'])
                ->whereIn('id', $produitIds)
                ->get();

            $lignes = [];
            $totalQteLogique = 0;
            $totalValeurLogique = 0;
            $totalQtePhysique = 0;
            $totalValeurPhysique = 0;
            $totalEcart = 0;
            $totalValeurEcart = 0;

            $n = 0;
            foreach ($produits as $produit) {
                $qteLogique = $qteLogiqueParProduit[$produit->id] ?? 0;
                $inventaire = $inventaires->get($produit->id);

                // Qté physique : saisie inventaire, sinon = stock logique (écart 0)
                $qtePhysique = $inventaire ? (int) $inventaire->stock_physique_compte : $qteLogique;
                $ecart = $qtePhysique - $qteLogique;

                // Prix unitaire : dernier prix d'achat, sinon prix du lot
                $prixUnitaire = 0;
                $devise = 'USD';
                $dernierPrix = $produit->getDernierPrixAchat();
                if ($dernierPrix) {
                    $prixUnitaire = (float) ($dernierPrix->prix_achat_ht ?? 0);
                    if ($dernierPrix->devise) {
                        $devise = $dernierPrix->devise->code;
                    }
                }
                if ($prixUnitaire <= 0) {
                    foreach ($lots as $lot) {
                        if ($lot->id_produit === $produit->id && $lot->prix_achat_ht_unitaire > 0) {
                            $prixUnitaire = (float) $lot->prix_achat_ht_unitaire;
                            if ($lot->devise) {
                                $devise = $lot->devise->code;
                            }
                            break;
                        }
                    }
                }

                $n++;
                $lignes[] = [
                    'numero' => $n,
                    'designation' => $produit->nom,
                    'code_article' => $produit->code_article,
                    'unite' => $produit->unite->symbole ?? '-',
                    'prix_unitaire' => round($prixUnitaire, 2),
                    'devise' => $devise,
                    'qte_logique' => round($qteLogique, 2),
                    'valeur_logique' => round($qteLogique * $prixUnitaire, 2),
                    'qte_physique' => round($qtePhysique, 2),
                    'valeur_physique' => round($qtePhysique * $prixUnitaire, 2),
                    'ecart' => round($ecart, 2),
                    'valeur_ecart' => round($ecart * $prixUnitaire, 2),
                ];

                $totalQteLogique += $qteLogique;
                $totalValeurLogique += $qteLogique * $prixUnitaire;
                $totalQtePhysique += $qtePhysique;
                $totalValeurPhysique += $qtePhysique * $prixUnitaire;
                $totalEcart += $ecart;
                $totalValeurEcart += $ecart * $prixUnitaire;
            }

            usort($lignes, function($a, $b) {
                return $b['qte_physique'] - $a['qte_physique'];
            });
            foreach ($lignes as $i => &$ligne) {
                $ligne['numero'] = $i + 1;
            }
            unset($ligne);

            return response()->json([
                'success' => true,
                'data' => [
                    'lignes' => $lignes,
                    'statistiques' => [
                        'total_produits' => count($lignes),
                        'total_qte_logique' => round($totalQteLogique, 2),
                        'total_valeur_logique' => round($totalValeurLogique, 2),
                        'total_qte_physique' => round($totalQtePhysique, 2),
                        'total_valeur_physique' => round($totalValeurPhysique, 2),
                        'total_ecart' => round($totalEcart, 2),
                        'total_valeur_ecart' => round($totalValeurEcart, 2),
                    ],
                ],
                'message' => 'Rapport stock logique/physique récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 4. Variation Stock
     */
    public function variationStock(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());
            $produitId = $request->input('produit_id');
            $magasinId = $request->input('magasin_id');

            $query = MouvementStock::with(['lot.produit', 'typeMouvement', 'lot.magasin'])
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin])
                ->where('statut_validation', 'VALIDÉ');

            if ($produitId) {
                $query->whereHas('lot.produit', function($q) use ($produitId) {
                    $q->where('id', $produitId);
                });
            }
            if ($magasinId) {
                $query->whereHas('lot', function($q) use ($magasinId) {
                    $q->where('id_magasin', $magasinId);
                });
            }

            $mouvements = $query->orderBy('date_mouvement')->get();

            // Calcul des entrées et sorties
            $entrees = 0;
            $sorties = 0;
            foreach ($mouvements as $mvt) {
                if ($mvt->typeMouvement->sens === 1) {
                    $entrees += $mvt->quantite;
                } else {
                    $sorties += $mvt->quantite;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'mouvements' => $mouvements,
                    'statistiques' => [
                        'total_mouvements' => $mouvements->count(),
                        'total_entrees' => $entrees,
                        'total_sorties' => $sorties,
                        'variation' => $entrees - $sorties,
                        'periode' => [
                            'debut' => $dateDebut,
                            'fin' => $dateFin,
                        ]
                    ]
                ],
                'message' => 'Rapport variation stock récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 5. Rapport Client
     */
    public function rapportClient(Request $request)
    {
        try {
            $clientId = $request->input('client_id');
            $clientTerm = $request->input('client');
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');

            $clients = Partenaire::with([
                'bonCommandes' => function ($q) use ($dateDebut, $dateFin) {
                    if ($dateDebut) {
                        $q->whereDate('date_commande', '>=', $dateDebut);
                    }
                    if ($dateFin) {
                        $q->whereDate('date_commande', '<=', $dateFin);
                    }
                    $q->where('statut', '!=', 'CLOTURE');
                },
                'bonCommandes.lignes.produit.unite',
            ])->where('type_client', 'aerien');

            if ($clientId) {
                $clients->where('id', $clientId);
            } elseif ($clientTerm) {
                $clients->where(function ($q) use ($clientTerm) {
                    $q->where('nom', 'LIKE', "%{$clientTerm}%")
                      ->orWhere('code_iata', 'LIKE', "%{$clientTerm}%")
                      ->orWhere('email', 'LIKE', "%{$clientTerm}%");
                });
            }

            $lignes = [];
            $numero = 0;
            $totalLignes = 0;
            $totalQuantite = 0;
            $totalValeur = 0;

            foreach ($clients->get() as $client) {
                foreach ($client->bonCommandes as $bon) {
                    foreach ($bon->lignes as $ligne) {
                        $produit = $ligne->produit;
                        if (!$produit) {
                            continue;
                        }
                        $numero++;
                        $quantite = (int) $ligne->quantite_commandee;
                        $prix = (float) $ligne->prix_unitaire_ht;
                        $valeur = $quantite * $prix;
                        $totalLignes++;
                        $totalQuantite += $quantite;
                        $totalValeur += $valeur;

                        $lignes[] = [
                            'numero' => $numero,
                            'id_client' => $client->id,
                            'client' => $client->nom,
                            'numero_commande' => $bon->numero_commande,
                            'date_commande' => $bon->date_commande,
                            'designation' => $produit->nom,
                            'article' => $produit->code_article,
                            'unite' => optional($produit->unite)->nom,
                            'prix_unitaire' => $prix,
                            'devise' => optional($ligne->devise)->code,
                            'quantite' => $quantite,
                            'valeur' => $valeur,
                        ];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'lignes' => $lignes,
                    'statistiques' => [
                        'total_lignes' => $totalLignes,
                        'total_quantite' => $totalQuantite,
                        'total_valeur' => $totalValeur,
                    ],
                ],
                'message' => 'Rapport client récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 6. Rapport Sortie
     */
    public function rapportSortie(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $magasinId = $request->input('magasin_id');
            $localTerm = $request->input('local');

            $query = MouvementStock::with([
                'lot.produit.unite',
                'lot.magasin',
                'lot.devise',
                'typeMouvement',
            ])
                ->where('id_type_mouvement', 2) // Sortie consommation
                ->where('statut_validation', 'VALIDÉ');

            if ($dateDebut) {
                $query->whereDate('date_mouvement', '>=', $dateDebut);
            }
            if ($dateFin) {
                $query->whereDate('date_mouvement', '<=', $dateFin);
            }

            if ($magasinId) {
                $query->whereHas('lot', function($q) use ($magasinId) {
                    $q->where('id_magasin', $magasinId);
                });
            } elseif ($localTerm) {
                $query->whereHas('lot.magasin', function($q) use ($localTerm) {
                    $q->where('nom', 'LIKE', "%{$localTerm}%")
                      ->orWhere('code', 'LIKE', "%{$localTerm}%");
                });
            }

            $sorties = $query->orderBy('date_mouvement', 'asc')->get();

            $lignes = [];
            $numero = 0;
            $totalLignes = 0;
            $totalQuantite = 0;
            $totalValeur = 0;

            foreach ($sorties as $sortie) {
                $produit = $sortie->lot->produit;
                if (!$produit) {
                    continue;
                }
                $numero++;
                $prix = (float) ($sortie->lot->prix_achat_ht_unitaire ?? 0);
                $valeur = $sortie->quantite * $prix;
                $totalLignes++;
                $totalQuantite += $sortie->quantite;
                $totalValeur += $valeur;

                $lignes[] = [
                    'numero' => $numero,
                    'date' => $sortie->date_mouvement,
                    'article' => $produit->nom,
                    'code_article' => $produit->code_article,
                    'unite' => optional($produit->unite)->nom,
                    'prix_unitaire' => $prix,
                    'devise' => optional($sortie->lot->devise)->code,
                    'quantite' => (int) $sortie->quantite,
                    'valeur' => $valeur,
                    'local' => optional($sortie->lot->magasin)->nom,
                    'numero_lot' => $sortie->lot->numero_lot,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'lignes' => $lignes,
                    'statistiques' => [
                        'total_lignes' => $totalLignes,
                        'total_quantite' => $totalQuantite,
                        'total_valeur' => $totalValeur,
                    ],
                ],
                'message' => 'Rapport sortie récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 7. Rapport Sortie Full
     */
    public function rapportSortieFull(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());
            $magasinId = $request->input('magasin_id');

            $query = MouvementStock::with([
                'lot.produit',
                'lot.magasin',
                'typeMouvement',
                'utilisateur',
                'validePar'
            ])->where('id_type_mouvement', 2)
                ->where('statut_validation', 'VALIDÉ')
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin]);

            if ($magasinId) {
                $query->whereHas('lot', function($q) use ($magasinId) {
                    $q->where('id_magasin', $magasinId);
                });
            }

            $sorties = $query->orderBy('date_mouvement', 'desc')->get();

            // Statistiques détaillées
            $totalParMagasin = [];
            foreach ($sorties as $sortie) {
                $magasin = $sortie->lot->magasin->nom ?? 'Non défini';
                if (!isset($totalParMagasin[$magasin])) {
                    $totalParMagasin[$magasin] = 0;
                }
                $totalParMagasin[$magasin] += $sortie->quantite;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'sorties' => $sorties,
                    'statistiques' => [
                        'total_sorties' => $sorties->count(),
                        'total_quantite' => $sorties->sum('quantite'),
                        'par_magasin' => $totalParMagasin,
                        'moyenne_par_sortie' => $sorties->count() > 0 ? $sorties->sum('quantite') / $sorties->count() : 0,
                    ]
                ],
                'message' => 'Rapport sortie full récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 8. Rapport Achat Full
     */
    public function rapportAchatFull(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());
            $fournisseurId = $request->input('fournisseur_id');
            $magasinId = $request->input('magasin_id');

            $query = BonCommande::with([
                'partenaire',
                'magasinDestination',
                'lignes.produit',
                'lignes.devise'
            ])->whereIn('statut', ['REÇU', 'REÇU PARTIELLEMENT'])
                ->whereBetween('date_commande', [$dateDebut, $dateFin]);

            if ($fournisseurId) {
                $query->where('id_partenaire', $fournisseurId);
            }
            if ($magasinId) {
                $query->where('id_magasin_destination', $magasinId);
            }

            $achats = $query->orderBy('date_commande', 'desc')->get();

            // Statistiques par fournisseur
            $parFournisseur = [];
            foreach ($achats as $achat) {
                $fournisseur = $achat->partenaire->nom;
                if (!isset($parFournisseur[$fournisseur])) {
                    $parFournisseur[$fournisseur] = [
                        'fournisseur' => $achat->partenaire,
                        'total_commandes' => 0,
                        'total_montant' => 0,
                        'total_produits' => 0,
                    ];
                }
                $parFournisseur[$fournisseur]['total_commandes']++;
                $parFournisseur[$fournisseur]['total_montant'] += $achat->montant_total_ht;
                $parFournisseur[$fournisseur]['total_produits'] += $achat->lignes->sum('quantite_recue');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'achats' => $achats,
                    'statistiques' => [
                        'total_achats' => $achats->count(),
                        'total_montant' => $achats->sum('montant_total_ht'),
                        'par_fournisseur' => array_values($parFournisseur),
                    ]
                ],
                'message' => 'Rapport achat full récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 9. Rapport Fournisseur
     */
    public function rapportFournisseur(Request $request)
    {
        try {
            $fournisseurId = $request->input('fournisseur_id');
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');

            $query = Partenaire::with([
                'produits',
                'bonCommandes' => function($q) use ($dateDebut, $dateFin) {
                    $q->whereIn('statut', ['REÇU', 'REÇU PARTIELLEMENT']);
                    if ($dateDebut) {
                        $q->whereDate('date_commande', '>=', $dateDebut);
                    }
                    if ($dateFin) {
                        $q->whereDate('date_commande', '<=', $dateFin);
                    }
                }
            ])->where('type', 'fournisseur');

            if ($fournisseurId) {
                $query->where('id', $fournisseurId);
            }

            $fournisseurs = $query->get();

            $data = [];
            foreach ($fournisseurs as $fournisseur) {
                $totalCommandes = $fournisseur->bonCommandes->count();
                $totalMontant = $fournisseur->bonCommandes->sum('montant_total_ht');
                $totalProduits = $fournisseur->bonCommandes->sum(function($bon) {
                    return $bon->lignes->sum('quantite_recue');
                });

                $data[] = [
                    'fournisseur' => $fournisseur,
                    'statistiques' => [
                        'total_commandes' => $totalCommandes,
                        'total_montant' => $totalMontant,
                        'total_produits' => $totalProduits,
                        'moyenne_par_commande' => $totalCommandes > 0 ? $totalMontant / $totalCommandes : 0,
                    ]
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Rapport fournisseur récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 10. Mouvement Produit
     */
    public function mouvementProduit(Request $request)
    {
        try {
            $produitId = $request->input('produit_id');
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());
            $magasinId = $request->input('magasin_id');

            $query = MouvementStock::with([
                'lot.produit',
                'lot.magasin',
                'typeMouvement',
                'utilisateur'
            ])->whereBetween('date_mouvement', [$dateDebut, $dateFin]);

            if ($produitId) {
                $query->whereHas('lot.produit', function($q) use ($produitId) {
                    $q->where('id', $produitId);
                });
            }
            if ($magasinId) {
                $query->whereHas('lot', function($q) use ($magasinId) {
                    $q->where('id_magasin', $magasinId);
                });
            }

            $mouvements = $query->orderBy('date_mouvement', 'desc')->get();

            // Regrouper par produit
            $mouvementsParProduit = [];
            foreach ($mouvements as $mvt) {
                $key = $mvt->lot->id_produit;
                if (!isset($mouvementsParProduit[$key])) {
                    $mouvementsParProduit[$key] = [
                        'produit' => $mvt->lot->produit,
                        'entrees' => 0,
                        'sorties' => 0,
                        'mouvements' => []
                    ];
                }
                if ($mvt->typeMouvement->sens === 1) {
                    $mouvementsParProduit[$key]['entrees'] += $mvt->quantite;
                } else {
                    $mouvementsParProduit[$key]['sorties'] += $mvt->quantite;
                }
                $mouvementsParProduit[$key]['mouvements'][] = $mvt;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'mouvements_par_produit' => $mouvementsParProduit,
                    'statistiques' => [
                        'total_mouvements' => $mouvements->count(),
                        'total_entrees' => $mouvements->where('typeMouvement.sens', 1)->sum('quantite'),
                        'total_sorties' => $mouvements->where('typeMouvement.sens', -1)->sum('quantite'),
                    ]
                ],
                'message' => 'Rapport mouvement produit récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 11. Inventaire Théorique
     */
    public function inventaireTheorique(Request $request)
    {
        try {
            $magasinId = $request->input('magasin_id');
            $categorieId = $request->input('categorie_id');

            $query = Produit::with(['categorie', 'unite']);

            if ($categorieId) {
                $query->where('id_categorie', $categorieId);
            }

            $produits = $query->get();

            $inventaireTheorique = [];
            foreach ($produits as $produit) {
                $stockTotal = $produit->getStockTotal();
                if ($stockTotal > 0) {
                    $inventaireTheorique[] = [
                        'produit' => $produit,
                        'stock_theorique' => $stockTotal,
                        'unite' => $produit->unite->symbole,
                        'valeur' => $stockTotal * ($produit->getDernierPrixAchat()->prix_achat_ht ?? 0),
                    ];
                }
            }

            // Trier par stock décroissant
            usort($inventaireTheorique, function($a, $b) {
                return $b['stock_theorique'] - $a['stock_theorique'];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'inventaire' => $inventaireTheorique,
                    'statistiques' => [
                        'total_produits' => count($inventaireTheorique),
                        'total_stock' => array_sum(array_column($inventaireTheorique, 'stock_theorique')),
                        'total_valeur' => array_sum(array_column($inventaireTheorique, 'valeur')),
                    ]
                ],
                'message' => 'Inventaire théorique récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 12. Inventaire Théorique Valorisée
     */
    public function inventaireTheoriqueValorisee(Request $request)
    {
        try {
            $magasinId = $request->input('magasin_id');
            $categorieId = $request->input('categorie_id');

            $query = Produit::with(['categorie', 'unite']);

            if ($categorieId) {
                $query->where('id_categorie', $categorieId);
            }

            $produits = $query->get();

            $inventaireValorise = [];
            $totalValeur = 0;

            foreach ($produits as $produit) {
                $stockTotal = $produit->getStockTotal();
                if ($stockTotal > 0) {
                    $dernierPrix = $produit->getDernierPrixAchat();
                    $prixUnitaire = $dernierPrix->prix_achat_ht ?? 0;
                    $valeur = $stockTotal * $prixUnitaire;
                    $totalValeur += $valeur;

                    $inventaireValorise[] = [
                        'produit' => $produit,
                        'stock_theorique' => $stockTotal,
                        'prix_unitaire' => $prixUnitaire,
                        'devise' => $dernierPrix ? $dernierPrix->devise->code : 'USD',
                        'valeur_totale' => $valeur,
                        'categorie' => $produit->categorie->nom ?? 'Non classé',
                    ];
                }
            }

            // Trier par valeur décroissante
            usort($inventaireValorise, function($a, $b) {
                return $b['valeur_totale'] - $a['valeur_totale'];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'inventaire' => $inventaireValorise,
                    'statistiques' => [
                        'total_produits' => count($inventaireValorise),
                        'total_stock' => array_sum(array_column($inventaireValorise, 'stock_theorique')),
                        'total_valeur' => $totalValeur,
                        'devise' => $inventaireValorise[0]['devise'] ?? 'USD',
                    ]
                ],
                'message' => 'Inventaire théorique valorisée récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 13. Consommations Clients
     */
    public function consommationsClients(Request $request)
    {
        try {
            $clientId = $request->input('client_id');
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());

            // Récupérer les clients aériens
            $query = Partenaire::with([
                'bonCommandes' => function($q) use ($dateDebut, $dateFin) {
                    $q->where('statut', 'REÇU')
                      ->whereBetween('date_commande', [$dateDebut, $dateFin])
                      ->with('lignes.produit');
                }
            ])->where('type_client', 'aerien');

            if ($clientId) {
                $query->where('id', $clientId);
            }

            $clients = $query->get();

            $consommations = [];
            foreach ($clients as $client) {
                $totalCommandes = $client->bonCommandes->count();
                $totalProduits = 0;
                $detailsParProduit = [];

                foreach ($client->bonCommandes as $bon) {
                    foreach ($bon->lignes as $ligne) {
                        $totalProduits += $ligne->quantite_recue;
                        $key = $ligne->id_produit;
                        if (!isset($detailsParProduit[$key])) {
                            $detailsParProduit[$key] = [
                                'produit' => $ligne->produit,
                                'quantite_totale' => 0,
                            ];
                        }
                        $detailsParProduit[$key]['quantite_totale'] += $ligne->quantite_recue;
                    }
                }

                if ($totalCommandes > 0) {
                    $consommations[] = [
                        'client' => $client,
                        'total_commandes' => $totalCommandes,
                        'total_produits' => $totalProduits,
                        'moyenne_par_commande' => $totalProduits / $totalCommandes,
                        'details_produits' => array_values($detailsParProduit),
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'consommations' => $consommations,
                    'statistiques' => [
                        'total_clients' => count($consommations),
                        'total_commandes' => array_sum(array_column($consommations, 'total_commandes')),
                        'total_produits' => array_sum(array_column($consommations, 'total_produits')),
                    ]
                ],
                'message' => 'Rapport consommations clients récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 14. Rapport Rupture de Stock (quantité = 0)
     */
    public function ruptureStock(Request $request)
    {
        try {
            $magasinId = $request->input('magasin_id');

            $produits = Produit::with(['categorie', 'unite'])
                ->when($magasinId, function($q) use ($magasinId) {
                    $q->whereHas('lots', fn($l) => $l->where('id_magasin', $magasinId));
                })
                ->get();

            $ruptures = [];
            foreach ($produits as $produit) {
                $lots = $produit->lots()
                    ->where('statut_validation', 'VALIDÉ')
                    ->when($magasinId, fn($q) => $q->where('id_magasin', $magasinId))
                    ->get();

                $quantiteTotale = $lots->sum('quantite_disponible');

                if ($quantiteTotale === 0) {
                    $ruptures[] = [
                        'produit' => $produit,
                        'quantite_totale' => 0,
                        'seuil_alerte' => $produit->seuil_alerte ?? 0,
                        'lots' => $lots->toArray(),
                    ];
                }
            }

            usort($ruptures, fn($a, $b) => $b['seuil_alerte'] - $a['seuil_alerte']);

            return response()->json([
                'success' => true,
                'data' => [
                    'ruptures' => $ruptures,
                    'statistiques' => [
                        'total_ruptures' => count($ruptures),
                        'total_produits_epuises' => count($ruptures),
                        'quantite_manquante' => array_sum(array_column($ruptures, 'seuil_alerte')),
                    ]
                ],
                'message' => 'Rapport rupture de stock récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 15. Rapport Stock Bas (0 < quantité <= seuil_alerte)
     */
    public function stockBas(Request $request)
    {
        try {
            $magasinId = $request->input('magasin_id');

            $produits = Produit::with(['categorie', 'unite'])
                ->where('actif', true)
                ->when($magasinId, function($q) use ($magasinId) {
                    $q->whereHas('lots', fn($l) => $l->where('id_magasin', $magasinId));
                })
                ->get();

            $stockBas = [];
            foreach ($produits as $produit) {
                $lots = $produit->lots()
                    ->with('magasin')
                    ->where('statut_validation', 'VALIDÉ')
                    ->when($magasinId, fn($q) => $q->where('id_magasin', $magasinId))
                    ->get();

                $quantiteTotale = $lots->sum('quantite_disponible');
                $seuil = $produit->seuil_alerte ?? 0;

                if ($seuil > 0 && $quantiteTotale > 0 && $quantiteTotale <= $seuil) {
                    $stockBas[] = [
                        'produit' => $produit,
                        'quantite_totale' => $quantiteTotale,
                        'seuil_alerte' => $seuil,
                        'lots' => $lots->toArray(),
                    ];
                }
            }

            usort($stockBas, function($a, $b) {
                $ecartA = $a['seuil_alerte'] - $a['quantite_totale'];
                $ecartB = $b['seuil_alerte'] - $b['quantite_totale'];
                return $ecartB - $ecartA;
            });

            $totalStockBas = count($stockBas);
            $quantiteManquante = array_sum(array_map(fn($r) => $r['seuil_alerte'] - $r['quantite_totale'], $stockBas));

            return response()->json([
                'success' => true,
                'data' => [
                    'stocks_bas' => $stockBas,
                    'statistiques' => [
                        'total_stocks_bas' => $totalStockBas,
                        'quantite_manquante' => $quantiteManquante,
                    ]
                ],
                'message' => 'Rapport stock bas récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}