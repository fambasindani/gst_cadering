<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajouter le statut 'BROUILLON' à l'enum statut_validation de la table lots.
     * Permet de créer des lots de réception partielle en attente de validation
     * dans la page « Entrée stock ».
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE `lots` MODIFY COLUMN `statut_validation` ENUM('BROUILLON', 'EN ATTENTE', 'VALIDÉ', 'REJETÉ', 'OBSOLÈTE') NOT NULL DEFAULT 'EN ATTENTE'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `lots` MODIFY COLUMN `statut_validation` ENUM('EN ATTENTE', 'VALIDÉ', 'REJETÉ', 'OBSOLÈTE') NOT NULL DEFAULT 'EN ATTENTE'");
    }
};
