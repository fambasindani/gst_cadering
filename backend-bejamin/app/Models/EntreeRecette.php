<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EntreeRecette extends Model
{
    use SoftDeletes;

    protected $table = 'entree_recette';

    protected $fillable = [
        'id_fiche_technique',
        'id_partenaire',
        'nombre_passages',
        'date_production',
        'commentaire',
        'id_utilisateur'
    ];

    protected $casts = [
        'nombre_passages' => 'integer',
        'date_production' => 'date',
    ];

    public function ficheTechnique()
    {
        return $this->belongsTo(FicheTechnique::class, 'id_fiche_technique');
    }

    public function partenaire()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
}
