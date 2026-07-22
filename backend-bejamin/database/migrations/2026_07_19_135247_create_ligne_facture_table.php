<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ligne_facture', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_facture')
                  ->constrained('facture', 'id')
                  ->onDelete('cascade');
            $table->foreignId('id_produit')
                  ->constrained('produits', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_lot')
                  ->nullable()
                  ->constrained('lots', 'id')
                  ->onDelete('set null');
            $table->integer('quantite');
            $table->decimal('prix_unitaire_ht', 10, 2);
            $table->decimal('remise', 5, 2)->default(0);
            $table->decimal('montant_ht', 12, 2)->virtualAs('quantite * prix_unitaire_ht * (1 - remise/100)');
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('id_facture');
            $table->index('id_produit');
            $table->index('id_lot');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ligne_facture');
    }
};