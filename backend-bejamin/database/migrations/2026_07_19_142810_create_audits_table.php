<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audits', function (Blueprint $table) {
            $table->id();
            
            // Utilisateur qui a effectué l'action
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            
            // Type d'action (INSERT, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
            $table->string('action', 100);
            
            // Table concernée
            $table->string('table_cible', 50);
            
            // ID de l'enregistrement concerné
            $table->unsignedBigInteger('id_enregistrement')->nullable();
            
            // Anciennes valeurs (JSON)
            $table->json('anciennes_valeurs')->nullable();
            
            // Nouvelles valeurs (JSON)
            $table->json('nouvelles_valeurs')->nullable();
            
            // Date de l'action
            $table->datetime('date_action')->nullable();
            
            // Adresse IP de l'utilisateur
            $table->string('adresse_ip', 45)->nullable();
            
            // Informations supplémentaires (optionnel)
            $table->string('user_agent', 255)->nullable();
            $table->string('route', 255)->nullable();
            
            $table->timestamps();

            // Index pour optimiser les recherches
            $table->index('id_utilisateur');
            $table->index('action');
            $table->index('table_cible');
            $table->index('id_enregistrement');
            $table->index('date_action');
            $table->index(['table_cible', 'id_enregistrement']);
            $table->index(['date_action', 'action']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audits');
    }
};