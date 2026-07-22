<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ligne_commande', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_bon_commande')
                  ->constrained('bon_commande', 'id')
                  ->onDelete('cascade');
            $table->foreignId('id_produit')
                  ->constrained('produits', 'id')
                  ->onDelete('restrict');
            $table->integer('quantite_commandee');
            $table->decimal('prix_unitaire_ht', 10, 2);
            $table->foreignId('id_devise')
                  ->constrained('devises', 'id')
                  ->onDelete('restrict');
            $table->integer('quantite_recue')->default(0);
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('id_bon_commande');
            $table->index('id_produit');
            $table->index(['id_bon_commande', 'id_produit']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ligne_commande');
    }
};