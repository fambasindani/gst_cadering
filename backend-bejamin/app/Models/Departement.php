<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Departement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nom',
        'code',
        'id_magasin',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function magasin()
    {
        return $this->belongsTo(Magasin::class, 'id_magasin');
    }

    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_departement');
    }

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('code', 'LIKE', "%{$search}%");
    }

    public function scopeByMagasin($query, $magasinId)
    {
        return $query->where('id_magasin', $magasinId);
    }
}