<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avoir', function (Blueprint $table) {
            $table->id();
            $table->string('numero_avoir', 50)->unique();
            $table->date('date_avoir');
            $table->foreignId('id_partenaire_client')
                  ->constrained('partenaires', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_facture_origine')
                  ->nullable()
                  ->constrained('facture', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_retour')
                  ->nullable()
                  ->constrained('retour', 'id')
                  ->onDelete('set null');
            $table->foreignId('id_devise')
                  ->constrained('devises', 'id')
                  ->onDelete('restrict');
            $table->decimal('montant_ht', 12, 2);
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->text('commentaire')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('numero_avoir');
            $table->index('id_partenaire_client');
            $table->index('id_facture_origine');
            $table->index('id_retour');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('avoir');
    }
};