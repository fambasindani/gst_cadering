<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Retirer la FK + colonne id_facture de mouvement_stock
        if ($this->columnExists('mouvement_stock', 'id_facture')) {
            $this->dropForeignKey('mouvement_stock', 'id_facture');
            DB::statement('ALTER TABLE `mouvement_stock` DROP COLUMN `id_facture`');
        }

        // 2. Retirer la FK + colonne id_facture_origine de avoir
        if ($this->columnExists('avoir', 'id_facture_origine')) {
            $this->dropForeignKey('avoir', 'id_facture_origine');
            DB::statement('ALTER TABLE `avoir` DROP COLUMN `id_facture_origine`');
        }

        // 3. Supprimer les tables facture, ligne_facture, paiement
        Schema::dropIfExists('ligne_facture');
        Schema::dropIfExists('paiement');
        Schema::dropIfExists('facture');
    }

    public function down(): void
    {
        // Non restauré (fonctionnalités supprimées définitivement)
    }

    private function columnExists(string $table, string $column): bool
    {
        return (bool) DB::selectOne(
            'SELECT COUNT(*) AS c FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$table, $column]
        )->c;
    }

    private function dropForeignKey(string $table, string $column): void
    {
        $rows = DB::select(
            'SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
               AND REFERENCED_TABLE_NAME IS NOT NULL',
            [$table, $column]
        );
        foreach ($rows as $row) {
            DB::statement("ALTER TABLE `$table` DROP FOREIGN KEY `{$row->name}`");
        }
    }
};
