<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PeriodeInventaire extends Model
{
    use SoftDeletes;

    protected $table = 'periode_inventaire';

    protected $fillable = [
        'libelle',
        'date_debut',
        'date_fin',
        'statut',
        'id_ville',
        'description'
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    // Relations
    public function ville()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function inventaires()
    {
        return $this->hasMany(Inventaire::class, 'id_periode_inventaire');
    }

    // Scopes
    public function scopeEnCours($query)
    {
        return $query->where('statut', 'EN_COURS');
    }

    public function scopeCloture($query)
    {
        return $query->where('statut', 'CLOTURE');
    }

    public function scopeByVille($query, $villeId)
    {
        return $query->where('id_ville', $villeId);
    }

    // Méthodes
    public function isEnCours()
    {
        return $this->statut === 'EN_COURS';
    }

    public function isCloture()
    {
        return $this->statut === 'CLOTURE';
    }

    public function getTotalEcart()
    {
        return $this->inventaires()->sum('ecart');
    }
}