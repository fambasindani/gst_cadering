<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emplacements', function (Blueprint $table) {
            $table->id(); // ✅ Utilisation de id
            $table->string('nom', 100);
            $table->foreignId('id_zone')
                  ->constrained('zones')
                  ->onDelete('cascade');
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('id_zone');
            $table->index('actif');
            $table->index(['id_zone', 'actif']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emplacements');
    }
};