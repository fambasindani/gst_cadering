<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fiche technique (menu) : menu composé de fiches recettes
        Schema::create('fiche_technique_menu', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('nom', 200);
            $table->text('description')->nullable();
            $table->string('cycle', 50)->nullable()->comment('Ex : 1');
            $table->string('periodicite', 100)->nullable()->comment('Ex : JAN-AVR-JUIL-OCT');
            $table->string('validite', 100)->nullable()->comment('Ex : 2025');
            $table->foreignId('id_partenaire')->nullable()->constrained('partenaires', 'id')->onDelete('set null')->comment('Partenaire/Prestataire');
            $table->foreignId('id_magasin')->constrained('magasins', 'id')->onDelete('restrict');
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('code');
            $table->index('id_magasin');
            $table->index('actif');
        });

        // Partie d'une fiche technique (Entrée, Plat, Pain & beurre, Fromage, Dessert, Extra...)
        Schema::create('fiche_technique_menu_partie', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_fiche_technique_menu')->constrained('fiche_technique_menu', 'id')->onDelete('cascade');
            $table->string('nom', 200);
            $table->integer('ordre')->default(0);
            $table->timestamps();

            $table->index('id_fiche_technique_menu');
        });

        // Élément d'une partie : référence une fiche recette + pourcentage des passagers
        Schema::create('fiche_technique_menu_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_partie')->constrained('fiche_technique_menu_partie', 'id')->onDelete('cascade');
            $table->foreignId('id_fiche_technique')->constrained('fiche_technique', 'id')->onDelete('restrict');
            $table->string('designation', 200)->nullable()->comment('Libellé d\'affichage, sinon nom de la fiche recette');
            $table->decimal('pourcentage', 5, 2)->default(100)->comment('Part des passagers concernés');
            $table->integer('ordre')->default(0);
            $table->timestamps();

            $table->index('id_partie');
            $table->index('id_fiche_technique');
        });

        // Rapport généré d'une fiche technique (date + compagnie + menu + passagers)
        Schema::create('entree_fiche_technique', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_fiche_technique_menu')->constrained('fiche_technique_menu', 'id')->onDelete('restrict');
            $table->foreignId('id_partenaire')->constrained('partenaires', 'id')->onDelete('restrict')->comment('Compagnie');
            $table->integer('nombre_passagers')->default(0);
            $table->date('date_rapport');
            $table->text('commentaire')->nullable();
            $table->foreignId('id_utilisateur')->nullable()->constrained('utilisateurs', 'id')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index('id_fiche_technique_menu');
            $table->index('id_partenaire');
            $table->index('date_rapport');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entree_fiche_technique');
        Schema::dropIfExists('fiche_technique_menu_item');
        Schema::dropIfExists('fiche_technique_menu_partie');
        Schema::dropIfExists('fiche_technique_menu');
    }
};
