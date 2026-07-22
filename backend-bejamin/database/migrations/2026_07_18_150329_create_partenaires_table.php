<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partenaires', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['fournisseur', 'client', 'both'])->default('fournisseur');
            $table->enum('type_client', ['aerien', 'non_aerien', 'both'])->nullable();
            $table->string('code_iata', 10)->nullable();
            $table->string('nom', 150);
            $table->text('adresse')->nullable();
            $table->string('telephone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('identifiant_fiscal', 50)->nullable();
            $table->foreignId('id_ville')
                  ->nullable()
                  ->constrained('villes', 'id')
                  ->onDelete('set null');
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('type');
            $table->index('type_client');
            $table->index('code_iata');
            $table->index('nom');
            $table->index('id_ville');
            $table->index(['type', 'actif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partenaires');
    }
};