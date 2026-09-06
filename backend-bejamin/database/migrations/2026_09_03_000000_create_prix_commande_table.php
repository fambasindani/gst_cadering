<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prix_commande', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_produit')->constrained('produits')->onDelete('cascade');
            $table->decimal('prix_commande', 18, 4);
            $table->foreignId('id_devise')->constrained('devises');
            $table->date('date');
            $table->string('origine', 50)->default('initial');
            $table->text('commentaire')->nullable();
            $table->timestamps();

            $table->index(['id_produit', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prix_commande');
    }
};
