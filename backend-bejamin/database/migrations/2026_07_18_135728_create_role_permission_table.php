<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_permission', function (Blueprint $table) {
            $table->foreignId('id_role')
                  ->constrained('roles', 'id')
                  ->onDelete('cascade');
            $table->foreignId('id_permission')
                  ->constrained('permissions', 'id')
                  ->onDelete('cascade');
            $table->timestamps();

            $table->primary(['id_role', 'id_permission']);
            $table->index('id_role');
            $table->index('id_permission');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permission');
    }
};