<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['utilisateurs', 'notifications', 'fiche_technique_menu_item'] as $table) {
            $hasColumn = DB::selectOne(
                "SELECT COUNT(*) AS c FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'deleted_at'",
                [$table]
            )->c;

            if (!$hasColumn && Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $tbl) use ($table) {
                    $tbl->softDeletes();
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['utilisateurs', 'notifications', 'fiche_technique_menu_item'] as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $tbl) {
                    $tbl->dropColumn('deleted_at');
                });
            }
        }
    }
};
