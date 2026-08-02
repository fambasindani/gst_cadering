<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Rapport\RapportController;
use App\Http\Controllers\Api\Facturation\AvoirController;
use App\Http\Controllers\Api\Dashboard\DashboardController;
use App\Http\Controllers\Api\Audit\AuditController;
use App\Http\Controllers\Api\Config\{
    UniteController,
    MagasinController,
    DepartementController,
    CategorieController,
    DeviseController,
    UtilisateurController,
    RoleController,
    PermissionController,
    ProduitController,
    HistoriquePrixController,
    PartenaireController,
    LotController,
    TypeMouvementController,
    MouvementStockController,
    PeriodeInventaireController,
    BonCommandeController,
    RetourController,
    InventaireController,
    FicheTechniqueController,
    EntreeRecetteController,
    NotificationController,
    PurgeController
};

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Route par défaut pour tester l'authentification
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/*
|--------------------------------------------------------------------------
| API Routes - Authentification (Public)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

/*
|--------------------------------------------------------------------------
| API Routes - Authentifiées (Protégées par Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'audit'])->group(function () {

    // ============================================================
    // AUTH
    // ============================================================
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('me', [AuthController::class, 'updateMe']);
    });

    // ============================================================
    // CONFIGURATION
    // ============================================================
    Route::prefix('config')->group(function () {

        // ---------- Unités ----------
        Route::get('unites', [UniteController::class, 'index'])->middleware('permission:config:unites:view');
        Route::post('unites', [UniteController::class, 'store'])->middleware('permission:config:unites:create');
        Route::get('unites/{id}', [UniteController::class, 'show'])->middleware('permission:config:unites:view');
        Route::put('unites/{id}', [UniteController::class, 'update'])->middleware('permission:config:unites:update');
        Route::delete('unites/{id}', [UniteController::class, 'destroy'])->middleware('permission:config:unites:delete');
        Route::patch('unites/{id}/toggle', [UniteController::class, 'toggleActif'])->middleware('permission:config:unites:update');

        // ---------- Magasins ----------
        Route::get('magasins', [MagasinController::class, 'index'])->middleware('permission:config:magasins:view');
        Route::post('magasins', [MagasinController::class, 'store'])->middleware('permission:config:magasins:create');
        Route::get('magasins/{id}', [MagasinController::class, 'show'])->middleware('permission:config:magasins:view');
        Route::put('magasins/{id}', [MagasinController::class, 'update'])->middleware('permission:config:magasins:update');
        Route::delete('magasins/{id}', [MagasinController::class, 'destroy'])->middleware('permission:config:magasins:delete');
        Route::patch('magasins/{id}/toggle', [MagasinController::class, 'toggleActif'])->middleware('permission:config:magasins:update');

        // ---------- Départements ----------
        Route::get('departements', [DepartementController::class, 'index'])->middleware('permission:config:departements:view');
        Route::post('departements', [DepartementController::class, 'store'])->middleware('permission:config:departements:create');
        Route::get('departements/{id}', [DepartementController::class, 'show'])->middleware('permission:config:departements:view');
        Route::put('departements/{id}', [DepartementController::class, 'update'])->middleware('permission:config:departements:update');
        Route::delete('departements/{id}', [DepartementController::class, 'destroy'])->middleware('permission:config:departements:delete');
        Route::get('departements/by-magasin/{magasinId}', [DepartementController::class, 'getByMagasin'])->middleware('permission:config:departements:view');
        Route::patch('departements/{id}/toggle', [DepartementController::class, 'toggleActif'])->middleware('permission:config:departements:update');

        // ---------- Catégories ----------
        Route::get('categories', [CategorieController::class, 'index'])->middleware('permission:config:categories:view');
        Route::post('categories', [CategorieController::class, 'store'])->middleware('permission:config:categories:create');
        Route::get('categories/{id}', [CategorieController::class, 'show'])->middleware('permission:config:categories:view');
        Route::put('categories/{id}', [CategorieController::class, 'update'])->middleware('permission:config:categories:update');
        Route::delete('categories/{id}', [CategorieController::class, 'destroy'])->middleware('permission:config:categories:delete');
        Route::patch('categories/{id}/toggle', [CategorieController::class, 'toggleActif'])->middleware('permission:config:categories:update');

        // ---------- Devises ----------
        Route::get('devises', [DeviseController::class, 'index'])->middleware('permission:config:devises:view');
        Route::post('devises', [DeviseController::class, 'store'])->middleware('permission:config:devises:create');
        Route::get('devises/{id}', [DeviseController::class, 'show'])->middleware('permission:config:devises:view');
        Route::put('devises/{id}', [DeviseController::class, 'update'])->middleware('permission:config:devises:update');
        Route::delete('devises/{id}', [DeviseController::class, 'destroy'])->middleware('permission:config:devises:delete');
        Route::patch('devises/{id}/toggle', [DeviseController::class, 'toggleActif'])->middleware('permission:config:devises:update');

        // ---------- Utilisateurs ----------
        Route::get('utilisateurs', [UtilisateurController::class, 'index'])->middleware('permission:config:utilisateurs:view');
        Route::post('utilisateurs', [UtilisateurController::class, 'store'])->middleware('permission:config:utilisateurs:create');
        Route::get('utilisateurs/{id}', [UtilisateurController::class, 'show'])->middleware('permission:config:utilisateurs:view');
        Route::put('utilisateurs/{id}', [UtilisateurController::class, 'update'])->middleware('permission:config:utilisateurs:update');
        Route::delete('utilisateurs/{id}', [UtilisateurController::class, 'destroy'])->middleware('permission:config:utilisateurs:delete');
        Route::patch('utilisateurs/{id}/toggle', [UtilisateurController::class, 'toggleActif'])->middleware('permission:config:utilisateurs:update');

        // ---------- Rôles ----------
        Route::get('roles', [RoleController::class, 'index'])->middleware('permission:config:roles:view');
        Route::post('roles', [RoleController::class, 'store'])->middleware('permission:config:roles:create');
        Route::get('roles/{id}', [RoleController::class, 'show'])->middleware('permission:config:roles:view');
        Route::put('roles/{id}', [RoleController::class, 'update'])->middleware('permission:config:roles:update');
        Route::delete('roles/{id}', [RoleController::class, 'destroy'])->middleware('permission:config:roles:delete');
        Route::patch('roles/{id}/toggle', [RoleController::class, 'toggleActif'])->middleware('permission:config:roles:update');
        Route::post('roles/{id}/assign-permissions', [RoleController::class, 'assignPermissions'])->middleware('permission:config:roles:update');

        // ---------- Permissions ----------
        Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:config:permissions:view');
        Route::post('permissions', [PermissionController::class, 'store'])->middleware('permission:config:permissions:create');
        Route::get('permissions/{id}', [PermissionController::class, 'show'])->middleware('permission:config:permissions:view');
        Route::put('permissions/{id}', [PermissionController::class, 'update'])->middleware('permission:config:permissions:update');
        Route::delete('permissions/{id}', [PermissionController::class, 'destroy'])->middleware('permission:config:permissions:delete');
        Route::patch('permissions/{id}/toggle', [PermissionController::class, 'toggleActif'])->middleware('permission:config:permissions:update');
        Route::get('permissions-all', [PermissionController::class, 'all'])->middleware('permission:config:permissions:view');

        // ---------- Partenaires ----------
        Route::get('partenaires', [PartenaireController::class, 'index'])->middleware('permission:config:partenaires:view');
        Route::post('partenaires', [PartenaireController::class, 'store'])->middleware('permission:config:partenaires:create');
        Route::get('partenaires/fournisseurs', [PartenaireController::class, 'getFournisseurs'])->middleware('permission:config:partenaires:view');
        Route::get('partenaires/clients', [PartenaireController::class, 'getClients'])->middleware('permission:config:partenaires:view');
        Route::get('partenaires/clients/aeriens', [PartenaireController::class, 'getClientsAeriens'])->middleware('permission:config:partenaires:view');
        Route::get('partenaires/clients/non-aeriens', [PartenaireController::class, 'getClientsNonAeriens'])->middleware('permission:config:partenaires:view');
        Route::get('partenaires/{id}', [PartenaireController::class, 'show'])->middleware('permission:config:partenaires:view');
        Route::put('partenaires/{id}', [PartenaireController::class, 'update'])->middleware('permission:config:partenaires:update');
        Route::delete('partenaires/{id}', [PartenaireController::class, 'destroy'])->middleware('permission:config:partenaires:delete');
        Route::patch('partenaires/{id}/toggle', [PartenaireController::class, 'toggleActif'])->middleware('permission:config:partenaires:update');

        // ---------- Produits ----------
        Route::get('produits', [ProduitController::class, 'index'])->middleware('permission:config:produits:view');
        Route::post('produits', [ProduitController::class, 'store'])->middleware('permission:config:produits:create');
        Route::get('produits/{id}', [ProduitController::class, 'show'])->middleware('permission:config:produits:view');
        Route::put('produits/{id}', [ProduitController::class, 'update'])->middleware('permission:config:produits:update');
        Route::delete('produits/{id}', [ProduitController::class, 'destroy'])->middleware('permission:config:produits:delete');
        Route::patch('produits/{id}/toggle', [ProduitController::class, 'toggleActif'])->middleware('permission:config:produits:update');
        Route::get('produits/{id}/stock', [ProduitController::class, 'getStock'])->middleware('permission:config:produits:view');

        // ---------- Historique Prix ----------
        Route::get('historique-prix', [HistoriquePrixController::class, 'index'])->middleware('permission:config:historique_prix:view');
        Route::post('historique-prix', [HistoriquePrixController::class, 'store'])->middleware('permission:config:historique_prix:create');
        Route::get('historique-prix/{id}', [HistoriquePrixController::class, 'show'])->middleware('permission:config:historique_prix:view');
        Route::put('historique-prix/{id}', [HistoriquePrixController::class, 'update'])->middleware('permission:config:historique_prix:update');
        Route::delete('historique-prix/{id}', [HistoriquePrixController::class, 'destroy'])->middleware('permission:config:historique_prix:delete');
        Route::get('produits/{produitId}/dernier-prix', [HistoriquePrixController::class, 'dernierPrix'])->middleware('permission:config:historique_prix:view');

        // ---------- Lots ----------
        Route::get('lots', [LotController::class, 'index'])->middleware('permission:config:lots:view');
        Route::post('lots', [LotController::class, 'store'])->middleware('permission:config:lots:create');
        Route::get('lots/peremption-proche', [LotController::class, 'peremptionProche'])->middleware('permission:config:lots:view');
        Route::get('lots/scan/{codeQr}', [LotController::class, 'scan'])->middleware('permission:config:lots:view');
        Route::get('lots/{id}', [LotController::class, 'show'])->middleware('permission:config:lots:view');
        Route::put('lots/{id}', [LotController::class, 'update'])->middleware('permission:config:lots:update');
        Route::delete('lots/{id}', [LotController::class, 'destroy'])->middleware('permission:config:lots:delete');
        Route::patch('lots/{id}/valider', [LotController::class, 'validateLot'])->middleware('permission:config:lots:validate');
        Route::patch('lots/{id}/rejeter', [LotController::class, 'rejectLot'])->middleware('permission:config:lots:validate');

        // ---------- Types de Mouvement ----------
        Route::get('types-mouvement', [TypeMouvementController::class, 'index'])->middleware('permission:config:type_mouvement:view');
        Route::post('types-mouvement', [TypeMouvementController::class, 'store'])->middleware('permission:config:type_mouvement:create');
        Route::get('types-mouvement/entree', [TypeMouvementController::class, 'getEntree'])->middleware('permission:config:type_mouvement:view');
        Route::get('types-mouvement/sortie', [TypeMouvementController::class, 'getSortie'])->middleware('permission:config:type_mouvement:view');
        Route::get('types-mouvement/{id}', [TypeMouvementController::class, 'show'])->middleware('permission:config:type_mouvement:view');
        Route::put('types-mouvement/{id}', [TypeMouvementController::class, 'update'])->middleware('permission:config:type_mouvement:update');
        Route::delete('types-mouvement/{id}', [TypeMouvementController::class, 'destroy'])->middleware('permission:config:type_mouvement:delete');
        Route::patch('types-mouvement/{id}/toggle', [TypeMouvementController::class, 'toggleActif'])->middleware('permission:config:type_mouvement:update');

        // ---------- Mouvements de Stock ----------
        Route::get('mouvements', [MouvementStockController::class, 'index'])->middleware('permission:config:mouvements:view');
        Route::post('mouvements', [MouvementStockController::class, 'store'])->middleware('permission:config:mouvements:create');
        Route::get('mouvements/{id}', [MouvementStockController::class, 'show'])->middleware('permission:config:mouvements:view');
        Route::put('mouvements/{id}', [MouvementStockController::class, 'update'])->middleware('permission:config:mouvements:update');
        Route::delete('mouvements/{id}', [MouvementStockController::class, 'destroy'])->middleware('permission:config:mouvements:delete');
        Route::patch('mouvements/{id}/valider', [MouvementStockController::class, 'validateMouvement'])->middleware('permission:config:mouvements:validate');
        Route::patch('mouvements/{id}/rejeter', [MouvementStockController::class, 'rejectMouvement'])->middleware('permission:config:mouvements:validate');
        Route::get('mouvements/lot/{lotId}', [MouvementStockController::class, 'getByLot'])->middleware('permission:config:mouvements:view');
        Route::get('mouvements-statistiques', [MouvementStockController::class, 'statistiques'])->middleware('permission:config:mouvements:view');

        // ---------- Purge du stock ----------
        Route::post('purge-stock', [PurgeController::class, 'purgeStock'])->middleware('permission:config:purge:stock');

        // ---------- Périodes Inventaire ----------
        Route::get('periodes-inventaire', [PeriodeInventaireController::class, 'index'])->middleware('permission:config:periode_inventaire:view');
        Route::post('periodes-inventaire', [PeriodeInventaireController::class, 'store'])->middleware('permission:config:periode_inventaire:create');
        Route::get('periodes-inventaire/{id}', [PeriodeInventaireController::class, 'show'])->middleware('permission:config:periode_inventaire:view');
        Route::put('periodes-inventaire/{id}', [PeriodeInventaireController::class, 'update'])->middleware('permission:config:periode_inventaire:update');
        Route::delete('periodes-inventaire/{id}', [PeriodeInventaireController::class, 'destroy'])->middleware('permission:config:periode_inventaire:delete');
        Route::patch('periodes-inventaire/{id}/start', [PeriodeInventaireController::class, 'start'])->middleware('permission:config:periode_inventaire:update');
        Route::patch('periodes-inventaire/{id}/close', [PeriodeInventaireController::class, 'close'])->middleware('permission:config:periode_inventaire:update');

        // ---------- Inventaires ----------
        Route::get('inventaires', [InventaireController::class, 'index'])->middleware('permission:config:inventaire:view');
        Route::post('inventaires', [InventaireController::class, 'store'])->middleware('permission:config:inventaire:create');
        Route::post('inventaires/bulk', [InventaireController::class, 'storeMultiple'])->middleware('permission:config:inventaire:create');
        Route::get('inventaires/{id}', [InventaireController::class, 'show'])->middleware('permission:config:inventaire:view');
        Route::put('inventaires/{id}', [InventaireController::class, 'update'])->middleware('permission:config:inventaire:update');
        Route::delete('inventaires/{id}', [InventaireController::class, 'destroy'])->middleware('permission:config:inventaire:delete');
        Route::get('inventaires/periodes/{periodeId}/resume', [InventaireController::class, 'resume'])->middleware('permission:config:inventaire:view');
        Route::post('inventaires/periodes/{periodeId}/generer-ajustements', [InventaireController::class, 'genererAjustements'])->middleware('permission:config:inventaire:update');
        Route::post('inventaires/periodes/{periodeId}/mettre-a-jour-stock', [InventaireController::class, 'mettreAJourStock'])->middleware('permission:config:inventaire:update');

        // ---------- Bons de Commande ----------
        Route::get('bons-commande', [BonCommandeController::class, 'index'])->middleware('permission:config:bon_commande:view');
        Route::post('bons-commande', [BonCommandeController::class, 'store'])->middleware('permission:config:bon_commande:create');
        Route::get('bons-commande/{id}', [BonCommandeController::class, 'show'])->middleware('permission:config:bon_commande:view');
        Route::put('bons-commande/{id}', [BonCommandeController::class, 'update'])->middleware('permission:config:bon_commande:update');
        Route::delete('bons-commande/{id}', [BonCommandeController::class, 'destroy'])->middleware('permission:config:bon_commande:delete');
        Route::patch('bons-commande/{id}/valider', [BonCommandeController::class, 'validateBon'])->middleware('permission:config:bon_commande:validate');
        Route::patch('bons-commande/{id}/rejeter', [BonCommandeController::class, 'rejectBon'])->middleware('permission:config:bon_commande:validate');
        Route::patch('bons-commande/{id}/recevoir', [BonCommandeController::class, 'receive'])->middleware('permission:config:bon_commande:receive');
        Route::patch('bons-commande/{id}/annuler', [BonCommandeController::class, 'cancel'])->middleware('permission:config:bon_commande:update');

        // ---------- Retours ----------
        Route::get('retours', [RetourController::class, 'index'])->middleware('permission:config:retours:view');
        Route::post('retours', [RetourController::class, 'store'])->middleware('permission:config:retours:create');
        Route::get('retours/{id}', [RetourController::class, 'show'])->middleware('permission:config:retours:view');
        Route::put('retours/{id}', [RetourController::class, 'update'])->middleware('permission:config:retours:update');
        Route::delete('retours/{id}', [RetourController::class, 'destroy'])->middleware('permission:config:retours:delete');
        Route::patch('retours/{id}/valider', [RetourController::class, 'validateRetour'])->middleware('permission:config:retours:validate');
        Route::patch('retours/{id}/rejeter', [RetourController::class, 'rejectRetour'])->middleware('permission:config:retours:validate');
        Route::patch('retours/{id}/traiter', [RetourController::class, 'traiterRetour'])->middleware('permission:config:retours:update');

        // ✅ ============================================================
        // ✅ FICHES TECHNIQUES - À L'INTÉRIEUR DU GROUPE CONFIG
        // ✅ ============================================================
        Route::get('fiches-technique', [FicheTechniqueController::class, 'index'])->middleware('permission:config:fiche_technique:view');
        Route::post('fiches-technique', [FicheTechniqueController::class, 'store'])->middleware('permission:config:fiche_technique:create');
        Route::get('fiches-technique/{id}', [FicheTechniqueController::class, 'show'])->middleware('permission:config:fiche_technique:view');
        Route::put('fiches-technique/{id}', [FicheTechniqueController::class, 'update'])->middleware('permission:config:fiche_technique:update');
        Route::delete('fiches-technique/{id}', [FicheTechniqueController::class, 'destroy'])->middleware('permission:config:fiche_technique:delete');
        Route::patch('fiches-technique/{id}/toggle', [FicheTechniqueController::class, 'toggleActif'])->middleware('permission:config:fiche_technique:update');
        Route::post('fiches-technique/{id}/duplicate', [FicheTechniqueController::class, 'duplicate'])->middleware('permission:config:fiche_technique:create');
        Route::get('fiches-technique/{id}/calculate-cost', [FicheTechniqueController::class, 'calculateCost'])->middleware('permission:config:fiche_technique:view');

        // ✅ ============================================================
        // ✅ ENTRÉE RECETTE - À L'INTÉRIEUR DU GROUPE CONFIG
        // ✅ ============================================================
        Route::get('entree-recette', [EntreeRecetteController::class, 'index'])->middleware('permission:config:recette:view');
        Route::post('entree-recette/produire', [EntreeRecetteController::class, 'produire'])
            ->middleware('permission:config:recette:create');
        Route::get('entree-recette/{id}', [EntreeRecetteController::class, 'show'])->middleware('permission:config:recette:view');
        Route::delete('entree-recette/{id}', [EntreeRecetteController::class, 'destroy'])->middleware('permission:config:recette:delete');

        // ============================================================
        // NOTIFICATIONS
        // ============================================================
        Route::get('notifications', [NotificationController::class, 'index'])->middleware('permission:config:notifications:view');
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->middleware('permission:config:notifications:view');
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->middleware('permission:config:notifications:update');
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->middleware('permission:config:notifications:update');
    });

    // ============================================================
    // FACTURATION (Avoirs uniquement)
    // ============================================================
    Route::prefix('facturation')->group(function () {

        // ---------- Avoirs ----------
        Route::get('avoirs', [AvoirController::class, 'index'])->middleware('permission:facturation:avoir:view');
        Route::post('avoirs', [AvoirController::class, 'store'])->middleware('permission:facturation:avoir:create');
        Route::get('avoirs/{id}', [AvoirController::class, 'show'])->middleware('permission:facturation:avoir:view');
        Route::delete('avoirs/{id}', [AvoirController::class, 'destroy'])->middleware('permission:facturation:avoir:delete');
    });

    // ============================================================
    // RAPPORTS
    // ============================================================
    Route::prefix('rapports')->group(function () {
        Route::get('bon-commande', [RapportController::class, 'bonCommande'])->middleware('permission:rapport:commande');
        Route::get('bon-livraison', [RapportController::class, 'bonLivraison'])->middleware('permission:rapport:commande');
        Route::get('stock', [RapportController::class, 'rapportStock'])->middleware('permission:rapport:stock');
        Route::get('stock-logique-physique', [RapportController::class, 'rapportStockPhysiqueLogique'])->middleware('permission:rapport:stock');
        Route::get('variation-stock', [RapportController::class, 'variationStock'])->middleware('permission:rapport:stock');
        Route::get('variation-stock/calcul', [RapportController::class, 'variationStockCalcul'])->middleware('permission:rapport:stock');
        Route::get('client', [RapportController::class, 'rapportClient'])->middleware('permission:rapport:client');
        Route::get('sortie', [RapportController::class, 'rapportSortie'])->middleware('permission:rapport:stock');
        Route::get('sortie-full', [RapportController::class, 'rapportSortieFull'])->middleware('permission:rapport:stock');
        Route::get('achat-full', [RapportController::class, 'rapportAchatFull'])->middleware('permission:rapport:stock');
        Route::get('fournisseur', [RapportController::class, 'rapportFournisseur'])->middleware('permission:rapport:stock');
        Route::get('mouvement-produit', [RapportController::class, 'mouvementProduit'])->middleware('permission:rapport:stock');
        Route::get('inventaire-theorique', [RapportController::class, 'inventaireTheorique'])->middleware('permission:rapport:inventaire');
        Route::get('inventaire-valorisee', [RapportController::class, 'inventaireTheoriqueValorisee'])->middleware('permission:rapport:inventaire');
        Route::get('consommations-clients', [RapportController::class, 'consommationsClients'])->middleware('permission:rapport:client');
        Route::get('rupture-stock', [RapportController::class, 'ruptureStock'])->middleware('permission:rapport:stock');
        Route::get('stock-bas', [RapportController::class, 'stockBas'])->middleware('permission:rapport:stock');
    });

    // ============================================================
    // DASHBOARD
    // ============================================================
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [DashboardController::class, 'index']);
        Route::get('/mini', [DashboardController::class, 'mini']);
        Route::get('/magasin/{magasinId}', [DashboardController::class, 'byMagasin']);
    });

    // ============================================================
    // AUDITS
    // ============================================================
    Route::prefix('audits')->group(function () {
        Route::get('/', [AuditController::class, 'index'])->middleware('permission:audit:view');
        Route::get('statistiques', [AuditController::class, 'statistiques'])->middleware('permission:audit:view');
        Route::get('table/{table}', [AuditController::class, 'byTable'])->middleware('permission:audit:view');
        Route::get('utilisateur/{utilisateurId}', [AuditController::class, 'byUtilisateur'])->middleware('permission:audit:view');
        Route::get('tables/liste', [AuditController::class, 'tables'])->middleware('permission:audit:view');
        Route::get('actions/liste', [AuditController::class, 'actions'])->middleware('permission:audit:view');
        Route::get('export', [AuditController::class, 'export'])->middleware('permission:audit:export');
        Route::delete('clean', [AuditController::class, 'clean'])->middleware('permission:audit:delete');
        Route::get('{id}', [AuditController::class, 'show'])->middleware('permission:audit:view')->where('id', '[0-9]+');
    });
});