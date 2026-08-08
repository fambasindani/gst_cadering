<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MouvementStock extends Model
{
    use SoftDeletes;

    protected $table = 'mouvement_stock';

    protected $fillable = [
        'id_lot',
        'id_type_mouvement',
        'id_partenaire',
        'id_magasin',
        'id_departement',
        'quantite',
        'date_mouvement',
        'id_utilisateur',
        'reference_document',
        'reference_reception',
        'commentaire',
        'id_periode_inventaire',
        'valide_par',
        'date_validation',
        'statut_validation'
    ];

    protected $casts = [
        'quantite' => 'integer',
        'date_mouvement' => 'datetime',
        'date_validation' => 'datetime',
    ];

    // Relations
    public function lot()
    {
        return $this->belongsTo(Lot::class, 'id_lot');
    }

    public function typeMouvement()
    {
        return $this->belongsTo(TypeMouvement::class, 'id_type_mouvement');
    }

    public function partenaire()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire');
    }

    public function magasin()
    {
        return $this->belongsTo(Magasin::class, 'id_magasin');
    }

    public function departement()
    {
        return $this->belongsTo(Departement::class, 'id_departement');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public function validePar()
    {
        return $this->belongsTo(Utilisateur::class, 'valide_par');
    }

    // ✅ Correction : Utiliser un nullable si la table n'existe pas encore
    public function periodeInventaire()
    {
        return $this->belongsTo(PeriodeInventaire::class, 'id_periode_inventaire');
    }

    // Scopes
    public function scopeByLot($query, $lotId)
    {
        return $query->where('id_lot', $lotId);
    }

    public function scopeByType($query, $typeId)
    {
        return $query->where('id_type_mouvement', $typeId);
    }

    public function scopeValide($query)
    {
        return $query->where('statut_validation', 'VALIDÉ');
    }

    public function scopeEnAttente($query)
    {
        return $query->where('statut_validation', 'EN ATTENTE');
    }

    // Méthodes
    public function getSens()
    {
        return $this->typeMouvement->sens ?? 1;
    }

    public function isEntree()
    {
        return $this->getSens() === 1;
    }

    public function isSortie()
    {
        return $this->getSens() === -1;
    }
}