<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventaire', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_periode_inventaire')
                  ->constrained('periode_inventaire', 'id')
                  ->onDelete('cascade');
            $table->foreignId('id_produit')
                  ->constrained('produits', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_ville')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
            $table->integer('stock_theorique')->default(0);
            $table->integer('stock_physique_compte')->default(0);
            $table->integer('ecart')->virtualAs('stock_physique_compte - stock_theorique');
            $table->datetime('date_saisie')->nullable();
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->text('commentaire')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('id_periode_inventaire');
            $table->index('id_produit');
            $table->index('id_ville');
            $table->index(['id_periode_inventaire', 'id_produit']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventaire');
    }
};