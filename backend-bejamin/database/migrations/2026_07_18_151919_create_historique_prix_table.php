<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historique_prix', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_produit')
                  ->constrained('produits', 'id')
                  ->onDelete('cascade');
            $table->decimal('prix_achat_ht', 10, 2);
            $table->decimal('prix_vente_ht', 10, 2)->nullable();
            $table->foreignId('id_devise')
                  ->constrained('devises', 'id')
                  ->onDelete('restrict');
            $table->date('date_application');
            $table->text('commentaire')->nullable();
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('id_produit');
            $table->index('date_application');
            $table->index('id_devise');
            $table->index(['id_produit', 'date_application']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_prix');
    }
};