<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Facture extends Model
{
    use SoftDeletes;

    // ✅ Ajouter cette ligne pour spécifier le nom exact de la table
    protected $table = 'facture';

    protected $fillable = [
        'numero_facture',
        'date_facture',
        'date_echeance',
        'id_partenaire_client',
        'id_bon_commande',
        'id_ville',
        'id_devise',
        'montant_ht',
        'montant_ttc',
        'id_utilisateur',
        'statut',
        'commentaire'
    ];

    protected $casts = [
        'date_facture' => 'date',
        'date_echeance' => 'date',
        'montant_ht' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire_client');
    }

    public function bonCommande()
    {
        return $this->belongsTo(BonCommande::class, 'id_bon_commande');
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
        return $this->hasMany(LigneFacture::class, 'id_facture');
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'id_facture');
    }

    public function avoirs()
    {
        return $this->hasMany(Avoir::class, 'id_facture_origine');
    }

    public function getTotalPaye()
    {
        return $this->paiements->sum('montant');
    }

    public function getSolde()
    {
        return $this->montant_ttc - $this->getTotalPaye();
    }

    public function isPayee()
    {
        return $this->getSolde() <= 0;
    }
}