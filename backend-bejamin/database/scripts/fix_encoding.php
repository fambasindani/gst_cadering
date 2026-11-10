<?php

/**
 * Répare les données doublement encodées (UTF-8 interprété en latin1),
 * typiquement après un import SQL avec le mauvais charset.
 *
 * Détection fiable : présence des octets UTF-8 de "Ã" (C3 83) dans la valeur.
 * (un LIKE '%Ã%' serait accent-insensible avec utf8mb4_unicode_ci)
 *
 * Usage : php database/scripts/fix_encoding.php
 */

require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$dbName = DB::connection()->getDatabaseName();
echo "Base : {$dbName}\n";

$tables = DB::select('SHOW TABLES');
$key = 'Tables_in_' . $dbName;

$totalFixed = 0;

foreach ($tables as $row) {
    $table = $row->$key ?? array_values((array) $row)[0];

    $columns = DB::select("SHOW COLUMNS FROM `{$table}`");
    $textColumns = [];
    foreach ($columns as $col) {
        if (preg_match('/char|text/i', $col->Type)) {
            $textColumns[] = $col->Field;
        }
    }

    foreach ($textColumns as $column) {
        $affected = DB::table($table)
            ->whereRaw("HEX(`{$column}`) LIKE '%C383%'")
            ->count();

        if ($affected <= 0) {
            continue;
        }

        DB::statement(
            "UPDATE `{$table}` SET `{$column}` = COALESCE(CONVERT(BINARY(CONVERT(`{$column}` USING latin1)) USING utf8mb4), `{$column}`) WHERE HEX(`{$column}`) LIKE '%C383%'"
        );

        echo "  {$table}.{$column} : {$affected} ligne(s) corrigée(s)\n";
        $totalFixed += $affected;
    }
}

echo "Terminé. Lignes corrigées : {$totalFixed}\n";
