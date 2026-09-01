<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('controles_livraisons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->date('date_operation');
            $table->string('cie_numero_vol', 100)->nullable();
            $table->string('client', 150)->nullable();
            $table->string('nom_agent', 100)->nullable();
            $table->boolean('camion_propre')->nullable();
            $table->time('heure_debut')->nullable();
            $table->time('heure_fin')->nullable();
            $table->string('code_prestation_classe', 50)->nullable();
            $table->string('plat_produit', 150)->nullable();
            $table->string('code_couleur', 50)->nullable();
            $table->string('numero_lot', 100)->nullable();
            $table->decimal('final_holding_temperature', 5, 2)->nullable();
            $table->decimal('reception_client_temperature', 5, 2)->nullable();
            $table->text('commentaires')->nullable();
            $table->string('nom_signature_superviseur', 100)->nullable();
            $table->string('nom_signature_responsable_client', 100)->nullable();
            $table->text('remarque_generale')->nullable();
            $table->timestamps();

            $table->index('date_operation');
            $table->foreign('id_utilisateur')->references('id')->on('utilisateurs')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('controles_livraisons');
    }
};
