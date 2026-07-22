<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ville extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nom',
        'code',
        'pays',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function departements()
    {
        return $this->hasMany(Departement::class, 'id_ville');
    }

    public function zones()
    {
        return $this->hasMany(Zone::class, 'id_ville');
    }

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('code', 'LIKE', "%{$search}%")
                     ->orWhere('pays', 'LIKE', "%{$search}%");
    }
}