<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Réduire les statuts du bon de commande à 4 valeurs : BROUILLON,
     * REÇU PARTIELLEMENT, REÇU et CLOTURE. Le statut ENVOYÉ est supprimé :
     * la validation est portée par statut_validation.
     */
    public function up(): void
    {
        // Convertir les données existantes avant de réduire l'enum
        DB::table('bon_commande')->where('statut', 'ENVOYÉ')->update(['statut' => 'BROUILLON']);

        DB::statement("ALTER TABLE `bon_commande` MODIFY COLUMN `statut` ENUM('BROUILLON', 'REÇU PARTIELLEMENT', 'REÇU', 'CLOTURE') NOT NULL DEFAULT 'BROUILLON'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `bon_commande` MODIFY COLUMN `statut` ENUM('BROUILLON', 'ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU', 'CLOTURE') NOT NULL DEFAULT 'BROUILLON'");
    }
};
