<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrixCommande extends Model
{
    protected $table = 'prix_commande';

    protected $fillable = [
        'id_produit',
        'prix_commande',
        'id_devise',
        'date',
        'origine',
        'commentaire',
    ];

    protected $casts = [
        'prix_commande' => 'decimal:4',
        'date' => 'date',
    ];

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }

    public function devise()
    {
        return $this->belongsTo(Devise::class, 'id_devise');
    }

    public function scopeByProduit($query, $produitId)
    {
        return $query->where('id_produit', $produitId);
    }

    public static function dernierPrix(int $idProduit): ?self
    {
        return static::where('id_produit', $idProduit)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->first();
    }
}
