<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mouvement_stock', function (Blueprint $table) {
            $table->foreignId('id_facture')
                  ->nullable()
                  ->after('id_type_mouvement')
                  ->constrained('facture', 'id')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('mouvement_stock', function (Blueprint $table) {
            $table->dropForeign(['id_facture']);
            $table->dropColumn('id_facture');
        });
    }
};
