<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tracabilite extends Model
{
    use SoftDeletes;

    protected $table = 'tracabilite';

    protected $fillable = [
        'numero_tracabilite',
        'id_lot',
        'id_utilisateur',
        'id_departement',
        'id_partenaire',
        'quantite',
        'commentaire',
        'date_tracabilite',
    ];

    protected $casts = [
        'quantite' => 'integer',
        'date_tracabilite' => 'date',
    ];

    // Relations
    public function lot()
    {
        return $this->belongsTo(Lot::class, 'id_lot');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public function departement()
    {
        return $this->belongsTo(Departement::class, 'id_departement');
    }

    public function partenaire()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire');
    }

    // Scopes
    public function scopeSearch($query, $search)
    {
        return $query->where('numero_tracabilite', 'LIKE', "%{$search}%")
            ->orWhereHas('lot', fn($q) => $q->where('numero_lot', 'LIKE', "%{$search}%"))
            ->orWhereHas('lot.produit', fn($q) => $q->where('nom', 'LIKE', "%{$search}%"))
            ->orWhereHas('utilisateur', fn($q) => $q->where('full_name', 'LIKE', "%{$search}%"));
    }

    public function scopeByUtilisateur($query, $utilisateurId)
    {
        return $query->where('id_utilisateur', $utilisateurId);
    }

    public function scopeByDateDebut($query, $date)
    {
        return $query->whereDate('date_tracabilite', '>=', $date);
    }

    public function scopeByDateFin($query, $date)
    {
        return $query->whereDate('date_tracabilite', '<=', $date);
    }
}
