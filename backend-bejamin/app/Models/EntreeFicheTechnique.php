<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EntreeFicheTechnique extends Model
{
    use SoftDeletes;

    protected $table = 'entree_fiche_technique';

    protected $fillable = [
        'id_fiche_technique_menu',
        'id_partenaire',
        'nombre_passagers',
        'date_rapport',
        'commentaire',
        'id_utilisateur'
    ];

    protected $casts = [
        'nombre_passagers' => 'integer',
        'date_rapport' => 'date',
    ];

    public function menu()
    {
        return $this->belongsTo(FicheTechniqueMenu::class, 'id_fiche_technique_menu');
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
