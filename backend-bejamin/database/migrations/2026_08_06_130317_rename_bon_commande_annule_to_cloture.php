<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Remplacer le statut 'ANNULE' par 'CLOTURE' sur bon_commande.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE `bon_commande` MODIFY COLUMN `statut` ENUM('BROUILLON', 'ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU', 'CLOTURE', 'ANNULE') NOT NULL DEFAULT 'BROUILLON'");

        DB::table('bon_commande')->where('statut', 'ANNULE')->update(['statut' => 'CLOTURE']);

        DB::statement("ALTER TABLE `bon_commande` MODIFY COLUMN `statut` ENUM('BROUILLON', 'ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU', 'CLOTURE') NOT NULL DEFAULT 'BROUILLON'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `bon_commande` MODIFY COLUMN `statut` ENUM('BROUILLON', 'ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU', 'CLOTURE', 'ANNULE') NOT NULL DEFAULT 'BROUILLON'");

        DB::table('bon_commande')->where('statut', 'CLOTURE')->update(['statut' => 'ANNULE']);

        DB::statement("ALTER TABLE `bon_commande` MODIFY COLUMN `statut` ENUM('BROUILLON', 'ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU', 'ANNULE') NOT NULL DEFAULT 'BROUILLON'");
    }
};
