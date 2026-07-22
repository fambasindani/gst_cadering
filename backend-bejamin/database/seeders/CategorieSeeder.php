<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Categorie;

class CategorieSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['nom' => 'Entrée', 'description' => 'Hors-d\'œuvre, salades, etc.', 'actif' => true],
            ['nom' => 'Plat principal', 'description' => 'Viandes, poissons, pâtes, riz, etc.', 'actif' => true],
            ['nom' => 'Dessert', 'description' => 'Pâtisseries, fruits, etc.', 'actif' => true],
            ['nom' => 'Boisson', 'description' => 'Jus, eau, soda, café, thé', 'actif' => true],
            ['nom' => 'Snack', 'description' => 'Sandwichs, barres céréalières', 'actif' => true],
            ['nom' => 'Linge & Textile', 'description' => 'Nappes, serviettes, blouses', 'actif' => true],
            ['nom' => 'Hygiène & Entretien', 'description' => 'Produits de nettoyage, désinfectants', 'actif' => true],
        ];

        foreach ($categories as $categorie) {
            Categorie::create($categorie);
        }

        $this->command->info('✅ Catégories créées avec succès !');
    }
}