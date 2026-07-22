<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partenaire extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type',
        'type_client',
        'code_iata',
        'nom',
        'adresse',
        'telephone',
        'email',
        'identifiant_fiscal',
        'id_ville',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    // Relations
    public function ville()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function produits()
    {
        return $this->hasMany(Produit::class, 'id_partenaire_principal');
    }

    public function bonCommandes()
    {
        return $this->hasMany(BonCommande::class, 'id_partenaire');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('email', 'LIKE', "%{$search}%")
                     ->orWhere('telephone', 'LIKE', "%{$search}%")
                     ->orWhere('identifiant_fiscal', 'LIKE', "%{$search}%");
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByTypeClient($query, $typeClient)
    {
        return $query->where('type_client', $typeClient);
    }
}