<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BonCommande extends Model
{
    use SoftDeletes;

    protected $table = 'bon_commande';

    protected $fillable = [
        'numero_commande',
        'id_partenaire',
        'id_magasin_destination',
        'date_commande',
        'date_livraison_prevue',
        'statut',
        'montant_total_ht',
        'id_devise',
        'id_utilisateur',
        'commentaire',
        'valide_par',
        'date_validation',
        'statut_validation'
    ];

    protected $casts = [
        'date_commande' => 'date',
        'date_livraison_prevue' => 'date',
        'date_validation' => 'datetime',
        'montant_total_ht' => 'decimal:2',
    ];

    // Relations
    public function partenaire()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire');
    }

    public function magasinDestination()
    {
        return $this->belongsTo(Magasin::class, 'id_magasin_destination');
    }

    public function devise()
    {
        return $this->belongsTo(Devise::class, 'id_devise');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public function validePar()
    {
        return $this->belongsTo(Utilisateur::class, 'valide_par');
    }

    public function lignes()
    {
        return $this->hasMany(LigneCommande::class, 'id_bon_commande');
    }

    // Scopes
    public function scopeSearch($query, $search)
    {
        return $query->where('numero_commande', 'LIKE', "%{$search}%")
                     ->orWhereHas('partenaire', function($q) use ($search) {
                         $q->where('nom', 'LIKE', "%{$search}%");
                     });
    }

    public function scopeByStatut($query, $statut)
    {
        if (str_contains($statut, ',')) {
            $statuts = array_map('trim', explode(',', $statut));
            return $query->whereIn('statut', $statuts);
        }
        return $query->where('statut', $statut);
    }

    public function scopeByMagasin($query, $magasinId)
    {
        return $query->where('id_magasin_destination', $magasinId);
    }

    public function scopeByPartenaire($query, $partenaireId)
    {
        return $query->where('id_partenaire', $partenaireId);
    }

    // Méthodes
    public function getTotalCommande()
    {
        return $this->lignes->sum(function($ligne) {
            return $ligne->quantite_commandee * $ligne->prix_unitaire_ht;
        });
    }

    public function getTotalRecu()
    {
        return $this->lignes->sum(function($ligne) {
            return $ligne->quantite_recue * $ligne->prix_unitaire_ht;
        });
    }

    public function isComplete()
    {
        foreach ($this->lignes as $ligne) {
            if ($ligne->quantite_recue < $ligne->quantite_commandee) {
                return false;
            }
        }
        return true;
    }

    public function getStatutLibelle()
    {
        $statuts = [
            'BROUILLON' => 'Brouillon',
            'ENVOYÉ' => 'Envoyé',
            'REÇU PARTIELLEMENT' => 'Reçu partiellement',
            'REÇU' => 'Reçu',
            'ANNULE' => 'Annulé'
        ];
        return $statuts[$this->statut] ?? $this->statut;
    }
}