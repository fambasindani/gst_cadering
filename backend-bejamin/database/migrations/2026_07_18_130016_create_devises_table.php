<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devises', function (Blueprint $table) {
            $table->id(); // ✅ Utilisation de id
            $table->string('code', 10)->unique();
            $table->string('nom', 50);
            $table->string('symbole', 10)->nullable();
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('actif');
            $table->index('code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devises');
    }
};