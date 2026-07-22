<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'nom' => 'ADMIN',
                'description' => 'Administrateur - Accès total au système',
                'actif' => true
            ],
            [
                'nom' => 'RESP_STOCK',
                'description' => 'Responsable des stocks - Gestion et validation des lots',
                'actif' => true
            ],
            [
                'nom' => 'COMMERCIAL',
                'description' => 'Commercial - Création de commandes et suivi fournisseurs',
                'actif' => true
            ],
            [
                'nom' => 'MAGASINIER',
                'description' => 'Magasinier - Réception, mouvements physiques, scan QR',
                'actif' => true
            ],
            [
                'nom' => 'CONSULTATION',
                'description' => 'Consultation - Lecture seule sur les rapports',
                'actif' => true
            ],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}