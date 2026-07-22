<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('type_mouvement', function (Blueprint $table) {
            $table->id();
            $table->string('libelle', 50);
            $table->tinyInteger('sens')->default(1)->comment('+1=entrée, -1=sortie');
            $table->boolean('actif')->default(true);
            $table->timestamps();

            $table->index('libelle');
            $table->index('sens');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('type_mouvement');
    }
};