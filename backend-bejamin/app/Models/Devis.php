<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Devis extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'numero_devis',
        'date_devis',
        'date_validite',
        'id_partenaire_client',
        'id_ville',
        'id_devise',
        'montant_ht',
        'id_utilisateur',
        'statut',
        'commentaire'
    ];

    protected $casts = [
        'date_devis' => 'date',
        'date_validite' => 'date',
        'montant_ht' => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire_client');
    }

    public function ville()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function devise()
    {
        return $this->belongsTo(Devise::class, 'id_devise');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public function lignes()
    {
        return $this->hasMany(LigneDevis::class, 'id_devis');
    }

    public function getTotal()
    {
        return $this->lignes->sum('montant_ht');
    }
}