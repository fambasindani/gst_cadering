<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Retour extends Model
{
    use SoftDeletes;

    protected $table = 'retour';

    protected $fillable = [
        'numero_retour',
        'date_retour',
        'id_partenaire_client',
        'id_partenaire_dest',
        'id_magasin',
        'id_utilisateur',
        'commentaire',
        'valide_par',
        'date_validation',
        'statut_validation'
    ];

    protected $casts = [
        'date_retour' => 'date',
        'date_validation' => 'datetime',
    ];

    // Relations
    public function partenaireClient()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire_client');
    }

    public function partenaireDest()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire_dest');
    }

    public function magasin()
    {
        return $this->belongsTo(Magasin::class, 'id_magasin');
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
        return $this->hasMany(LigneRetour::class, 'id_retour');
    }

    // Scopes
    public function scopeSearch($query, $search)
    {
        return $query->where('numero_retour', 'LIKE', "%{$search}%");
    }

    public function scopeByMagasin($query, $magasinId)
    {
        return $query->where('id_magasin', $magasinId);
    }

    public function scopeByStatut($query, $statut)
    {
        return $query->where('statut_validation', $statut);
    }

    // Méthodes
    public function getTotalQuantite()
    {
        return $this->lignes->sum('quantite_retournee');
    }

    public function getProvenanceLibelle()
    {
        if ($this->id_partenaire_client) {
            return 'Client: ' . $this->partenaireClient->nom;
        }
        return 'Non spécifié';
    }

    public function getDestinationLibelle()
    {
        if ($this->id_partenaire_dest) {
            return 'Fournisseur: ' . $this->partenaireDest->nom;
        }
        return 'Non spécifié';
    }
}