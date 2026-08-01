<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inventaire extends Model
{
    use SoftDeletes;

    protected $table = 'inventaire';

    protected $fillable = [
        'id_periode_inventaire',
        'id_produit',
        'id_magasin',
        'stock_theorique',
        'stock_physique_compte',
        'date_saisie',
        'id_utilisateur',
        'commentaire'
    ];

    protected $casts = [
        'stock_theorique' => 'integer',
        'stock_physique_compte' => 'integer',
        'ecart' => 'integer',
        'date_saisie' => 'datetime',
    ];

    // Relations
    public function periodeInventaire()
    {
        return $this->belongsTo(PeriodeInventaire::class, 'id_periode_inventaire');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }

    public function magasin()
    {
        return $this->belongsTo(Magasin::class, 'id_magasin');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    // Scopes
    public function scopeByPeriode($query, $periodeId)
    {
        return $query->where('id_periode_inventaire', $periodeId);
    }

    public function scopeByProduit($query, $produitId)
    {
        return $query->where('id_produit', $produitId);
    }

    public function scopeByMagasin($query, $magasinId)
    {
        return $query->where('id_magasin', $magasinId);
    }
}