<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Departement;
use App\Models\Ville;

class DepartementSeeder extends Seeder
{
    public function run(): void
    {
        $kinshasa = Ville::where('code', 'KIN')->first();
        
        if (!$kinshasa) {
            $this->command->error('❌ Ville Kinshasa non trouvée !');
            return;
        }

        $departements = [
            [
                'nom' => 'Kinshasa Centre',
                'code' => 'KIN-C',
                'id_ville' => $kinshasa->id,
                'actif' => true
            ],
            [
                'nom' => 'Kinshasa Est',
                'code' => 'KIN-E',
                'id_ville' => $kinshasa->id,
                'actif' => true
            ],
            [
                'nom' => 'Kinshasa Ouest',
                'code' => 'KIN-O',
                'id_ville' => $kinshasa->id,
                'actif' => true
            ],
            [
                'nom' => 'Kinshasa Sud',
                'code' => 'KIN-S',
                'id_ville' => $kinshasa->id,
                'actif' => true
            ],
        ];

        foreach ($departements as $departement) {
            Departement::create($departement);
        }

        $this->command->info('✅ Départements créés avec succès !');
    }
}