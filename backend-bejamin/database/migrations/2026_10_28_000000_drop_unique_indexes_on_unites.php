<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            $table->dropUnique('unites_nom_unique');
            $table->dropUnique('unites_symbole_unique');
        });
    }

    public function down(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            $table->unique('nom');
            $table->unique('symbole');
        });
    }
};
