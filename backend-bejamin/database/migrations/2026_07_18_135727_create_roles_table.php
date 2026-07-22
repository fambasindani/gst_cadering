<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 50)->unique();
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('actif');
            $table->index('nom');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};