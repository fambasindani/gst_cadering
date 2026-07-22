<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiement', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_facture')
                  ->constrained('facture', 'id')
                  ->onDelete('cascade');
            $table->decimal('montant', 12, 2);
            $table->date('date_paiement');
            $table->enum('mode_paiement', ['VIREMENT', 'CHEQUE', 'ESPECES', 'CARTE', 'AUTRE'])
                  ->default('VIREMENT');
            $table->string('reference', 50)->nullable();
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->text('commentaire')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('id_facture');
            $table->index('date_paiement');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiement');
    }
};