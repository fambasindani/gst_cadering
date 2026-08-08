<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // ============================================================
            // CONFIG - Unités
            // ============================================================
            ['nom' => 'Voir les unités', 'code' => 'config:unites:view'],
            ['nom' => 'Créer une unité', 'code' => 'config:unites:create'],
            ['nom' => 'Modifier une unité', 'code' => 'config:unites:update'],
            ['nom' => 'Supprimer une unité', 'code' => 'config:unites:delete'],

            // ============================================================
            // CONFIG - Magasins
            // ============================================================
            ['nom' => 'Voir les magasins', 'code' => 'config:magasins:view'],
            ['nom' => 'Créer un magasin', 'code' => 'config:magasins:create'],
            ['nom' => 'Modifier un magasin', 'code' => 'config:magasins:update'],
            ['nom' => 'Supprimer un magasin', 'code' => 'config:magasins:delete'],

            // ============================================================
            // CONFIG - Départements
            // ============================================================
            ['nom' => 'Voir les départements', 'code' => 'config:departements:view'],
            ['nom' => 'Créer un département', 'code' => 'config:departements:create'],
            ['nom' => 'Modifier un département', 'code' => 'config:departements:update'],
            ['nom' => 'Supprimer un département', 'code' => 'config:departements:delete'],

            // ============================================================
            // CONFIG - Catégories
            // ============================================================
            ['nom' => 'Voir les catégories', 'code' => 'config:categories:view'],
            ['nom' => 'Créer une catégorie', 'code' => 'config:categories:create'],
            ['nom' => 'Modifier une catégorie', 'code' => 'config:categories:update'],
            ['nom' => 'Supprimer une catégorie', 'code' => 'config:categories:delete'],

            // ============================================================
            // CONFIG - Devises
            // ============================================================
            ['nom' => 'Voir les devises', 'code' => 'config:devises:view'],
            ['nom' => 'Créer une devise', 'code' => 'config:devises:create'],
            ['nom' => 'Modifier une devise', 'code' => 'config:devises:update'],
            ['nom' => 'Supprimer une devise', 'code' => 'config:devises:delete'],

            // ============================================================
            // CONFIG - Taux de conversion
            // ============================================================
            ['nom' => 'Voir les taux de conversion', 'code' => 'config:taux_conversion:view'],
            ['nom' => 'Créer un taux de conversion', 'code' => 'config:taux_conversion:create'],
            ['nom' => 'Modifier un taux de conversion', 'code' => 'config:taux_conversion:update'],
            ['nom' => 'Supprimer un taux de conversion', 'code' => 'config:taux_conversion:delete'],

            // ============================================================
            // CONFIG - Utilisateurs
            // ============================================================
            ['nom' => 'Voir les utilisateurs', 'code' => 'config:utilisateurs:view'],
            ['nom' => 'Créer un utilisateur', 'code' => 'config:utilisateurs:create'],
            ['nom' => 'Modifier un utilisateur', 'code' => 'config:utilisateurs:update'],
            ['nom' => 'Supprimer un utilisateur', 'code' => 'config:utilisateurs:delete'],

            // ============================================================
            // CONFIG - Rôles
            // ============================================================
            ['nom' => 'Voir les rôles', 'code' => 'config:roles:view'],
            ['nom' => 'Créer un rôle', 'code' => 'config:roles:create'],
            ['nom' => 'Modifier un rôle', 'code' => 'config:roles:update'],
            ['nom' => 'Supprimer un rôle', 'code' => 'config:roles:delete'],

            // ============================================================
            // CONFIG - Permissions
            // ============================================================
            ['nom' => 'Voir les permissions', 'code' => 'config:permissions:view'],
            ['nom' => 'Créer une permission', 'code' => 'config:permissions:create'],
            ['nom' => 'Modifier une permission', 'code' => 'config:permissions:update'],
            ['nom' => 'Supprimer une permission', 'code' => 'config:permissions:delete'],

            // ============================================================
            // CONFIG - Partenaires
            // ============================================================
            ['nom' => 'Voir les partenaires', 'code' => 'config:partenaires:view'],
            ['nom' => 'Créer un partenaire', 'code' => 'config:partenaires:create'],
            ['nom' => 'Modifier un partenaire', 'code' => 'config:partenaires:update'],
            ['nom' => 'Supprimer un partenaire', 'code' => 'config:partenaires:delete'],

            // ============================================================
            // CONFIG - Produits
            // ============================================================
            ['nom' => 'Voir les produits', 'code' => 'config:produits:view'],
            ['nom' => 'Créer un produit', 'code' => 'config:produits:create'],
            ['nom' => 'Modifier un produit', 'code' => 'config:produits:update'],
            ['nom' => 'Supprimer un produit', 'code' => 'config:produits:delete'],

            // ============================================================
            // CONFIG - Historique Prix
            // ============================================================
            ['nom' => 'Voir l\'historique des prix', 'code' => 'config:historique_prix:view'],
            ['nom' => 'Ajouter un prix', 'code' => 'config:historique_prix:create'],
            ['nom' => 'Modifier un prix', 'code' => 'config:historique_prix:update'],
            ['nom' => 'Supprimer un prix', 'code' => 'config:historique_prix:delete'],

            // ============================================================
            // CONFIG - Lots
            // ============================================================
            ['nom' => 'Voir les lots', 'code' => 'config:lots:view'],
            ['nom' => 'Créer un lot', 'code' => 'config:lots:create'],
            ['nom' => 'Modifier un lot', 'code' => 'config:lots:update'],
            ['nom' => 'Supprimer un lot', 'code' => 'config:lots:delete'],
            ['nom' => 'Valider un lot', 'code' => 'config:lots:validate'],

            // ============================================================
            // CONFIG - Types de Mouvement
            // ============================================================
            ['nom' => 'Voir les types de mouvement', 'code' => 'config:type_mouvement:view'],
            ['nom' => 'Créer un type de mouvement', 'code' => 'config:type_mouvement:create'],
            ['nom' => 'Modifier un type de mouvement', 'code' => 'config:type_mouvement:update'],
            ['nom' => 'Supprimer un type de mouvement', 'code' => 'config:type_mouvement:delete'],

            // ============================================================
            // CONFIG - Mouvements de Stock
            // ============================================================
            ['nom' => 'Voir les mouvements', 'code' => 'config:mouvements:view'],
            ['nom' => 'Créer un mouvement', 'code' => 'config:mouvements:create'],
            ['nom' => 'Modifier un mouvement', 'code' => 'config:mouvements:update'],
            ['nom' => 'Supprimer un mouvement', 'code' => 'config:mouvements:delete'],
            ['nom' => 'Valider un mouvement', 'code' => 'config:mouvements:validate'],

            // ============================================================
            // CONFIG - Purge stock
            // ============================================================
            ['nom' => 'Purger le stock (entrées/sorties)', 'code' => 'config:purge:stock'],

            // ============================================================
            // CONFIG - Périodes Inventaire
            // ============================================================
            ['nom' => 'Voir les périodes d\'inventaire', 'code' => 'config:periode_inventaire:view'],
            ['nom' => 'Créer une période', 'code' => 'config:periode_inventaire:create'],
            ['nom' => 'Modifier une période', 'code' => 'config:periode_inventaire:update'],
            ['nom' => 'Supprimer une période', 'code' => 'config:periode_inventaire:delete'],

            // ============================================================
            // CONFIG - Inventaires
            // ============================================================
            ['nom' => 'Voir les inventaires', 'code' => 'config:inventaire:view'],
            ['nom' => 'Créer un inventaire', 'code' => 'config:inventaire:create'],
            ['nom' => 'Modifier un inventaire', 'code' => 'config:inventaire:update'],
            ['nom' => 'Supprimer un inventaire', 'code' => 'config:inventaire:delete'],

            // ============================================================
            // CONFIG - Bons de Commande
            // ============================================================
            ['nom' => 'Voir les bons de commande', 'code' => 'config:bon_commande:view'],
            ['nom' => 'Créer un bon de commande', 'code' => 'config:bon_commande:create'],
            ['nom' => 'Modifier un bon de commande', 'code' => 'config:bon_commande:update'],
            ['nom' => 'Supprimer un bon de commande', 'code' => 'config:bon_commande:delete'],
            ['nom' => 'Valider un bon de commande', 'code' => 'config:bon_commande:validate'],
            ['nom' => 'Réceptionner un bon de commande', 'code' => 'config:bon_commande:receive'],

            // ============================================================
            // CONFIG - Retours
            // ============================================================
            ['nom' => 'Voir les retours', 'code' => 'config:retours:view'],
            ['nom' => 'Créer un retour', 'code' => 'config:retours:create'],
            ['nom' => 'Modifier un retour', 'code' => 'config:retours:update'],
            ['nom' => 'Supprimer un retour', 'code' => 'config:retours:delete'],
            ['nom' => 'Valider un retour', 'code' => 'config:retours:validate'],

            // ============================================================
            // FACTURATION - Avoirs
            // ============================================================
            ['nom' => 'Voir les avoirs', 'code' => 'facturation:avoir:view'],
            ['nom' => 'Créer un avoir', 'code' => 'facturation:avoir:create'],
            ['nom' => 'Supprimer un avoir', 'code' => 'facturation:avoir:delete'],

            // ============================================================
            // RAPPORTS
            // ============================================================
            ['nom' => 'Voir les rapports de commandes', 'code' => 'rapport:commande'],
            ['nom' => 'Voir les rapports de stock', 'code' => 'rapport:stock'],
            ['nom' => 'Voir les rapports de clients', 'code' => 'rapport:client'],
            ['nom' => 'Voir les rapports d\'inventaire', 'code' => 'rapport:inventaire'],
            ['nom' => 'Voir les rapports de recettes', 'code' => 'rapport:recette'],
            ['nom' => 'Voir les rapports de facturation', 'code' => 'rapport:facturation'],

            // ============================================================
            // AUDITS
            // ============================================================
            ['nom' => 'Voir les audits', 'code' => 'audit:view'],
            ['nom' => 'Exporter les audits', 'code' => 'audit:export'],
            ['nom' => 'Supprimer les audits', 'code' => 'audit:delete'],



            // Fiches Techniques
            ['nom' => 'Voir les fiches techniques', 'code' => 'config:fiche_technique:view'],
            ['nom' => 'Créer une fiche technique', 'code' => 'config:fiche_technique:create'],
            ['nom' => 'Modifier une fiche technique', 'code' => 'config:fiche_technique:update'],
            ['nom' => 'Supprimer une fiche technique', 'code' => 'config:fiche_technique:delete'],

            // Recettes (Production)
            ['nom' => 'Voir les entrées recette', 'code' => 'config:recette:view'],
            ['nom' => 'Produire à partir d\'une recette', 'code' => 'config:recette:create'],
            ['nom' => 'Supprimer une entrée recette', 'code' => 'config:recette:delete'],

            // Fiches techniques (menus)
            ['nom' => 'Voir les fiches techniques (menus)', 'code' => 'config:fiche_technique_menu:view'],
            ['nom' => 'Créer une fiche technique (menu)', 'code' => 'config:fiche_technique_menu:create'],
            ['nom' => 'Modifier une fiche technique (menu)', 'code' => 'config:fiche_technique_menu:update'],
            ['nom' => 'Supprimer une fiche technique (menu)', 'code' => 'config:fiche_technique_menu:delete'],

            // Notifications
            ['nom' => 'Voir les notifications', 'code' => 'config:notifications:view'],
            ['nom' => 'Gérer les notifications', 'code' => 'config:notifications:update'],

        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['code' => $permission['code']],
                [
                    'nom' => $permission['nom'],
                    'actif' => true
                ]
            );
        }

        Permission::whereIn('code', [
            'config:villes:view', 'config:villes:create', 'config:villes:update', 'config:villes:delete',
            'config:zones:view', 'config:zones:create', 'config:zones:update', 'config:zones:delete',
            'config:emplacements:view', 'config:emplacements:create', 'config:emplacements:update', 'config:emplacements:delete',
        ])->delete();

        $this->command->info('✅ ' . count($permissions) . ' permissions créées avec succès !');
    }
}