<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Renommer id_ville -> id_magasin (les FK suivent automatiquement)
        foreach ([
            'departements', 'utilisateurs', 'partenaires', 'lots', 'periode_inventaire',
            'retour', 'inventaire', 'fiche_technique',
        ] as $table) {
            $this->renameColumn($table, 'id_ville', 'id_magasin');
        }

        // 2. bon_commande : id_ville_destination -> id_magasin_destination
        $this->renameColumn('bon_commande', 'id_ville_destination', 'id_magasin_destination');

        // 3. Renommer la table villes -> magasins (les FK des autres tables suivent)
        if ($this->tableExists('villes') && !$this->tableExists('magasins')) {
            DB::statement('RENAME TABLE villes TO magasins');
        }

        // 4. Supprimer les zones / emplacements (colonnes + FK) des lots
        $this->dropForeignKeyAndColumn('lots', 'id_zone');
        $this->dropForeignKeyAndColumn('lots', 'id_emplacement');

        // 5. utilisateurs
        $this->dropForeignKeyAndColumn('utilisateurs', 'id_zone');
        $this->dropForeignKeyAndColumn('utilisateurs', 'id_emplacement');

        // 6. retour
        $this->dropForeignKeyAndColumn('retour', 'id_zone_provenance');
        $this->dropForeignKeyAndColumn('retour', 'id_emplacement_provenance');
        $this->dropForeignKeyAndColumn('retour', 'id_zone_dest');
        $this->dropForeignKeyAndColumn('retour', 'id_emplacement_dest');

        // 7. Supprimer les tables zones et emplacements
        Schema::dropIfExists('emplacements');
        Schema::dropIfExists('zones');
    }

    public function down(): void
    {
        // 1. Renommer la table magasins -> villes (les FK des autres tables suivent)
        if ($this->tableExists('magasins') && !$this->tableExists('villes')) {
            DB::statement('RENAME TABLE magasins TO villes');
        }

        // 2. Recréer zones et emplacements
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->foreignId('id_ville')->constrained('villes')->onDelete('cascade');
            $table->enum('type_zone', ['production', 'stockage', 'service', 'hygiene'])->default('stockage');
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('id_ville');
            $table->index('actif');
            $table->index(['id_ville', 'actif']);
            $table->index('type_zone');
        });

        Schema::create('emplacements', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->foreignId('id_zone')->constrained('zones')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('id_zone');
            $table->index('actif');
            $table->index(['id_zone', 'actif']);
        });

        // 2. Ré-ajouter les colonnes zone/emplacement dans lots
        Schema::table('lots', function (Blueprint $table) {
            $table->foreignId('id_zone')->nullable()->after('id_magasin')
                  ->constrained('zones', 'id')->onDelete('restrict');
            $table->foreignId('id_emplacement')->nullable()->after('id_zone')
                  ->constrained('emplacements', 'id')->onDelete('set null');
        });

        // 3. utilisateurs
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->foreignId('id_zone')->nullable()->after('id_departement')
                  ->constrained('zones', 'id')->onDelete('set null');
            $table->foreignId('id_emplacement')->nullable()->after('id_zone')
                  ->constrained('emplacements', 'id')->onDelete('set null');
        });

        // 4. retour
        Schema::table('retour', function (Blueprint $table) {
            $table->foreignId('id_zone_provenance')->nullable()
                  ->constrained('zones', 'id')->onDelete('set null');
            $table->foreignId('id_emplacement_provenance')->nullable()
                  ->constrained('emplacements', 'id')->onDelete('set null');
            $table->foreignId('id_zone_dest')->nullable()
                  ->constrained('zones', 'id')->onDelete('set null');
            $table->foreignId('id_emplacement_dest')->nullable()
                  ->constrained('emplacements', 'id')->onDelete('set null');
        });

        // 5. Renommer id_magasin -> id_ville
        foreach ([
            'departements', 'utilisateurs', 'partenaires', 'lots', 'periode_inventaire',
            'retour', 'inventaire', 'fiche_technique',
        ] as $table) {
            $this->renameColumn($table, 'id_magasin', 'id_ville');
        }
        $this->renameColumn('bon_commande', 'id_magasin_destination', 'id_ville_destination');
    }

    private function renameColumn(string $table, string $from, string $to): void
    {
        if ($this->columnExists($table, $from)) {
            DB::statement("ALTER TABLE `$table` RENAME COLUMN `$from` TO `$to`");
        }
    }

    private function dropForeignKeyAndColumn(string $table, string $column): void
    {
        if (!$this->columnExists($table, $column)) {
            return;
        }
        $rows = DB::select(
            'SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
               AND REFERENCED_TABLE_NAME IS NOT NULL',
            [$table, $column]
        );
        foreach ($rows as $row) {
            DB::statement("ALTER TABLE `$table` DROP FOREIGN KEY `{$row->name}`");
        }
        DB::statement("ALTER TABLE `$table` DROP COLUMN `$column`");
    }

    private function columnExists(string $table, string $column): bool
    {
        return (bool) DB::selectOne(
            'SELECT COUNT(*) AS c FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$table, $column]
        )->c;
    }

    private function tableExists(string $table): bool
    {
        return (bool) DB::selectOne(
            'SELECT COUNT(*) AS c FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
            [$table]
        )->c;
    }
};
