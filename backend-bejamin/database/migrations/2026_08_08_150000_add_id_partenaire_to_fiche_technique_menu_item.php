<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fiche_technique_menu_item', function (Blueprint $table) {
            $table->foreignId('id_partenaire')->nullable()->after('id_produit')
                ->constrained('partenaires', 'id')->nullOnDelete()->comment('Client de la ligne');
            $table->index('id_partenaire');
        });
    }

    public function down(): void
    {
        Schema::table('fiche_technique_menu_item', function (Blueprint $table) {
            $table->dropForeign(['id_partenaire']);
            $table->dropIndex(['id_partenaire']);
            $table->dropColumn('id_partenaire');
        });
    }
};
