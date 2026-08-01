<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Magasin;

class MagasinSeeder extends Seeder
{
    public function run(): void
    {
        $magasins = [
            [
                'nom' => 'Kinshasa',
                'code' => 'KIN',
                'pays' => 'RDC',
                'actif' => true
            ],
            [
                'nom' => 'Lubumbashi',
                'code' => 'LUB',
                'pays' => 'RDC',
                'actif' => true
            ],
        ];

        foreach ($magasins as $magasin) {
            Magasin::firstOrCreate(
                ['code' => $magasin['code']],
                $magasin
            );
        }

        $this->command->info('✅ Magasins créés avec succès !');
    }
}
