<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE lots MODIFY quantite_recue DECIMAL(12,3) NOT NULL');
        DB::statement('ALTER TABLE lots MODIFY quantite_disponible DECIMAL(12,3) NOT NULL');
        DB::statement('ALTER TABLE mouvement_stock MODIFY quantite DECIMAL(12,3) NOT NULL');
        DB::statement('ALTER TABLE ligne_commande MODIFY quantite_commandee DECIMAL(12,3) NOT NULL');
        DB::statement('ALTER TABLE ligne_commande MODIFY quantite_recue DECIMAL(12,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE ligne_retour MODIFY quantite_retournee DECIMAL(12,3) NOT NULL');
        DB::statement('ALTER TABLE tracabilite MODIFY quantite DECIMAL(12,3) NOT NULL');

        // Colonne générée : on la recrée après avoir élargi les colonnes de base
        DB::statement('ALTER TABLE inventaire DROP COLUMN ecart');
        DB::statement('ALTER TABLE inventaire MODIFY stock_physique_compte DECIMAL(12,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE inventaire MODIFY stock_theorique DECIMAL(12,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE inventaire MODIFY ecart_saisie DECIMAL(12,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE inventaire ADD COLUMN ecart DECIMAL(12,3) GENERATED ALWAYS AS (stock_physique_compte - stock_theorique) VIRTUAL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE lots MODIFY quantite_recue INT NOT NULL');
        DB::statement('ALTER TABLE lots MODIFY quantite_disponible INT NOT NULL');
        DB::statement('ALTER TABLE mouvement_stock MODIFY quantite INT NOT NULL');
        DB::statement('ALTER TABLE ligne_commande MODIFY quantite_commandee INT NOT NULL');
        DB::statement('ALTER TABLE ligne_commande MODIFY quantite_recue INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE ligne_retour MODIFY quantite_retournee INT NOT NULL');
        DB::statement('ALTER TABLE tracabilite MODIFY quantite INT NOT NULL');

        DB::statement('ALTER TABLE inventaire DROP COLUMN ecart');
        DB::statement('ALTER TABLE inventaire MODIFY stock_physique_compte INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE inventaire MODIFY stock_theorique INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE inventaire MODIFY ecart_saisie INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE inventaire ADD COLUMN ecart INT GENERATED ALWAYS AS (stock_physique_compte - stock_theorique) VIRTUAL');
    }
};
