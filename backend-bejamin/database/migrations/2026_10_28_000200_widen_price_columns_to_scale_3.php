<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE avoir MODIFY montant_ht DECIMAL(12,3) NOT NULL');
        DB::statement('ALTER TABLE bon_commande MODIFY montant_total_ht DECIMAL(12,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE fiche_technique MODIFY cout_total DECIMAL(10,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE fiche_technique MODIFY cout_unitaire DECIMAL(10,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE fiche_technique MODIFY prix_kg DECIMAL(10,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE historique_prix MODIFY prix_achat_ht DECIMAL(10,3) NOT NULL');
        DB::statement('ALTER TABLE historique_prix MODIFY prix_vente_ht DECIMAL(10,3) NULL');
        DB::statement('ALTER TABLE ligne_commande MODIFY prix_unitaire_ht DECIMAL(10,3) NOT NULL');
        DB::statement('ALTER TABLE ligne_fiche_technique MODIFY cout_total DECIMAL(10,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE ligne_fiche_technique MODIFY prix_unitaire DECIMAL(10,3) NOT NULL DEFAULT 0.000');
        DB::statement('ALTER TABLE lots MODIFY prix_achat_ht_unitaire DECIMAL(10,3) NULL');
        DB::statement('ALTER TABLE prix_commande MODIFY prix_commande DECIMAL(18,4) NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE avoir MODIFY montant_ht DECIMAL(12,2) NOT NULL');
        DB::statement('ALTER TABLE bon_commande MODIFY montant_total_ht DECIMAL(12,2) NOT NULL DEFAULT 0.00');
        DB::statement('ALTER TABLE fiche_technique MODIFY cout_total DECIMAL(10,2) NOT NULL DEFAULT 0.00');
        DB::statement('ALTER TABLE fiche_technique MODIFY cout_unitaire DECIMAL(10,2) NOT NULL DEFAULT 0.00');
        DB::statement('ALTER TABLE fiche_technique MODIFY prix_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00');
        DB::statement('ALTER TABLE historique_prix MODIFY prix_achat_ht DECIMAL(10,2) NOT NULL');
        DB::statement('ALTER TABLE historique_prix MODIFY prix_vente_ht DECIMAL(10,2) NULL');
        DB::statement('ALTER TABLE ligne_commande MODIFY prix_unitaire_ht DECIMAL(10,2) NOT NULL');
        DB::statement('ALTER TABLE ligne_fiche_technique MODIFY cout_total DECIMAL(10,2) NOT NULL DEFAULT 0.00');
        DB::statement('ALTER TABLE ligne_fiche_technique MODIFY prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 0.00');
        DB::statement('ALTER TABLE lots MODIFY prix_achat_ht_unitaire DECIMAL(10,2) NULL');
    }
};
