<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Devise;

class DeviseSeeder extends Seeder
{
    public function run(): void
    {
        $devises = [
            
            ['code' => 'USD', 'nom' => 'Dollar US', 'symbole' => '$', 'actif' => true],
            ['code' => 'EUR', 'nom' => 'Euro', 'symbole' => '€', 'actif' => true],
        ];

        foreach ($devises as $devise) {
            Devise::create($devise);
        }

        $this->command->info('✅ Devises créées avec succès !');
    }
}