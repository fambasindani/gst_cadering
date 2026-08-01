<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fiche technique : nouveaux champs de recette
        Schema::table('fiche_technique', function (Blueprint $table) {
            $table->decimal('poids_portion', 10, 3)->default(0)->after('rendement')->comment('Poids d\'une portion');
            $table->string('unite_poids_portion', 10)->default('gm')->after('poids_portion')->comment('Unité du poids (mg, gm, kg)');
            $table->decimal('prix_kg', 10, 2)->default(0)->after('cout_unitaire')->comment('Prix par kg');
        });

        // Ligne fiche technique : colonnes de la fiche recette
        Schema::table('ligne_fiche_technique', function (Blueprint $table) {
            $table->decimal('rendement', 5, 2)->default(100)->after('id_unite')->comment('Rendement en %');
            $table->decimal('poids_net', 10, 3)->default(0)->after('prix_unitaire')->comment('Poids net');
            $table->decimal('poids_brut', 10, 3)->default(0)->after('poids_net')->comment('Poids brut');
            $table->boolean('rendement_apres_cuisson')->default(false)->after('cout_total')->comment('Rendement après cuisson oui/non');
        });

        // Table entrée recette : commande de production client
        Schema::create('entree_recette', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_fiche_technique')
                  ->constrained('fiche_technique', 'id')
                  ->onDelete('restrict');
            $table->foreignId('id_partenaire')
                  ->constrained('partenaires', 'id')
                  ->onDelete('restrict');
            $table->integer('nombre_passages')->default(1)->comment('Nombre de passages pour le client');
            $table->date('date_production');
            $table->text('commentaire')->nullable();
            $table->foreignId('id_utilisateur')->nullable()->constrained('utilisateurs', 'id')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index('id_fiche_technique');
            $table->index('id_partenaire');
            $table->index('date_production');
        });

        // Rendre id_produit_fini nullable (plus de lien produit fini requis)
        DB::statement('ALTER TABLE fiche_technique DROP FOREIGN KEY fiche_technique_id_produit_fini_foreign');
        DB::statement('ALTER TABLE fiche_technique MODIFY id_produit_fini BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE fiche_technique ADD CONSTRAINT fiche_technique_id_produit_fini_foreign FOREIGN KEY (id_produit_fini) REFERENCES produits(id) ON DELETE RESTRICT');

        // quantite_ingredient n'est plus utilisé (remplacé par poids_net / poids_brut)
        DB::statement('ALTER TABLE ligne_fiche_technique MODIFY quantite_ingredient DECIMAL(10,2) NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        Schema::dropIfExists('entree_recette');

        Schema::table('ligne_fiche_technique', function (Blueprint $table) {
            $table->dropColumn(['rendement', 'poids_net', 'poids_brut', 'rendement_apres_cuisson']);
        });

        Schema::table('fiche_technique', function (Blueprint $table) {
            $table->dropColumn(['poids_portion', 'prix_kg']);
        });
    }
};
