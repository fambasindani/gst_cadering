<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SuiviChlore extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'suivis_chlore';

    protected $fillable = [
        'id_utilisateur',
        'id_partenaire',
        'id_lot',
        'date_operation',
        'concentration_ppm',
        'temps_trempage_minutes',
        'commentaire_action_corrective',
    ];

    protected $casts = [
        'date_operation' => 'date',
        'concentration_ppm' => 'float',
        'temps_trempage_minutes' => 'integer',
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
            $q->where('commentaire_action_corrective', 'like', "%{$search}%")
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
