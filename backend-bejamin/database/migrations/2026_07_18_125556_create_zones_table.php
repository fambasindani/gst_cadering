<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id(); // ✅ Utilisation de id
            $table->string('nom', 100);
            $table->foreignId('id_ville')
                  ->constrained('villes')
                  ->onDelete('cascade');
            $table->enum('type_zone', ['production', 'stockage', 'service', 'hygiene'])
                  ->default('stockage');
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('id_ville');
            $table->index('actif');
            $table->index(['id_ville', 'actif']);
            $table->index('type_zone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};