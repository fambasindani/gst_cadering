<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Departement;
use App\Models\Magasin;

class DepartementSeeder extends Seeder
{
    public function run(): void
    {
        $departements = [
            ['nom' => 'Cuisine chaude', 'code' => 'CUIS-CH'],
            ['nom' => 'Cuisine froide', 'code' => 'CUIS-FR'],
            ['nom' => 'Laverie', 'code' => 'LAV'],
            ['nom' => 'Pâtisserie', 'code' => 'PAT'],
        ];

        $magasins = Magasin::all();

        if ($magasins->isEmpty()) {
            $this->command->error('❌ Aucun magasin trouvé !');
            return;
        }

        foreach ($magasins as $magasin) {
            foreach ($departements as $departement) {
                Departement::firstOrCreate([
                    'id_magasin' => $magasin->id,
                    'nom' => $departement['nom'],
                ], [
                    'code' => $departement['code'],
                    'actif' => true,
                ]);
            }
        }

        $this->command->info('✅ Départements créés avec succès !');
    }
}
