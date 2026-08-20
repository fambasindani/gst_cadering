<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Seuil d'alerte (stock de sécurité) par produit ET par magasin.
     * Le seuil global du produit (produits.seuil_alerte) reste le repli
     * quand aucun seuil spécifique n'est défini pour un magasin.
     */
    public function up(): void
    {
        Schema::create('produit_magasin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_produit')->constrained('produits')->cascadeOnDelete();
            $table->foreignId('id_magasin')->constrained('magasins')->cascadeOnDelete();
            $table->integer('seuil_alerte')->default(0);
            $table->timestamps();

            $table->unique(['id_produit', 'id_magasin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produit_magasin');
    }
};
