<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unite extends Model
{
    use SoftDeletes;

    // ✅ Pas besoin de redéfinir $primaryKey avec 'id'

    protected $fillable = [
        'nom',
        'symbole',
        'description',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('symbole', 'LIKE', "%{$search}%");
    }
}