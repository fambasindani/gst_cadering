<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bon_commande', function (Blueprint $table) {
            $table->id();
            $table->string('numero_commande', 50)->unique();
            $table->foreignId('id_partenaire')
                  ->constrained('partenaires', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_ville_destination')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
            $table->date('date_commande');
            $table->date('date_livraison_prevue')->nullable();
            $table->enum('statut', ['BROUILLON', 'ENVOYÉ', 'REÇU PARTIELLEMENT', 'REÇU', 'ANNULE'])
                  ->default('BROUILLON');
            $table->decimal('montant_total_ht', 12, 2)->default(0);
            $table->foreignId('id_devise')
                  ->nullable()
                  ->constrained('devises', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->text('commentaire')->nullable();
            
            // Validation
            $table->foreignId('valide_par')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->datetime('date_validation')->nullable();
            $table->enum('statut_validation', ['EN ATTENTE', 'VALIDÉ', 'REJETÉ'])
                  ->default('EN ATTENTE');
            
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('numero_commande');
            $table->index('id_partenaire');
            $table->index('id_ville_destination');
            $table->index('statut');
            $table->index('date_commande');
            $table->index('statut_validation');
            $table->index(['statut', 'date_commande']);
            $table->index(['id_ville_destination', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bon_commande');
    }
};