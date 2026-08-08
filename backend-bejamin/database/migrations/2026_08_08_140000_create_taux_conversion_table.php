<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taux_conversion', function (Blueprint $table) {
            $table->id();
            $table->string('code_devise', 10)->default('CDF');
            $table->string('nom', 100)->nullable();
            $table->decimal('taux', 18, 2);
            $table->date('date_application');
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taux_conversion');
    }
};
