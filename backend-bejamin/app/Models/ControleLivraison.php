<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ControleLivraison extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'controles_livraisons';

    protected $fillable = [
        'id_utilisateur',
        'id_partenaire',
        'id_lot',
        'date_operation',
        'cie_numero_vol',
        'camion_propre',
        'heure_debut',
        'heure_fin',
        'code_prestation_classe',
        'code_couleur',
        'final_holding_temperature',
        'reception_client_temperature',
        'commentaires',
        'nom_signature_superviseur',
        'nom_signature_responsable_client',
        'remarque_generale',
    ];

    protected $casts = [
        'date_operation' => 'date',
        'camion_propre' => 'boolean',
        'heure_debut' => 'datetime:H:i',
        'heure_fin' => 'datetime:H:i',
        'final_holding_temperature' => 'float',
        'reception_client_temperature' => 'float',
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
            $q->where('cie_numero_vol', 'like', "%{$search}%")
                ->orWhere('commentaires', 'like', "%{$search}%")
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
