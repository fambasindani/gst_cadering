<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periode_inventaire', function (Blueprint $table) {
            $table->id();
            $table->string('libelle', 100);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['PREVU', 'EN_COURS', 'CLOTURE', 'ANNULE'])
                  ->default('PREVU');
            $table->foreignId('id_ville')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
            $table->text('description')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('id_ville');
            $table->index('statut');
            $table->index(['date_debut', 'date_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periode_inventaire');
    }
};