<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('ligne_devis');
        Schema::dropIfExists('devis');
    }

    public function down(): void
    {
        // La fonctionnalité Devis est supprimée définitivement
    }
};
