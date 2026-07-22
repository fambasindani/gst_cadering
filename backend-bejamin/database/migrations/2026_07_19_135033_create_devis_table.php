<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devis', function (Blueprint $table) {
            $table->id();
            $table->string('numero_devis', 50)->unique();
            $table->date('date_devis');
            $table->date('date_validite')->nullable();
            $table->foreignId('id_partenaire_client')
                  ->constrained('partenaires', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_ville')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_devise')
                  ->constrained('devises', 'id')
                  ->onDelete('restrict');
            $table->decimal('montant_ht', 12, 2)->default(0);
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->enum('statut', ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'TRANSFORME_EN_COMMANDE'])
                  ->default('BROUILLON');
            $table->text('commentaire')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('numero_devis');
            $table->index('id_partenaire_client');
            $table->index('id_ville');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devis');
    }
};