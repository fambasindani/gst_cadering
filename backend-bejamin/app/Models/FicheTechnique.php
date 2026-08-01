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
        'poids_portion',
        'unite_poids_portion',
        'id_magasin',
        'cout_total',
        'cout_unitaire',
        'prix_kg',
        'actif'
    ];

    protected $casts = [
        'rendement' => 'integer',
        'poids_portion' => 'float',
        'cout_total' => 'decimal:2',
        'cout_unitaire' => 'decimal:2',
        'prix_kg' => 'decimal:2',
        'actif' => 'boolean',
    ];

    public function produitFini()
    {
        return $this->belongsTo(Produit::class, 'id_produit_fini');
    }

    public function magasin()
    {
        return $this->belongsTo(Magasin::class, 'id_magasin');
    }

    public function lignes()
    {
        return $this->hasMany(LigneFicheTechnique::class, 'id_fiche_technique');
    }

    public function entreeRecettes()
    {
        return $this->hasMany(EntreeRecette::class, 'id_fiche_technique');
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

    public function scopeByMagasin($query, $magasinId)
    {
        return $query->where('id_magasin', $magasinId);
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

    public function getPrixKg()
    {
        $poidsTotal = $this->lignes->sum('poids_net');
        if ($poidsTotal > 0) {
            return $this->cout_total / $poidsTotal;
        }
        return 0;
    }

    public function updateCouts()
    {
        $this->cout_total = $this->getCoutTotal();
        $this->cout_unitaire = $this->getCoutUnitaire();
        $this->prix_kg = $this->getPrixKg();
        $this->save();
    }
}
