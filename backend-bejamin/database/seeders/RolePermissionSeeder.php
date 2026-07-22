<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer les rôles
        $admin = Role::where('nom', 'ADMIN')->first();
        $respStock = Role::where('nom', 'RESP_STOCK')->first();
        $commercial = Role::where('nom', 'COMMERCIAL')->first();
        $magasinier = Role::where('nom', 'MAGASINIER')->first();
        $consultation = Role::where('nom', 'CONSULTATION')->first();

        // ADMIN : Toutes les permissions
        if ($admin) {
            $admin->permissions()->sync(Permission::all()->pluck('id'));
        }

        // RESP_STOCK
        if ($respStock) {
            $permissions = Permission::whereIn('code', [
                'commande:create',
                'commande:receive',
                'produit:manage',
                'lot:manage',
                'lot:validate',
                'mouvement:create',
                'mouvement:validate',
                'inventaire:manage',
                'periode:cloture',
                'recette:manage',
                'retour:create',
                'retour:validate',
                'rapport:stock',
                'rapport:prix',
                'rapport:commande',
                'rapport:inventaire',
                'rapport:recette'
            ])->get();
            $respStock->permissions()->sync($permissions->pluck('id'));
        }

        // COMMERCIAL
        if ($commercial) {
            $permissions = Permission::whereIn('code', [
                'commande:create',
                'devis:manage',
                'facture:manage',
                'paiement:manage',
                'avoir:manage',
                'rapport:commande',
                'rapport:facturation'
            ])->get();
            $commercial->permissions()->sync($permissions->pluck('id'));
        }

        // MAGASINIER
        if ($magasinier) {
            $permissions = Permission::whereIn('code', [
                'lot:manage',
                'mouvement:create',
                'commande:receive',
                'retour:create',
                'inventaire:manage',
                'rapport:stock'
            ])->get();
            $magasinier->permissions()->sync($permissions->pluck('id'));
        }

        // CONSULTATION
        if ($consultation) {
            $permissions = Permission::whereIn('code', [
                'rapport:stock',
                'rapport:prix',
                'rapport:commande',
                'rapport:inventaire',
                'rapport:recette',
                'rapport:facturation'
            ])->get();
            $consultation->permissions()->sync($permissions->pluck('id'));
        }
    }
}