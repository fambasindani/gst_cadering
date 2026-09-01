<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracabilite', function (Blueprint $table) {
            $table->id();
            $table->string('numero_tracabilite', 50)->unique();
            $table->foreignId('id_lot')->constrained('lots')->cascadeOnDelete();
            $table->foreignId('id_utilisateur')->constrained('utilisateurs')->cascadeOnDelete();
            $table->foreignId('id_departement')->nullable()->constrained('departements')->nullOnDelete();
            $table->foreignId('id_partenaire')->nullable()->constrained('partenaires')->nullOnDelete();
            $table->integer('quantite');
            $table->text('commentaire')->nullable();
            $table->date('date_tracabilite');
            $table->timestamps();
            $table->softDeletes();

            $table->index('date_tracabilite');
            $table->index('id_lot');
            $table->index('id_utilisateur');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracabilite');
    }
};
