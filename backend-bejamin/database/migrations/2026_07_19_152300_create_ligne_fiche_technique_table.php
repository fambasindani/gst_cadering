<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ligne_fiche_technique', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_fiche_technique')
                  ->constrained('fiche_technique', 'id')
                  ->onDelete('cascade');
            $table->foreignId('id_produit_ingredient')
                  ->constrained('produits', 'id')
                  ->onDelete('restrict');
            $table->decimal('quantite_ingredient', 10, 2);
            $table->foreignId('id_unite')
                  ->constrained('unites', 'id')
                  ->onDelete('restrict');
            $table->decimal('prix_unitaire', 10, 2)->default(0);
            $table->decimal('cout_total', 10, 2)->default(0);
            $table->text('commentaire')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('id_fiche_technique');
            $table->index('id_produit_ingredient');
            $table->index('id_unite');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ligne_fiche_technique');
    }
};