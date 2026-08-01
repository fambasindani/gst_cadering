<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UniteSeeder::class,
            DeviseSeeder::class,
            MagasinSeeder::class,
            DepartementSeeder::class,
            CategorieSeeder::class,
            RoleSeeder::class,
            PermissionSeeder::class,
            RolePermissionSeeder::class,
        ]);
    }
}