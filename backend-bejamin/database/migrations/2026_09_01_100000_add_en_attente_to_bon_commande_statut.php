<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE bon_commande MODIFY statut ENUM('BROUILLON','EN ATTENTE','REÇU PARTIELLEMENT','REÇU','CLOTURE')");
    }

    public function down(): void
    {
        DB::statement("UPDATE bon_commande SET statut = 'BROUILLON' WHERE statut = 'EN ATTENTE'");
        DB::statement("ALTER TABLE bon_commande MODIFY statut ENUM('BROUILLON','REÇU PARTIELLEMENT','REÇU','CLOTURE')");
    }
};
