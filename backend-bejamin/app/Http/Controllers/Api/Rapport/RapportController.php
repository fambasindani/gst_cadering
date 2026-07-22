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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RapportController extends Controller
{
    /**
     * 1. Rapport Bon de Commande
     */
    public function bonCommande(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $villeId = $request->input('ville_id');
            $statut = $request->input('statut');

            $query = BonCommande::with(['partenaire', 'villeDestination', 'lignes.produit']);

            if ($dateDebut) {
                $query->whereDate('date_commande', '>=', $dateDebut);
            }
            if ($dateFin) {
                $query->whereDate('date_commande', '<=', $dateFin);
            }
            if ($villeId) {
                $query->where('id_ville_destination', $villeId);
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
            $villeId = $request->input('ville_id');

            $query = BonCommande::with(['partenaire', 'villeDestination', 'lignes.produit'])
                ->whereIn('statut', ['REÇU', 'REÇU PARTIELLEMENT']);

            if ($dateDebut) {
                $query->whereDate('date_commande', '>=', $dateDebut);
            }
            if ($dateFin) {
                $query->whereDate('date_commande', '<=', $dateFin);
            }
            if ($villeId) {
                $query->where('id_ville_destination', $villeId);
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
            $villeId = $request->input('ville_id');
            $categorieId = $request->input('categorie_id');

            $query = Lot::with(['produit.categorie', 'ville', 'zone'])
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ');

            if ($villeId) {
                $query->where('id_ville', $villeId);
            }
            if ($categorieId) {
                $query->whereHas('produit', function($q) use ($categorieId) {
                    $q->where('id_categorie', $categorieId);
                });
            }

            $lots = $query->get();

            // Regrouper par produit
            $stockParProduit = [];
            foreach ($lots as $lot) {
                $key = $lot->id_produit;
                if (!isset($stockParProduit[$key])) {
                    $stockParProduit[$key] = [
                        'produit' => $lot->produit,
                        'quantite_totale' => 0,
                        'lots' => []
                    ];
                }
                $stockParProduit[$key]['quantite_totale'] += $lot->quantite_disponible;
                $stockParProduit[$key]['lots'][] = $lot;
            }

            // Trier par quantité totale décroissante
            usort($stockParProduit, function($a, $b) {
                return $b['quantite_totale'] - $a['quantite_totale'];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'stock_par_produit' => $stockParProduit,
                    'statistiques' => [
                        'total_produits' => count($stockParProduit),
                        'total_lots' => $lots->count(),
                        'total_quantite' => $lots->sum('quantite_disponible'),
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
     * 4. Variation Stock
     */
    public function variationStock(Request $request)
    {
        try {
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());
            $produitId = $request->input('produit_id');
            $villeId = $request->input('ville_id');

            $query = MouvementStock::with(['lot.produit', 'typeMouvement', 'lot.ville'])
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin])
                ->where('statut_validation', 'VALIDÉ');

            if ($produitId) {
                $query->whereHas('lot.produit', function($q) use ($produitId) {
                    $q->where('id', $produitId);
                });
            }
            if ($villeId) {
                $query->whereHas('lot', function($q) use ($villeId) {
                    $q->where('id_ville', $villeId);
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
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');

            $query = Partenaire::with([
                'produits',
                'bonCommandes' => function($q) use ($dateDebut, $dateFin) {
                    if ($dateDebut) {
                        $q->whereDate('date_commande', '>=', $dateDebut);
                    }
                    if ($dateFin) {
                        $q->whereDate('date_commande', '<=', $dateFin);
                    }
                }
            ])->where('type_client', 'aerien');

            if ($clientId) {
                $query->where('id', $clientId);
            }

            $clients = $query->get();

            $data = [];
            foreach ($clients as $client) {
                $totalCommandes = $client->bonCommandes->count();
                $totalMontant = $client->bonCommandes->sum('montant_total_ht');
                $totalProduits = $client->bonCommandes->sum(function($bon) {
                    return $bon->lignes->sum('quantite_commandee');
                });

                $data[] = [
                    'client' => $client,
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
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());
            $villeId = $request->input('ville_id');

            $query = MouvementStock::with(['lot.produit', 'lot.ville', 'typeMouvement'])
                ->where('id_type_mouvement', 2) // Sortie consommation
                ->where('statut_validation', 'VALIDÉ')
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin]);

            if ($villeId) {
                $query->whereHas('lot', function($q) use ($villeId) {
                    $q->where('id_ville', $villeId);
                });
            }

            $sorties = $query->orderBy('date_mouvement', 'desc')->get();

            // Regrouper par produit
            $sortiesParProduit = [];
            foreach ($sorties as $sortie) {
                $key = $sortie->lot->id_produit;
                if (!isset($sortiesParProduit[$key])) {
                    $sortiesParProduit[$key] = [
                        'produit' => $sortie->lot->produit,
                        'quantite_totale' => 0,
                        'sorties' => []
                    ];
                }
                $sortiesParProduit[$key]['quantite_totale'] += $sortie->quantite;
                $sortiesParProduit[$key]['sorties'][] = $sortie;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'sorties_par_produit' => array_values($sortiesParProduit),
                    'statistiques' => [
                        'total_sorties' => $sorties->count(),
                        'total_quantite' => $sorties->sum('quantite'),
                    ]
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
            $villeId = $request->input('ville_id');

            $query = MouvementStock::with([
                'lot.produit',
                'lot.ville',
                'lot.zone',
                'typeMouvement',
                'utilisateur',
                'validePar'
            ])->where('id_type_mouvement', 2)
                ->where('statut_validation', 'VALIDÉ')
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin]);

            if ($villeId) {
                $query->whereHas('lot', function($q) use ($villeId) {
                    $q->where('id_ville', $villeId);
                });
            }

            $sorties = $query->orderBy('date_mouvement', 'desc')->get();

            // Statistiques détaillées
            $totalParZone = [];
            foreach ($sorties as $sortie) {
                $zone = $sortie->lot->zone->nom ?? 'Non défini';
                if (!isset($totalParZone[$zone])) {
                    $totalParZone[$zone] = 0;
                }
                $totalParZone[$zone] += $sortie->quantite;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'sorties' => $sorties,
                    'statistiques' => [
                        'total_sorties' => $sorties->count(),
                        'total_quantite' => $sorties->sum('quantite'),
                        'par_zone' => $totalParZone,
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
            $villeId = $request->input('ville_id');

            $query = BonCommande::with([
                'partenaire',
                'villeDestination',
                'lignes.produit',
                'lignes.devise'
            ])->whereIn('statut', ['REÇU', 'REÇU PARTIELLEMENT'])
                ->whereBetween('date_commande', [$dateDebut, $dateFin]);

            if ($fournisseurId) {
                $query->where('id_partenaire', $fournisseurId);
            }
            if ($villeId) {
                $query->where('id_ville_destination', $villeId);
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
            $villeId = $request->input('ville_id');

            $query = MouvementStock::with([
                'lot.produit',
                'lot.ville',
                'typeMouvement',
                'utilisateur'
            ])->whereBetween('date_mouvement', [$dateDebut, $dateFin]);

            if ($produitId) {
                $query->whereHas('lot.produit', function($q) use ($produitId) {
                    $q->where('id', $produitId);
                });
            }
            if ($villeId) {
                $query->whereHas('lot', function($q) use ($villeId) {
                    $q->where('id_ville', $villeId);
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
            $villeId = $request->input('ville_id');
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
            $villeId = $request->input('ville_id');
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
}