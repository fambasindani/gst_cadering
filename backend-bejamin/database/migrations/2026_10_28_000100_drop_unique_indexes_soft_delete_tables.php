<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_nom_unique');
        });

        Schema::table('devises', function (Blueprint $table) {
            $table->dropUnique('devises_code_unique');
        });

        Schema::table('magasins', function (Blueprint $table) {
            $table->dropUnique('villes_code_unique');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unique('nom');
        });

        Schema::table('devises', function (Blueprint $table) {
            $table->unique('code');
        });

        Schema::table('magasins', function (Blueprint $table) {
            $table->unique('code');
        });
    }
};
