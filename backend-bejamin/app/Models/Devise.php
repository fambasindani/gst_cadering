<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Devise extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'nom',
        'symbole',
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
        return $query->where('code', 'LIKE', "%{$search}%")
                     ->orWhere('nom', 'LIKE', "%{$search}%")
                     ->orWhere('symbole', 'LIKE', "%{$search}%");
    }
}