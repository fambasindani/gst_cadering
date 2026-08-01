<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Utilisateur;
use App\Models\Role;
use App\Models\Magasin;
use App\Models\Departement;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer l'admin, le magasin et le département
        $adminRole = Role::where('nom', 'ADMIN')->first();
        $magasin = Magasin::first();
        $departement = Departement::first();

        if (!$adminRole || !$magasin || !$departement) {
            $this->command->error('Erreur: ADMIN, Magasin ou Département manquant !');
            return;
        }

        Utilisateur::create([
            'nom' => 'Admin',
            'prenom' => 'Système',
            'email' => 'pierre@gmail.com',
            'mot_de_passe_hash' => Hash::make('12345678'),
            'id_role' => $adminRole->id,
            'id_magasin' => $magasin->id,
            'id_departement' => $departement->id,
            'actif' => true,
        ]);
    }
}
