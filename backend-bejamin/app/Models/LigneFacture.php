<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LigneFacture extends Model
{
    use SoftDeletes;

    // ✅ Ajouter cette ligne
    protected $table = 'ligne_facture';

    protected $fillable = [
        'id_facture',
        'id_produit',
        'id_lot',
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

    public function facture()
    {
        return $this->belongsTo(Facture::class, 'id_facture');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }

    public function lot()
    {
        return $this->belongsTo(Lot::class, 'id_lot');
    }
}