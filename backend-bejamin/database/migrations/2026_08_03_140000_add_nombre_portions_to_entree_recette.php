<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entree_recette', function (Blueprint $table) {
            $table->integer('nombre_portions')->nullable()->after('nombre_passages')
                  ->comment('Nombre de portions (1 portion = 1 passager)');
        });

        // Backfill : portions = rendement de la fiche × passages
        DB::statement('
            UPDATE entree_recette er
            JOIN fiche_technique ft ON ft.id = er.id_fiche_technique
            SET er.nombre_portions = ft.rendement * er.nombre_passages
            WHERE er.nombre_portions IS NULL
        ');
    }

    public function down(): void
    {
        Schema::table('entree_recette', function (Blueprint $table) {
            $table->dropColumn('nombre_portions');
        });
    }
};
