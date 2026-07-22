<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retour', function (Blueprint $table) {
            $table->id();
            $table->string('numero_retour', 50)->unique();
            $table->date('date_retour');
            
            // Provenance
            $table->foreignId('id_partenaire_client')
                  ->nullable()
                  ->constrained('partenaires', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_zone_provenance')
                  ->nullable()
                  ->constrained('zones', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_emplacement_provenance')
                  ->nullable()
                  ->constrained('emplacements', 'id')
                  ->onDelete('set null');
            
            // Destination
            $table->foreignId('id_partenaire_dest')
                  ->nullable()
                  ->constrained('partenaires', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_zone_dest')
                  ->nullable()
                  ->constrained('zones', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_emplacement_dest')
                  ->nullable()
                  ->constrained('emplacements', 'id')
                  ->onDelete('set null');
            
            $table->foreignId('id_ville')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
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
            $table->enum('statut_validation', ['EN ATTENTE', 'VALIDÉ', 'REJETÉ', 'TRAITÉ'])
                  ->default('EN ATTENTE');
            
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('numero_retour');
            $table->index('date_retour');
            $table->index('id_ville');
            $table->index('id_partenaire_client');
            $table->index('id_zone_provenance');
            $table->index('statut_validation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retour');
    }
};