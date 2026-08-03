<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rendre id_fiche_technique nullable (via SQL brut car doctrine/dbal absent)
        DB::statement('ALTER TABLE fiche_technique_menu_item MODIFY id_fiche_technique BIGINT UNSIGNED NULL');

        Schema::table('fiche_technique_menu_item', function (Blueprint $table) {
            $table->foreignId('id_produit')->nullable()->after('id_fiche_technique')
                ->constrained('produits', 'id')->nullOnDelete();
            $table->index('id_produit');
        });
    }

    public function down(): void
    {
        Schema::table('fiche_technique_menu_item', function (Blueprint $table) {
            $table->dropForeign(['id_produit']);
            $table->dropIndex(['id_produit']);
            $table->dropColumn('id_produit');
        });

        DB::statement('ALTER TABLE fiche_technique_menu_item MODIFY id_fiche_technique BIGINT UNSIGNED NOT NULL');
    }
};
