<?php

namespace App\Helpers;

use Illuminate\Support\Facades\DB;

class CodeGenerator
{
    public static function generate(string $table, string $column, string $prefix, int $padLength = 4): string
    {
        $year = date('y');
        $month = date('m');
        $pattern = "{$prefix}-{$year}{$month}-";

        $last = DB::table($table)
            ->where($column, 'LIKE', "{$pattern}%")
            ->orderBy($column, 'desc')
            ->value($column);

        if ($last) {
            $parts = explode('-', $last);
            $num = (int) end($parts) + 1;
        } else {
            $num = 1;
        }

        return "{$prefix}-{$year}{$month}-" . str_pad($num, $padLength, '0', STR_PAD_LEFT);
    }

    public static function produit(): string
    {
        return self::generate('produits', 'code_article', 'PROD');
    }

    public static function bonCommande(): string
    {
        return self::generate('bon_commande', 'numero_commande', 'BC');
    }

    public static function lot(): string
    {
        return self::generate('lots', 'numero_lot', 'LOT');
    }

    public static function avoir(): string
    {
        return self::generate('avoir', 'numero_avoir', 'AV');
    }

    public static function retour(): string
    {
        return self::generate('retour', 'numero_retour', 'RET');
    }

    public static function ficheTechnique(): string
    {
        return self::generate('fiche_technique', 'code', 'FT');
    }
}
