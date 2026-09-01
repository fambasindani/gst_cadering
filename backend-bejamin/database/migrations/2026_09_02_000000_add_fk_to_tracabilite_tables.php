<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['cuissons_tracabilites', 'ateliers_tracabilites', 'suivis_chlore', 'controles_livraisons'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tbl) {
                $tbl->unsignedBigInteger('id_partenaire')->nullable()->after('id_utilisateur');
                $tbl->unsignedBigInteger('id_lot')->nullable()->after('id_partenaire');
                $tbl->foreign('id_partenaire')->references('id')->on('partenaires')->onDelete('set null');
                $tbl->foreign('id_lot')->references('id')->on('lots')->onDelete('set null');
            });
        }

        DB::statement('ALTER TABLE cuissons_tracabilites DROP COLUMN produit, DROP COLUMN nom_operateur, DROP COLUMN client, DROP COLUMN numero_lot_interne');
        DB::statement('ALTER TABLE ateliers_tracabilites DROP COLUMN nom_operateur, DROP COLUMN compagnie_client, DROP COLUMN numero_lot');
        DB::statement('ALTER TABLE suivis_chlore DROP COLUMN nom_agent, DROP COLUMN client, DROP COLUMN produits_traites, DROP COLUMN numero_lots_produits');
        DB::statement('ALTER TABLE controles_livraisons DROP COLUMN nom_agent, DROP COLUMN client, DROP COLUMN plat_produit, DROP COLUMN numero_lot');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE cuissons_tracabilites ADD COLUMN produit VARCHAR(150) NULL, ADD COLUMN nom_operateur VARCHAR(100) NULL, ADD COLUMN client VARCHAR(150) NULL, ADD COLUMN numero_lot_interne VARCHAR(100) NULL');
        DB::statement('ALTER TABLE ateliers_tracabilites ADD COLUMN nom_operateur VARCHAR(100) NULL, ADD COLUMN compagnie_client VARCHAR(150) NULL, ADD COLUMN numero_lot VARCHAR(100) NULL');
        DB::statement('ALTER TABLE suivis_chlore ADD COLUMN nom_agent VARCHAR(100) NULL, ADD COLUMN client VARCHAR(150) NULL, ADD COLUMN produits_traites VARCHAR(150) NULL, ADD COLUMN numero_lots_produits VARCHAR(150) NULL');
        DB::statement('ALTER TABLE controles_livraisons ADD COLUMN nom_agent VARCHAR(100) NULL, ADD COLUMN client VARCHAR(150) NULL, ADD COLUMN plat_produit VARCHAR(150) NULL, ADD COLUMN numero_lot VARCHAR(100) NULL');

        $tables = ['cuissons_tracabilites', 'ateliers_tracabilites', 'suivis_chlore', 'controles_livraisons'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tbl) {
                $tbl->dropForeign(['id_partenaire']);
                $tbl->dropForeign(['id_lot']);
                $tbl->dropColumn(['id_partenaire', 'id_lot']);
            });
        }
    }
};
