<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class ConfigPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Unités
            ['nom' => 'Voir les unités', 'code' => 'config:unites:view'],
            ['nom' => 'Créer une unité', 'code' => 'config:unites:create'],
            ['nom' => 'Modifier une unité', 'code' => 'config:unites:update'],
            ['nom' => 'Supprimer une unité', 'code' => 'config:unites:delete'],

            // Magasins
            ['nom' => 'Voir les magasins', 'code' => 'config:magasins:view'],
            ['nom' => 'Créer un magasin', 'code' => 'config:magasins:create'],
            ['nom' => 'Modifier un magasin', 'code' => 'config:magasins:update'],
            ['nom' => 'Supprimer un magasin', 'code' => 'config:magasins:delete'],

            // Départements
            ['nom' => 'Voir les départements', 'code' => 'config:departements:view'],
            ['nom' => 'Créer un département', 'code' => 'config:departements:create'],
            ['nom' => 'Modifier un département', 'code' => 'config:departements:update'],
            ['nom' => 'Supprimer un département', 'code' => 'config:departements:delete'],

            // Catégories
            ['nom' => 'Voir les catégories', 'code' => 'config:categories:view'],
            ['nom' => 'Créer une catégorie', 'code' => 'config:categories:create'],
            ['nom' => 'Modifier une catégorie', 'code' => 'config:categories:update'],
            ['nom' => 'Supprimer une catégorie', 'code' => 'config:categories:delete'],

            // Devises
            ['nom' => 'Voir les devises', 'code' => 'config:devises:view'],
            ['nom' => 'Créer une devise', 'code' => 'config:devises:create'],
            ['nom' => 'Modifier une devise', 'code' => 'config:devises:update'],
            ['nom' => 'Supprimer une devise', 'code' => 'config:devises:delete'],

            // Taux de conversion
            ['nom' => 'Voir les taux de conversion', 'code' => 'config:taux_conversion:view'],
            ['nom' => 'Créer un taux de conversion', 'code' => 'config:taux_conversion:create'],
            ['nom' => 'Modifier un taux de conversion', 'code' => 'config:taux_conversion:update'],
            ['nom' => 'Supprimer un taux de conversion', 'code' => 'config:taux_conversion:delete'],

            // Utilisateurs
            ['nom' => 'Voir les utilisateurs', 'code' => 'config:utilisateurs:view'],
            ['nom' => 'Créer un utilisateur', 'code' => 'config:utilisateurs:create'],
            ['nom' => 'Modifier un utilisateur', 'code' => 'config:utilisateurs:update'],
            ['nom' => 'Supprimer un utilisateur', 'code' => 'config:utilisateurs:delete'],

            // Rôles
            ['nom' => 'Voir les rôles', 'code' => 'config:roles:view'],
            ['nom' => 'Créer un rôle', 'code' => 'config:roles:create'],
            ['nom' => 'Modifier un rôle', 'code' => 'config:roles:update'],
            ['nom' => 'Supprimer un rôle', 'code' => 'config:roles:delete'],

            // Permissions
            ['nom' => 'Voir les permissions', 'code' => 'config:permissions:view'],
            ['nom' => 'Créer une permission', 'code' => 'config:permissions:create'],
            ['nom' => 'Modifier une permission', 'code' => 'config:permissions:update'],
            ['nom' => 'Supprimer une permission', 'code' => 'config:permissions:delete'],

            // Purge stock
            ['nom' => 'Purger le stock (entrées/sorties)', 'code' => 'config:purge:stock'],
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

        $this->command->info('✅ Permissions de configuration créées avec succès !');
    }
}