<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mouvement_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_lot')
                  ->constrained('lots', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_type_mouvement')
                  ->constrained('type_mouvement', 'id')
                  ->onDelete('restrict');
            $table->integer('quantite');
            $table->datetime('date_mouvement')->nullable();
            $table->foreignId('id_utilisateur')
                  ->nullable()
                  ->constrained('utilisateurs', 'id')
                  ->onDelete('set null');
            $table->string('reference_document', 100)->nullable();
            $table->text('commentaire')->nullable();
            $table->foreignId('id_periode_inventaire')
                  ->nullable()
                  ->constrained('periode_inventaire', 'id')
                  ->onDelete('set null');
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
            $table->index('id_lot');
            $table->index('id_type_mouvement');
            $table->index('date_mouvement');
            $table->index('id_utilisateur');
            $table->index('reference_document');
            $table->index('statut_validation');
            $table->index(['id_lot', 'date_mouvement']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvement_stock');
    }
};