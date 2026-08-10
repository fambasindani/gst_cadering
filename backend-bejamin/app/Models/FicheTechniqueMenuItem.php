<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FicheTechniqueMenuItem extends Model
{
    protected $table = 'fiche_technique_menu_item';

    protected $fillable = [
        'id_partie',
        'id_fiche_technique',
        'id_produit',
        'id_partenaire',
        'designation',
        'pourcentage',
        'ordre'
    ];

    protected $casts = [
        'pourcentage' => 'decimal:2',
        'ordre' => 'integer',
    ];

    public function partie()
    {
        return $this->belongsTo(FicheTechniqueMenuPartie::class, 'id_partie');
    }

    public function ficheTechnique()
    {
        return $this->belongsTo(FicheTechnique::class, 'id_fiche_technique');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }

    public function partenaire()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire');
    }
}
