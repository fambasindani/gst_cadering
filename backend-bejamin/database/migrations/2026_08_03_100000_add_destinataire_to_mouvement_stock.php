<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mouvement_stock', function (Blueprint $table) {
            $table->foreignId('id_partenaire')
                  ->nullable()
                  ->after('id_type_mouvement')
                  ->constrained('partenaires', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_magasin')
                  ->nullable()
                  ->after('id_partenaire')
                  ->constrained('magasins', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_departement')
                  ->nullable()
                  ->after('id_magasin')
                  ->constrained('departements', 'id')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('mouvement_stock', function (Blueprint $table) {
            $table->dropForeign(['id_partenaire']);
            $table->dropForeign(['id_magasin']);
            $table->dropForeign(['id_departement']);
            $table->dropColumn(['id_partenaire', 'id_magasin', 'id_departement']);
        });
    }
};
