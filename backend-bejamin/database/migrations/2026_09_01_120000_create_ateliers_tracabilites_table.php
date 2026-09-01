<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ateliers_tracabilites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->enum('type_atelier', ['DRESSAGE', 'MONTAGE']);
            $table->date('date_operation');
            $table->decimal('temperature_atelier', 5, 2)->nullable();
            $table->string('nom_operateur', 100)->nullable();
            $table->string('code_prestation', 50)->nullable();
            $table->string('compagnie_client', 150)->nullable();
            $table->string('quantite', 50)->nullable();
            $table->text('produits_utilises')->nullable();
            $table->string('numero_lot', 100)->nullable();
            $table->string('code_couleur_produit_dlc', 100)->nullable();
            $table->string('cycle_classe', 50)->nullable();
            $table->time('heure_debut')->nullable();
            $table->decimal('temperature_surface_debut', 5, 2)->nullable();
            $table->time('heure_fin')->nullable();
            $table->decimal('temperature_surface_fin', 5, 2)->nullable();
            $table->text('action_corrective')->nullable();
            $table->timestamps();

            $table->index(['type_atelier', 'date_operation']);
            $table->foreign('id_utilisateur')->references('id')->on('utilisateurs')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ateliers_tracabilites');
    }
};
