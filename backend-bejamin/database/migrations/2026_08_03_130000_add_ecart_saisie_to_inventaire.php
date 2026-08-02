<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventaire', function (Blueprint $table) {
            $table->integer('ecart_saisie')->default(0)->after('stock_physique_compte');
        });

        // Figer l'écart tel que constaté à la saisie (physique − théorique de l'époque)
        DB::table('inventaire')->update(['ecart_saisie' => DB::raw('stock_physique_compte - stock_theorique')]);
    }

    public function down(): void
    {
        Schema::table('inventaire', function (Blueprint $table) {
            $table->dropColumn('ecart_saisie');
        });
    }
};
