<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LigneDevis extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'id_devis',
        'id_produit',
        'quantite',
        'prix_unitaire_ht',
        'remise'
    ];

    protected $casts = [
        'quantite' => 'integer',
        'prix_unitaire_ht' => 'decimal:2',
        'remise' => 'decimal:2',
        'montant_ht' => 'decimal:2',
    ];

    public function devis()
    {
        return $this->belongsTo(Devis::class, 'id_devis');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }
}