<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Emplacement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nom',
        'id_zone',
        'description',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class, 'id_zone');
    }

    public function lots()
    {
        return $this->hasMany(Lot::class, 'id_emplacement');
    }

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%");
    }

    public function scopeByZone($query, $zoneId)
    {
        return $query->where('id_zone', $zoneId);
    }
}