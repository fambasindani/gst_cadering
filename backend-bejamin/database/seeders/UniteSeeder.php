<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unite;

class UniteSeeder extends Seeder
{
    public function run(): void
    {
        $unites = [
            ['nom' => 'pièce', 'symbole' => 'pc', 'description' => 'Unité individuelle', 'actif' => true],
            ['nom' => 'kilogramme', 'symbole' => 'kg', 'description' => 'Poids en kilogrammes', 'actif' => true],
            ['nom' => 'gramme', 'symbole' => 'g', 'description' => 'Poids en grammes', 'actif' => true],
            ['nom' => 'litre', 'symbole' => 'l', 'description' => 'Volume en litres', 'actif' => true],
            ['nom' => 'millilitre', 'symbole' => 'ml', 'description' => 'Volume en millilitres', 'actif' => true],
            ['nom' => 'mètre', 'symbole' => 'm', 'description' => 'Longueur en mètres', 'actif' => true],
            ['nom' => 'centimètre', 'symbole' => 'cm', 'description' => 'Longueur en centimètres', 'actif' => true],
            ['nom' => 'unités', 'symbole' => 'u', 'description' => 'Unités génériques', 'actif' => true],
        ];

        foreach ($unites as $unite) {
            Unite::create($unite);
        }

        $this->command->info('✅ Unités créées avec succès !');
    }
}