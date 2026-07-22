<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->string('code_article', 50)->unique();
            $table->string('code_barre', 50)->nullable()->unique();
            $table->string('nom', 200);
            $table->text('description')->nullable();
            $table->foreignId('id_categorie')
                  ->nullable()
                  ->constrained('categories', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_partenaire_principal')
                  ->nullable()
                  ->constrained('partenaires', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_unite')
                  ->constrained('unites', 'id')
                  ->onDelete('restrict');
            $table->integer('seuil_alerte')->default(0);
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('nom');
            $table->index('code_article');
            $table->index('actif');
            $table->index('id_categorie');
            $table->index('id_partenaire_principal');
            $table->index('id_unite');
            $table->index(['actif', 'id_categorie']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};