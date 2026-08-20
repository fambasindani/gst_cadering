<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProduitMagasin extends Model
{
    protected $table = 'produit_magasin';

    protected $fillable = [
        'id_produit',
        'id_magasin',
        'seuil_alerte',
    ];

    protected $casts = [
        'seuil_alerte' => 'integer',
    ];

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }

    public function magasin()
    {
        return $this->belongsTo(Magasin::class, 'id_magasin');
    }
}
