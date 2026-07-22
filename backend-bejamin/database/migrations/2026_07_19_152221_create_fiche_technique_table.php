<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fiche_technique', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('nom', 200);
            $table->text('description')->nullable();
            $table->foreignId('id_produit_fini')
                  ->constrained('produits', 'id')
                  ->onDelete('restrict');
            $table->integer('rendement')->default(1)->comment('Nombre de portions');
            $table->foreignId('id_ville')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
            $table->decimal('cout_total', 10, 2)->default(0)->comment('Coût total de la recette');
            $table->decimal('cout_unitaire', 10, 2)->default(0)->comment('Coût par portion');
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('code');
            $table->index('id_produit_fini');
            $table->index('id_ville');
            $table->index('actif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiche_technique');
    }
};