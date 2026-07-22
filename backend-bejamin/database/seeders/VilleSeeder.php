<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ville;

class VilleSeeder extends Seeder
{
    public function run(): void
    {
        $villes = [
         
            [
                'nom' => 'Goma',
                'code' => 'GOM',
                'pays' => 'RDC',
                'actif' => true
            ],
            [
                'nom' => 'Bukavu',
                'code' => 'BUK',
                'pays' => 'RDC',
                'actif' => true
            ],
        ];

        foreach ($villes as $ville) {
            Ville::create($ville);
        }

        $this->command->info('✅ Villes créées avec succès !');
    }
}