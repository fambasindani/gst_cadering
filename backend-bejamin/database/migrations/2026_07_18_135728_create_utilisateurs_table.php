<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('prenom', 100)->nullable();
            $table->string('email', 100)->unique();
            $table->string('mot_de_passe_hash', 255);
            $table->foreignId('id_role')
                  ->constrained('roles', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_ville')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_departement')
                  ->constrained('departements', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_zone')->nullable()
                  ->constrained('zones', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_emplacement')->nullable()
                  ->constrained('emplacements', 'id')
                  ->onDelete('set null');
            $table->boolean('actif')->default(true);
            $table->datetime('derniere_connexion')->nullable();
            $table->string('remember_token', 100)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('email');
            $table->index('actif');
            $table->index('id_role');
            $table->index('id_ville');
            $table->index('id_departement');
            $table->index(['id_ville', 'actif']);
            $table->index(['id_departement', 'actif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};