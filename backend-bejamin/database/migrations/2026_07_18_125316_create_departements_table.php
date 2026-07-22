<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departements', function (Blueprint $table) {
            $table->id(); // ✅ Utilisation de id
            $table->string('nom', 100);
            $table->string('code', 20)->nullable();
            $table->foreignId('id_ville')
                  ->constrained('villes') // ✅ Plus besoin de spécifier la colonne
                  ->onDelete('cascade');
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('id_ville');
            $table->index('actif');
            $table->index(['id_ville', 'actif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departements');
    }
};