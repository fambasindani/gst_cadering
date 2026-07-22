<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ligne_retour', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_retour')
                  ->constrained('retour', 'id')
                  ->onDelete('cascade');
            $table->foreignId('id_lot')
                  ->constrained('lots', 'id')
                  ->onDelete('restrict');
            $table->integer('quantite_retournee');
            $table->text('motif')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('id_retour');
            $table->index('id_lot');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ligne_retour');
    }
};