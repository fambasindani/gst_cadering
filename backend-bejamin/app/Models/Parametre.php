<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Parametre extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'cle',
        'valeur',
        'description',
        'type',
        'est_modifiable',
        'actif',
    ];

    protected $casts = [
        'est_modifiable' => 'boolean',
        'actif' => 'boolean',
    ];

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('cle', 'LIKE', "%{$search}%")
                     ->orWhere('description', 'LIKE', "%{$search}%")
                     ->orWhere('valeur', 'LIKE', "%{$search}%");
    }

    public static function getValeur(string $cle, $defaut = null)
    {
        $p = static::where('cle', $cle)->where('actif', true)->first();
        return $p ? $p->valeur : $defaut;
    }
}
