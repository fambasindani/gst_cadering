<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_produit')
                  ->constrained('produits', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_ville')
                  ->constrained('villes', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_zone')
                  ->constrained('zones', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_emplacement')
                  ->nullable()
                  ->constrained('emplacements', 'id')
                  ->onDelete('set null');
            $table->string('numero_lot', 50);
            $table->string('code_qr', 255)->nullable()->unique();
            $table->integer('quantite_recue');
            $table->integer('quantite_disponible');
            $table->date('date_fabrication')->nullable();
            $table->date('date_peremption');
            $table->datetime('date_reception')->nullable();
            $table->foreignId('id_partenaire')
                  ->nullable()
                  ->constrained('partenaires', 'id')
                  ->onDelete('set null');
            $table->decimal('prix_achat_ht_unitaire', 10, 2)->nullable();
            $table->foreignId('id_devise')
                  ->nullable()
                  ->constrained('devises', 'id')
                  ->onDelete('set null');
            $table->foreignId('valide_par')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->datetime('date_validation')->nullable();
            $table->enum('statut_validation', ['EN ATTENTE', 'VALIDÉ', 'REJETÉ', 'OBSOLÈTE'])
                  ->default('EN ATTENTE');
            $table->text('commentaire')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Index
            $table->index('id_produit');
            $table->index('id_ville');
            $table->index('id_zone');
            $table->index('id_emplacement');
            $table->index('numero_lot');
            $table->index('code_qr');
            $table->index('date_peremption');
            $table->index('statut_validation');
            $table->index(['id_ville', 'date_peremption']);
            $table->index(['id_produit', 'id_ville']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lots');
    }
};