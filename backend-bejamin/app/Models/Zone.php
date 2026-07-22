<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zone extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nom',
        'id_ville',
        'type_zone',
        'description',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function ville()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function emplacements()
    {
        return $this->hasMany(Emplacement::class, 'id_zone');
    }

    public function lots()
    {
        return $this->hasMany(Lot::class, 'id_zone');
    }

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('type_zone', 'LIKE', "%{$search}%");
    }

    public function scopeByVille($query, $villeId)
    {
        return $query->where('id_ville', $villeId);
    }
}