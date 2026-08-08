<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TauxConversion extends Model
{
    use SoftDeletes;

    protected $table = 'taux_conversion';

    protected $fillable = [
        'code_devise',
        'nom',
        'taux',
        'date_application',
        'actif'
    ];

    protected $casts = [
        'taux' => 'float',
        'date_application' => 'date',
        'actif' => 'boolean',
    ];

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('code_devise', 'LIKE', "%{$search}%")
                     ->orWhere('nom', 'LIKE', "%{$search}%")
                     ->orWhere('taux', 'LIKE', "%{$search}%");
    }

    /**
     * Taux le plus récent (≤ date donnée) pour une devise.
     */
    public static function tauxPourDate(?string $dateApplication = null, string $codeDevise = 'CDF'): ?float
    {
        $query = self::where('code_devise', $codeDevise)
            ->where('actif', true)
            ->where('deleted_at', null);

        if ($dateApplication) {
            $query->where('date_application', '<=', $dateApplication);
        }

        $taux = $query->orderBy('date_application', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        return $taux ? (float) $taux->taux : null;
    }

    /**
     * Convertit un montant en devise de base (USD) vers la devise locale (CDF).
     * Retourne null si aucun taux n'est disponible.
     */
    public static function convertirEnCdf(float $montantUsd, ?string $dateApplication = null): ?float
    {
        $taux = self::tauxPourDate($dateApplication);
        if ($taux === null) {
            return null;
        }
        return round($montantUsd * $taux, 2);
    }
}
