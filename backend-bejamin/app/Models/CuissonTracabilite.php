<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CuissonTracabilite extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cuissons_tracabilites';

    protected $fillable = [
        'id_utilisateur',
        'id_partenaire',
        'id_lot',
        'date_operation',
        'mise_en_decongelation',
        'code_couleur',
        'quantite_avant_cuisson',
        'quantite_apres_cuisson',
        'dlc_dluo',
        'numero_lot_cree',
        'mode_cuisson',
        'heure_fin_cuisson',
        'temperature_coeur_cuisson',
        'heure_debut_refroidissement',
        'heure_fin_refroidissement',
        'temperature_coeur_refroidissement',
    ];

    protected $casts = [
        'date_operation' => 'date',
        'heure_fin_cuisson' => 'datetime:H:i',
        'heure_debut_refroidissement' => 'datetime:H:i',
        'heure_fin_refroidissement' => 'datetime:H:i',
        'temperature_coeur_cuisson' => 'float',
        'temperature_coeur_refroidissement' => 'float',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public function partenaire()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire');
    }

    public function lot()
    {
        return $this->belongsTo(Lot::class, 'id_lot');
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('numero_lot_cree', 'like', "%{$search}%")
                ->orWhere('code_couleur', 'like', "%{$search}%")
                ->orWhere('mode_cuisson', 'like', "%{$search}%")
                ->orWhereHas('lot', function ($q2) use ($search) {
                    $q2->where('numero_lot', 'like', "%{$search}%")
                        ->orWhereHas('produit', function ($q3) use ($search) {
                            $q3->where('nom', 'like', "%{$search}%");
                        });
                })
                ->orWhereHas('partenaire', function ($q2) use ($search) {
                    $q2->where('nom', 'like', "%{$search}%");
                });
        });
    }

    public function scopeByDateDebut($query, string $date)
    {
        return $query->where('date_operation', '>=', $date);
    }

    public function scopeByDateFin($query, string $date)
    {
        return $query->where('date_operation', '<=', $date);
    }

    public function scopeByUtilisateur($query, int $userId)
    {
        return $query->where('id_utilisateur', $userId);
    }
}
