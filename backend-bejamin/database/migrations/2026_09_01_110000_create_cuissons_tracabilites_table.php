<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuissons_tracabilites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->date('date_operation');
            $table->string('produit', 150);
            $table->string('mise_en_decongelation', 50)->nullable();
            $table->string('code_couleur', 50)->nullable();
            $table->string('quantite_avant_cuisson', 50)->nullable();
            $table->string('quantite_apres_cuisson', 50)->nullable();
            $table->string('dlc_dluo', 50)->nullable();
            $table->string('numero_lot_interne', 100)->nullable();
            $table->string('numero_lot_cree', 100)->nullable();
            $table->string('mode_cuisson', 50)->nullable();
            $table->time('heure_fin_cuisson')->nullable();
            $table->decimal('temperature_coeur_cuisson', 5, 2)->nullable();
            $table->time('heure_debut_refroidissement')->nullable();
            $table->time('heure_fin_refroidissement')->nullable();
            $table->decimal('temperature_coeur_refroidissement', 5, 2)->nullable();
            $table->string('nom_operateur', 100)->nullable();
            $table->string('client', 150)->nullable();
            $table->timestamps();

            $table->index('date_operation');
            $table->index('produit');
            $table->foreign('id_utilisateur')->references('id')->on('utilisateurs')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuissons_tracabilites');
    }
};
