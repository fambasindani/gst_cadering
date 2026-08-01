<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HistoriquePrix extends Model
{
    use SoftDeletes;

    protected $table = 'historique_prix';

    protected $fillable = [
        'id_produit',
        'prix_achat_ht',
        'id_devise',
        'date_application',
        'commentaire',
        'id_utilisateur'
    ];

    protected $casts = [
        'prix_achat_ht' => 'decimal:2',
        'date_application' => 'date',
    ];

    // Relations
    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }

    public function devise()
    {
        return $this->belongsTo(Devise::class, 'id_devise');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    // Scopes
    public function scopeByProduit($query, $produitId)
    {
        return $query->where('id_produit', $produitId);
    }

    public function scopeByDate($query, $date)
    {
        return $query->where('date_application', $date);
    }
}