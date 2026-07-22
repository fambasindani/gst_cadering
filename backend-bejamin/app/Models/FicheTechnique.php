<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FicheTechnique extends Model
{
    use SoftDeletes;

    protected $table = 'fiche_technique';

    protected $fillable = [
        'code',
        'nom',
        'description',
        'id_produit_fini',
        'rendement',
        'id_ville',
        'cout_total',
        'cout_unitaire',
        'actif'
    ];

    protected $casts = [
        'rendement' => 'integer',
        'cout_total' => 'decimal:2',
        'cout_unitaire' => 'decimal:2',
        'actif' => 'boolean',
    ];

    public function produitFini()
    {
        return $this->belongsTo(Produit::class, 'id_produit_fini');
    }

    public function ville()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function lignes()
    {
        return $this->hasMany(LigneFicheTechnique::class, 'id_fiche_technique');
    }

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('code', 'LIKE', "%{$search}%")
                     ->orWhere('nom', 'LIKE', "%{$search}%");
    }

    public function scopeByVille($query, $villeId)
    {
        return $query->where('id_ville', $villeId);
    }

    public function getCoutTotal()
    {
        return $this->lignes->sum('cout_total');
    }

    public function getCoutUnitaire()
    {
        if ($this->rendement > 0) {
            return $this->cout_total / $this->rendement;
        }
        return 0;
    }

    public function updateCouts()
    {
        $this->cout_total = $this->getCoutTotal();
        $this->cout_unitaire = $this->getCoutUnitaire();
        $this->save();
    }
}