<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AtelierTracabilite extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ateliers_tracabilites';

    protected $fillable = [
        'id_utilisateur',
        'id_partenaire',
        'id_lot',
        'type_atelier',
        'date_operation',
        'temperature_atelier',
        'code_prestation',
        'quantite',
        'produits_utilises',
        'code_couleur_produit_dlc',
        'cycle_classe',
        'heure_debut',
        'temperature_surface_debut',
        'heure_fin',
        'temperature_surface_fin',
        'action_corrective',
    ];

    protected $casts = [
        'date_operation' => 'date',
        'temperature_atelier' => 'float',
        'temperature_surface_debut' => 'float',
        'temperature_surface_fin' => 'float',
        'heure_debut' => 'datetime:H:i',
        'heure_fin' => 'datetime:H:i',
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
            $q->where('code_prestation', 'like', "%{$search}%")
                ->orWhere('produits_utilises', 'like', "%{$search}%")
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
