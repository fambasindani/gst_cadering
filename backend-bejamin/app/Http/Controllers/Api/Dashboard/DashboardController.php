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
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());

            // ============================================================
            // 1. STATISTIQUES GÉNÉRALES (Cartes)
            // ============================================================

            // 1.1 Nombre de produits
            $totalProduits = Produit::where('actif', true)->count();
            
            // 1.2 Nombre de produits en stock (avec stock > 0)
            $produitsEnStock = Lot::where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->distinct('id_produit')
                ->count();

            // 1.3 Nombre de produits en rupture de stock (stock = 0)
            $produitsRupture = Produit::where('actif', true)
                ->whereDoesntHave('lots', function($q) {
                    $q->where('quantite_disponible', '>', 0)
                      ->where('statut_validation', 'VALIDÉ');
                })
                ->count();

            // 1.4 Nombre de commandes validées
            $commandesValidees = BonCommande::whereIn('statut', ['ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU'])
                ->count();

            // 1.5 Nombre de commandes en attente (brouillon ou en attente de validation)
            $commandesEnAttente = BonCommande::where('statut', 'BROUILLON')
                ->orWhere('statut_validation', 'EN ATTENTE')
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

            // 1.10 Stock total (quantité)
            $stockTotal = Lot::where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->sum('quantite_disponible');

            // 1.11 Valeur totale du stock
            $valeurStock = Lot::where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->get()
                ->sum(function($lot) {
                    return $lot->quantite_disponible * ($lot->prix_achat_ht_unitaire ?? 0);
                });

            // 1.12 Nombre de retours en attente
            $retoursEnAttente = Retour::where('statut_validation', 'EN ATTENTE')->count();

            // 1.13 Nombre de lots proches de péremption (7 jours)
            $lotsPeremptionProche = Lot::where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->whereBetween('date_peremption', [now(), now()->addDays(7)])
                ->count();

            // ============================================================
            // 2. ÉVOLUTION DES COMMANDES (Derniers 6 mois)
            // ============================================================
            $evolutionCommandes = BonCommande::select(
                    DB::raw('MONTH(date_commande) as mois'),
                    DB::raw('YEAR(date_commande) as annee'),
                    DB::raw('COUNT(*) as total')
                )
                ->where('date_commande', '>=', now()->subMonths(6))
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
                ->where('bon_commande.date_commande', '>=', now()->subMonths(6))
                ->groupBy('produits.id', 'produits.nom')
                ->orderBy('total_vendu', 'desc')
                ->limit(10)
                ->get();

            // ============================================================
            // 4. TOP CLIENTS (par nombre de commandes)
            // ============================================================
            $topClients = Partenaire::select(
                    'partenaires.id',
                    'partenaires.nom',
                    DB::raw('COUNT(bon_commande.id) as total_commandes'),
                    DB::raw('SUM(bon_commande.montant_total_ht) as total_montant')
                )
                ->leftJoin('bon_commande', 'partenaires.id', '=', 'bon_commande.id_partenaire')
                ->where('partenaires.type_client', 'aerien')
                ->where('bon_commande.statut', 'REÇU')
                ->where('bon_commande.date_commande', '>=', now()->subMonths(6))
                ->groupBy('partenaires.id', 'partenaires.nom')
                ->orderBy('total_commandes', 'desc')
                ->limit(5)
                ->get();

            // ============================================================
            // 5. ALERTES - Produits en stock bas
            // ============================================================
            $produitsStockBas = Produit::with(['categorie', 'unite'])
                ->where('actif', true)
                ->get()
                ->filter(function($produit) {
                    $stockTotal = $produit->getStockTotal();
                    return $stockTotal <= $produit->seuil_alerte && $stockTotal > 0;
                })
                ->map(function($produit) {
                    return [
                        'id' => $produit->id,
                        'nom' => $produit->nom,
                        'stock_actuel' => $produit->getStockTotal(),
                        'seuil_alerte' => $produit->seuil_alerte,
                        'categorie' => $produit->categorie->nom ?? 'Non classé',
                        'unite' => $produit->unite->symbole ?? 'pc'
                    ];
                })
                ->values();

            // ============================================================
            // 6. ALERTES - Lots proches de péremption
            // ============================================================
            $lotsPerimesProches = Lot::with(['produit', 'magasin'])      
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->whereBetween('date_peremption', [now(), now()->addDays(7)])
                ->orderBy('date_peremption', 'asc')
                ->limit(10)
                ->get()
                ->map(function($lot) {
                    return [
                        'id' => $lot->id,
                        'produit' => $lot->produit->nom,
                        'numero_lot' => $lot->numero_lot,
                        'quantite' => $lot->quantite_disponible,
                        'date_peremption' => $lot->date_peremption,
                        'jours_restants' => now()->diffInDays($lot->date_peremption),
                        'magasin' => $lot->magasin->nom
                    ];
                });

            // ============================================================
            // 7. RÉPARTITION PAR CATÉGORIE
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
            // 8. ACTIVITÉS RÉCENTES (Derniers mouvements)
            // ============================================================
            $activitesRecentes = MouvementStock::with([
                    'lot.produit',
                    'lot.magasin',
                    'typeMouvement',
                    'utilisateur'
                ])
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
                    'top_clients' => $topClients,
                    'repartition_categorie' => $repartitionCategorie,

                    // Alertes
                    'alertes' => [
                        'stock_bas' => $produitsStockBas,
                        'peremption_proche' => $lotsPerimesProches,
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
}