<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Produit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code_article',
        'code_barre',
        'nom',
        'description',
        'id_categorie',
        'id_partenaire_principal',
        'id_unite',
        'seuil_alerte',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
        'seuil_alerte' => 'integer',
    ];

    // Relations
    public function categorie()
    {
        return $this->belongsTo(Categorie::class, 'id_categorie');
    }

    public function partenairePrincipal()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire_principal');
    }

    public function unite()
    {
        return $this->belongsTo(Unite::class, 'id_unite');
    }

    public function historiquePrix()
    {
        return $this->hasMany(HistoriquePrix::class, 'id_produit');
    }

    public function lots()
    {
        return $this->hasMany(Lot::class, 'id_produit');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('code_article', 'LIKE', "%{$search}%")
                     ->orWhere('code_barre', 'LIKE', "%{$search}%")
                     ->orWhere('description', 'LIKE', "%{$search}%");
    }

    public function scopeByCategorie($query, $categorieId)
    {
        return $query->where('id_categorie', $categorieId);
    }

    // Méthodes
    public function getDernierPrixAchat()
    {
        return $this->historiquePrix()
                    ->whereNotNull('prix_achat_ht')
                    ->orderBy('date_application', 'desc')
                    ->first();
    }

    public function getStockTotal()
    {
        return $this->lots()->sum('quantite_disponible');
    }

    public function getStockParMagasin($magasinId)
    {
        return $this->lots()
                    ->where('id_magasin', $magasinId)
                    ->sum('quantite_disponible');
    }
}