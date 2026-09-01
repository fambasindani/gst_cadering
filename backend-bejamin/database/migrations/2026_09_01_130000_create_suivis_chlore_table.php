<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suivis_chlore', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->string('nom_agent', 100)->nullable();
            $table->date('date_operation');
            $table->string('produits_traites', 150)->nullable();
            $table->decimal('concentration_ppm', 6, 2)->nullable();
            $table->integer('temps_trempage_minutes')->nullable();
            $table->string('numero_lots_produits', 150)->nullable();
            $table->string('client', 150)->nullable();
            $table->text('commentaire_action_corrective')->nullable();
            $table->timestamps();

            $table->index('date_operation');
            $table->foreign('id_utilisateur')->references('id')->on('utilisateurs')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suivis_chlore');
    }
};
