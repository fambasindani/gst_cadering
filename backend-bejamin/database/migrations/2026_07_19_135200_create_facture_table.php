<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facture', function (Blueprint $table) {
            $table->id();
            $table->string('numero_facture', 50)->unique();
            $table->date('date_facture');
            $table->date('date_echeance');
            $table->foreignId('id_partenaire_client')
                  ->constrained('partenaires', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_bon_commande')
                  ->nullable()
                  ->constrained('bon_commande', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_ville')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_devise')
                  ->constrained('devises', 'id')
                  ->onDelete('restrict');
            $table->decimal('montant_ht', 12, 2);
            $table->decimal('montant_ttc', 12, 2);
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->enum('statut', ['BROUILLON', 'EMISE', 'PAYEE', 'ANNULEE'])
                  ->default('BROUILLON');
            $table->text('commentaire')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('numero_facture');
            $table->index('id_partenaire_client');
            $table->index('id_bon_commande');
            $table->index('id_ville');
            $table->index('statut');
            $table->index('date_facture');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture');
    }
};