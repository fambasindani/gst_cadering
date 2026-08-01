<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::where('nom', 'ADMIN')->first();
        $respStock = Role::where('nom', 'RESP_STOCK')->first();
        $commercial = Role::where('nom', 'COMMERCIAL')->first();
        $magasinier = Role::where('nom', 'MAGASINIER')->first();
        $consultation = Role::where('nom', 'CONSULTATION')->first();

        // ADMIN : toutes les permissions
        if ($admin) {
            $admin->permissions()->sync(Permission::all()->pluck('id'));
        }

        // RESP_STOCK
        if ($respStock) {
            $codes = [
                // Unités (view)
                'config:unites:view',
                // Magasins (view)
                'config:magasins:view',
                // Catégories / Devises (view)
                'config:categories:view', 'config:devises:view',
                // Produits (view + gestion)
                'config:produits:view', 'config:produits:create', 'config:produits:update',
                // Historique prix (view + ajout)
                'config:historique_prix:view', 'config:historique_prix:create',
                // Lots (view + gestion + validation)
                'config:lots:view', 'config:lots:create', 'config:lots:update', 'config:lots:validate',
                // Types mouvement (view)
                'config:type_mouvement:view',
                // Mouvements (view + création + validation)
                'config:mouvements:view', 'config:mouvements:create', 'config:mouvements:validate',
                // Périodes inventaire (view + création + modification)
                'config:periode_inventaire:view', 'config:periode_inventaire:create', 'config:periode_inventaire:update',
                // Inventaires (view + création + modification)
                'config:inventaire:view', 'config:inventaire:create', 'config:inventaire:update',
                // Bons de commande (view + création + réception)
                'config:bon_commande:view', 'config:bon_commande:create', 'config:bon_commande:receive',
                // Retours (view + création + validation)
                'config:retours:view', 'config:retours:create', 'config:retours:validate',
                // Fiches techniques (view + création + modification)
                'config:fiche_technique:view', 'config:fiche_technique:create', 'config:fiche_technique:update',
                // Recette (production)
                'config:recette:view', 'config:recette:create', 'config:recette:delete',
                // Partenaires (view)
                'config:partenaires:view',
                // Notifications
                'config:notifications:view', 'config:notifications:update',
                // Rapports
                'rapport:stock', 'rapport:commande', 'rapport:inventaire', 'rapport:client',
            ];
            $respStock->permissions()->sync(Permission::whereIn('code', $codes)->pluck('id'));
        }

        // COMMERCIAL
        if ($commercial) {
            $codes = [
                // Unités (view)
                'config:unites:view',
                // Produits (view)
                'config:produits:view',
                // Partenaires (view + création)
                'config:partenaires:view', 'config:partenaires:create',
                // Bons de commande (view + création)
                'config:bon_commande:view', 'config:bon_commande:create',
                // Avoirs (view + création)
                'facturation:avoir:view', 'facturation:avoir:create',
                // Notifications
                'config:notifications:view',
                // Rapports
                'rapport:commande', 'rapport:client',
            ];
            $commercial->permissions()->sync(Permission::whereIn('code', $codes)->pluck('id'));
        }

        // MAGASINIER
        if ($magasinier) {
            $codes = [
                // Unités / Magasins (view)
                'config:unites:view', 'config:magasins:view',
                // Catégories (view)
                'config:categories:view',
                // Produits (view)
                'config:produits:view',
                // Lots (view + création)
                'config:lots:view', 'config:lots:create',
                // Mouvements (view + création)
                'config:mouvements:view', 'config:mouvements:create',
                // Périodes inventaire (view)
                'config:periode_inventaire:view',
                // Inventaires (view + création + modification)
                'config:inventaire:view', 'config:inventaire:create', 'config:inventaire:update',
                // Bons de commande (view + réception)
                'config:bon_commande:view', 'config:bon_commande:receive',
                // Retours (view + création)
                'config:retours:view', 'config:retours:create',
                // Fiches techniques (view)
                'config:fiche_technique:view',
                // Recette (production)
                'config:recette:view', 'config:recette:create',
                // Notifications
                'config:notifications:view', 'config:notifications:update',
                // Rapports
                'rapport:stock',
            ];
            $magasinier->permissions()->sync(Permission::whereIn('code', $codes)->pluck('id'));
        }

        // CONSULTATION
        if ($consultation) {
            $codes = [
                // Toutes les vues (lecture seule)
                'config:unites:view', 'config:magasins:view', 'config:departements:view',
                'config:categories:view',
                'config:devises:view', 'config:produits:view', 'config:lots:view',
                'config:type_mouvement:view', 'config:mouvements:view',
                'config:periode_inventaire:view', 'config:inventaire:view',
                'config:bon_commande:view', 'config:retours:view',
                'config:fiche_technique:view', 'config:recette:view', 'config:partenaires:view',
                'config:historique_prix:view',
                'facturation:avoir:view',
                'config:notifications:view',
                // Rapports
                'rapport:stock', 'rapport:commande', 'rapport:client',
                'rapport:inventaire',
            ];
            $consultation->permissions()->sync(Permission::whereIn('code', $codes)->pluck('id'));
        }
    }
}
