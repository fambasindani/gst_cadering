<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use App\Models\BonCommande;
use App\Models\Partenaire;
use App\Models\Lot;
use App\Models\Retour;
use App\Models\MouvementStock;
use App\Models\LigneCommande;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Dashboard principal
     */
    public function index(Request $request)
    {
        try {
            $magasinId = $request->input('magasin_id');
            $dateDebut = Carbon::parse($request->input('date_debut', now()->subMonths(6)))->startOfDay();
            $dateFin = Carbon::parse($request->input('date_fin', now()))->endOfDay();

            // ============================================================
            // STOCK À LA FIN DE LA PÉRIODE SÉLECTIONNÉE
            // ============================================================
            // Stock reconstruit via le journal des mouvements : disponible aujourd'hui,
            // + sorties survenues APRÈS date_fin (encore en stock à date_fin),
            // − entrées survenues APRÈS date_fin (pas encore en stock à date_fin).
            $stockLots = $this->stockParLotAu($dateFin);

            // Agrégats par produit
            $stockParProduit = [];
            foreach ($stockLots as $info) {
                $stockParProduit[$info['id_produit']] = ($stockParProduit[$info['id_produit']] ?? 0) + $info['stock'];
            }

            // ============================================================
            // 1. STATISTIQUES GÉNÉRALES (Cartes)
            // ============================================================

            // 1.1 Nombre de produits (catalogue actuel)
            $totalProduits = Produit::where('actif', true)->count();
            
            // 1.2 Nombre de produits en stock (avec stock > 0 à la fin de la période)
            $produitsEnStock = count(array_filter($stockParProduit, function($stock) {
                return $stock > 0;
            }));

            // 1.3 Nombre de produits en rupture de stock (stock = 0 à la fin de la période)
            $produitsRupture = Produit::where('actif', true)
                ->get(['id'])
                ->filter(function($produit) use ($stockParProduit) {
                    return ($stockParProduit[$produit->id] ?? 0) <= 0;
                })
                ->count();

            // 1.4 Nombre de commandes validées sur la période
            $commandesValidees = BonCommande::whereIn('statut', ['ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU'])
                ->whereBetween('date_commande', [$dateDebut, $dateFin])
                ->count();

            // 1.5 Nombre de commandes en attente sur la période (brouillon ou en attente de validation)
            $commandesEnAttente = BonCommande::where(function($q) {
                    $q->where('statut', 'BROUILLON')
                      ->orWhere('statut_validation', 'EN ATTENTE');
                })
                ->whereBetween('date_commande', [$dateDebut, $dateFin])
                ->count();

            // 1.6 Nombre de clients aériens
            $clientsAeriens = Partenaire::where('type_client', 'aerien')
                ->where('actif', true)
                ->count();

            // 1.7 Nombre de clients non aériens
            $clientsNonAeriens = Partenaire::where('type_client', 'non_aerien')
                ->where('actif', true)
                ->count();

            // 1.8 Nombre total de clients
            $totalClients = $clientsAeriens + $clientsNonAeriens;

            // 1.9 Nombre de fournisseurs
            $fournisseurs = Partenaire::where('type', 'fournisseur')
                ->orWhere('type', 'both')
                ->where('actif', true)
                ->count();

            // 1.10 Stock total (quantité) à la fin de la période
            $stockTotal = array_sum(array_column($stockLots, 'stock'));

            // 1.11 Valeur totale du stock à la fin de la période
            $valeurStock = array_sum(array_map(function($info) {
                return $info['stock'] * $info['prix'];
            }, $stockLots));

            // 1.12 Nombre de retours en attente sur la période
            $retoursEnAttente = Retour::where('statut_validation', 'EN ATTENTE')
                ->whereBetween('created_at', [$dateDebut, $dateFin])
                ->count();

            // 1.13 Nombre de lots proches de péremption (7 jours) encore en stock à la fin de la période
            $lotsPerimesProches = $this->lotsPerimesProches($stockLots);
            $lotsPeremptionProche = $lotsPerimesProches->count();

            // ============================================================
            // 2. ÉVOLUTION DES COMMANDES (Derniers 6 mois)
            // ============================================================
            $evolutionCommandes = BonCommande::select(
                    DB::raw('MONTH(date_commande) as mois'),
                    DB::raw('YEAR(date_commande) as annee'),
                    DB::raw('COUNT(*) as total')
                )
                ->whereBetween('date_commande', [$dateDebut, $dateFin])
                ->groupBy(DB::raw('YEAR(date_commande)'), DB::raw('MONTH(date_commande)'))
                ->orderBy('annee', 'asc')
                ->orderBy('mois', 'asc')
                ->get()
                ->map(function($item) {
                    $nomMois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                    return [
                        'mois' => $nomMois[$item->mois - 1] . ' ' . $item->annee,
                        'total' => $item->total
                    ];
                });

            // ============================================================
            // 3. TOP PRODUITS LES PLUS VENDUS (Derniers 6 mois)
            // ============================================================
            $topProduits = LigneCommande::select(
                    'produits.id',
                    'produits.nom',
                    DB::raw('SUM(ligne_commande.quantite_recue) as total_vendu')
                )
                ->join('produits', 'ligne_commande.id_produit', '=', 'produits.id')
                ->join('bon_commande', 'ligne_commande.id_bon_commande', '=', 'bon_commande.id')
                ->where('bon_commande.statut', 'REÇU')
                ->whereBetween('bon_commande.date_commande', [$dateDebut, $dateFin])
                ->groupBy('produits.id', 'produits.nom')
                ->orderBy('total_vendu', 'desc')
                ->limit(10)
                ->get();

            // ============================================================
            // 4. TOP FOURNISSEURS (par nombre de bons de commande => produits les plus consommés)
            // ============================================================
            $topFournisseurs = Partenaire::select(
                    'partenaires.id',
                    'partenaires.nom',
                    DB::raw('COUNT(bon_commande.id) as total_commandes'),
                    DB::raw('SUM(bon_commande.montant_total_ht) as total_montant')
                )
                ->leftJoin('bon_commande', 'partenaires.id', '=', 'bon_commande.id_partenaire')
                ->whereIn('partenaires.type', ['fournisseur', 'both'])
                ->where('bon_commande.statut', 'REÇU')
                ->whereBetween('bon_commande.date_commande', [$dateDebut, $dateFin])
                ->groupBy('partenaires.id', 'partenaires.nom')
                ->orderBy('total_commandes', 'desc')
                ->orderBy('total_montant', 'desc')
                ->limit(5)
                ->get();

            // ============================================================
            // 5. ALERTES - Produits en stock bas
            // ============================================================
            // 5. ALERTES - Produits en stock bas (à la fin de la période)
            // ============================================================
            $produitsStockBas = Produit::with(['categorie', 'unite'])
                ->where('actif', true)
                ->get()
                ->filter(function($produit) use ($stockParProduit) {
                    $stock = $stockParProduit[$produit->id] ?? 0;
                    return $stock > 0 && $stock <= $produit->seuil_alerte;
                })
                ->map(function($produit) use ($stockParProduit) {
                    return [
                        'id' => $produit->id,
                        'nom' => $produit->nom,
                        'stock_actuel' => $stockParProduit[$produit->id] ?? 0,
                        'seuil_alerte' => $produit->seuil_alerte,
                        'categorie' => $produit->categorie->nom ?? 'Non classé',
                        'unite' => $produit->unite->symbole ?? 'pc'
                    ];
                })
                ->values();

            // ============================================================
            // 6. RÉPARTITION PAR CATÉGORIE
            // ============================================================
            $repartitionCategorie = Produit::select(
                    'categories.nom as categorie',
                    DB::raw('COUNT(produits.id) as total')
                )
                ->join('categories', 'produits.id_categorie', '=', 'categories.id')
                ->where('produits.actif', true)
                ->groupBy('categories.nom')
                ->get();

            // ============================================================
            // 7. TOP 5 VARIATIONS DE PRIX (hausse / baisse des produits)
            // ============================================================
            // Compare les deux derniers prix d'achat de chaque produit (via historique_prix).
            // Top 5 des plus fortes variations (augmentation ou baisse) sur la période.
            $derniersPrix = DB::table('historique_prix')
                ->join('produits', 'historique_prix.id_produit', '=', 'produits.id')
                ->where('produits.actif', true)
                ->whereNull('historique_prix.deleted_at')
                ->whereNotNull('historique_prix.prix_achat_ht')
                ->where('historique_prix.date_application', '<=', $dateFin)
                ->orderBy('historique_prix.date_application', 'desc')
                ->orderBy('historique_prix.id', 'desc')
                ->get(['historique_prix.id_produit', 'historique_prix.prix_achat_ht', 'historique_prix.date_application', 'produits.nom']);

            $variationsPrix = collect($derniersPrix)
                ->groupBy('id_produit')
                ->map(function ($entrees) {
                    $entrees = $entrees->values();
                    $nouveau = $entrees->first();
                    $ancien = $entrees->get(1);
                    if (!$ancien) {
                        return null;
                    }
                    $ancienPrix = (float) $ancien->prix_achat_ht;
                    $nouveauPrix = (float) $nouveau->prix_achat_ht;
                    $variation = $nouveauPrix - $ancienPrix;
                    if (abs($variation) < 0.0001) {
                        return null;
                    }
                    return [
                        'id' => (int) $nouveau->id_produit,
                        'nom' => $nouveau->nom,
                        'ancien_prix' => $ancienPrix,
                        'nouveau_prix' => $nouveauPrix,
                        'variation' => round($variation, 2),
                        'pourcentage' => $ancienPrix != 0 ? round(($variation / $ancienPrix) * 100, 1) : 0,
                        'type' => $variation > 0 ? 'hausse' : 'baisse',
                        'date' => Carbon::parse($nouveau->date_application)->format('d/m/Y'),
                        'date_application' => $nouveau->date_application,
                    ];
                })
                ->filter()
                ->sortByDesc(fn($item) => $item['date_application'])
                ->take(5)
                ->map(function ($item) {
                    unset($item['date_application']);
                    return $item;
                })
                ->values();

            // ============================================================
            // 8. ACTIVITÉS RÉCENTES (mouvements de la période)
            // ============================================================
            $activitesRecentes = MouvementStock::with([
                    'lot.produit',
                    'lot.magasin',
                    'typeMouvement',
                    'utilisateur'
                ])
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin])
                ->orderBy('date_mouvement', 'desc')
                ->limit(10)
                ->get()
                ->map(function($mvt) {
                    $type = $mvt->typeMouvement->sens === 1 ? 'Entrée' : 'Sortie';
                    return [
                        'type' => $type,
                        'libelle' => $mvt->typeMouvement->libelle,
                        'produit' => $mvt->lot->produit->nom,
                        'quantite' => $mvt->quantite,
                        'date' => $mvt->date_mouvement->format('d/m/Y H:i'),
                        'utilisateur' => $mvt->utilisateur->nom ?? 'Système'
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    // Cartes statistiques
                    'statistiques' => [
                        'total_produits' => $totalProduits,
                        'produits_en_stock' => $produitsEnStock,
                        'produits_rupture' => $produitsRupture,
                        'commandes_validees' => $commandesValidees,
                        'commandes_en_attente' => $commandesEnAttente,
                        'clients_aeriens' => $clientsAeriens,
                        'clients_non_aeriens' => $clientsNonAeriens,
                        'total_clients' => $totalClients,
                        'total_fournisseurs' => $fournisseurs,
                        'stock_total' => $stockTotal,
                        'valeur_stock' => $valeurStock,
                        'retours_en_attente' => $retoursEnAttente,
                        'lots_peremption_proche' => $lotsPeremptionProche,
                        'produits_stock_bas' => $produitsStockBas->count(),
                    ],

                    // Graphiques / Tendances
                    'evolution_commandes' => $evolutionCommandes,
                    'top_produits' => $topProduits,
                    'top_fournisseurs' => $topFournisseurs,
                    'repartition_categorie' => $repartitionCategorie,

                    // Alertes
                    'alertes' => [
                        'stock_bas' => $produitsStockBas,
                        'peremption_proche' => $lotsPerimesProches,
                        'variations_prix' => $variationsPrix,
                    ],

                    // Activités récentes
                    'activites_recentes' => $activitesRecentes,
                ],
                'message' => 'Dashboard récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dashboard par magasin (statistiques spécifiques)
     */
    public function byMagasin($magasinId)
    {
        try {
            // Vérifier que la magasin existe
            $magasin = \App\Models\Magasin::findOrFail($magasinId);               

            // Statistiques par magasin
            $stock = Lot::where('id_magasin', $magasinId)
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->sum('quantite_disponible');

            $commandes = BonCommande::where('id_magasin_destination', $magasinId)
                ->whereIn('statut', ['ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU'])
                ->count();

            $clients = Partenaire::where('id_magasin', $magasinId)
                ->where('type_client', 'aerien')
                ->count();

            $produits = Lot::where('id_magasin', $magasinId)
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->distinct('id_produit')
                ->count();

            $valeur = Lot::where('id_magasin', $magasinId)
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->get()
                ->sum(function($lot) {
                    return $lot->quantite_disponible * ($lot->prix_achat_ht_unitaire ?? 0);
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'magasin' => $magasin,
                    'statistiques' => [
                        'stock_total' => $stock,
                        'valeur_stock' => $valeur,
                        'commandes' => $commandes,
                        'clients_aeriens' => $clients,
                        'produits_en_stock' => $produits,
                    ]
                ],
                'message' => 'Dashboard du magasin récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mini-dashboard pour le header (indicateurs rapides)
     */
    public function mini()
    {
        try {
            $commandesEnAttente = BonCommande::where('statut', 'BROUILLON')
                ->orWhere('statut_validation', 'EN ATTENTE')
                ->count();

            $retoursEnAttente = Retour::where('statut_validation', 'EN ATTENTE')->count();

            $stockBas = Produit::where('actif', true)
                ->get()
                ->filter(function($produit) {
                    return $produit->getStockTotal() <= $produit->seuil_alerte;
                })
                ->count();

            $peremptionProche = Lot::where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->whereBetween('date_peremption', [now(), now()->addDays(7)])
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'commandes_en_attente' => $commandesEnAttente,
                    'retours_en_attente' => $retoursEnAttente,
                    'stock_bas' => $stockBas,
                    'peremption_proche' => $peremptionProche,
                ],
                'message' => 'Mini-dashboard récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du mini-dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stock disponible par lot à la fin d'une période.
     *
     * Reconstruit le stock à date_fin à partir du stock actuel des lots validés,
     * en annulant les mouvements survenus APRÈS date_fin :
     *   + sorties survenues après (encore en stock à date_fin)
     *   − entrées survenues après (pas encore en stock à date_fin)
     * Les lots créés après date_fin sont exclus (n'existaient pas encore).
     *
     * @return array<int, array{id_produit:int, stock:int, prix:float}>
     */
    private function stockParLotAu(Carbon $dateFin): array
    {
        // Mouvements validés APRÈS date_fin (entrées à soustraire, sorties à rajouter)
        $ajustements = DB::table('mouvement_stock')
            ->join('lots', 'mouvement_stock.id_lot', '=', 'lots.id')
            ->join('type_mouvement', 'mouvement_stock.id_type_mouvement', '=', 'type_mouvement.id')
            ->where('mouvement_stock.statut_validation', 'VALIDÉ')
            ->where('mouvement_stock.date_mouvement', '>', $dateFin)
            ->where('lots.statut_validation', 'VALIDÉ')
            ->where('lots.created_at', '<=', $dateFin)
            ->selectRaw(
                'mouvement_stock.id_lot, ' .
                'SUM(CASE WHEN type_mouvement.sens = 1 THEN mouvement_stock.quantite ELSE 0 END) as entrees_apres, ' .
                'SUM(CASE WHEN type_mouvement.sens = -1 THEN mouvement_stock.quantite ELSE 0 END) as sorties_apres'
            )
            ->groupBy('mouvement_stock.id_lot')
            ->get()
            ->keyBy('id_lot');

        $stock = [];

        Lot::where('statut_validation', 'VALIDÉ')
            ->where('created_at', '<=', $dateFin)
            ->get(['id', 'id_produit', 'quantite_disponible', 'prix_achat_ht_unitaire'])
            ->each(function($lot) use (&$stock, $ajustements) {
                $aj = $ajustements->get($lot->id);
                $dispo = $lot->quantite_disponible
                    + (int) ($aj->sorties_apres ?? 0)
                    - (int) ($aj->entrees_apres ?? 0);

                if ($dispo > 0) {
                    $stock[$lot->id] = [
                        'id_produit' => $lot->id_produit,
                        'stock' => $dispo,
                        'prix' => (float) ($lot->prix_achat_ht_unitaire ?? 0),
                    ];
                }
            });

        return $stock;
    }

    /**
     * Lots proches de péremption (7 jours) encore en stock à la fin de la période.
     */
    private function lotsPerimesProches(array $stockLots)
    {
        $stockLots = collect($stockLots);

        return Lot::with(['produit', 'magasin'])
            ->where('statut_validation', 'VALIDÉ')
            ->whereBetween('date_peremption', [now(), now()->addDays(7)])
            ->orderBy('date_peremption', 'asc')
            ->get()
            ->filter(function($lot) use ($stockLots) {
                return $stockLots->has($lot->id);
            })
            ->map(function($lot) use ($stockLots) {
                return [
                    'id' => $lot->id,
                    'produit' => $lot->produit->nom,
                    'numero_lot' => $lot->numero_lot,
                    'quantite' => $stockLots->get($lot->id)['stock'],
                    'date_peremption' => $lot->date_peremption,
                    'jours_restants' => now()->diffInDays($lot->date_peremption),
                    'magasin' => $lot->magasin->nom
                ];
            })
            ->values();
    }
}