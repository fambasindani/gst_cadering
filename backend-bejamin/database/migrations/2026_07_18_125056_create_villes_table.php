<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('villes', function (Blueprint $table) {
            $table->id(); // ✅ Utilisation de id
            $table->string('nom', 100);
            $table->string('code', 20)->nullable()->unique();
            $table->string('pays', 100)->default('RDC');
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('actif');
            $table->index('nom');
            $table->index('code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('villes');
    }
};