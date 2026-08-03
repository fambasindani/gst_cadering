<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FicheTechniqueMenuPartie extends Model
{
    protected $table = 'fiche_technique_menu_partie';

    protected $fillable = [
        'id_fiche_technique_menu',
        'nom',
        'ordre'
    ];

    protected $casts = [
        'ordre' => 'integer',
    ];

    public function menu()
    {
        return $this->belongsTo(FicheTechniqueMenu::class, 'id_fiche_technique_menu');
    }

    public function items()
    {
        return $this->hasMany(FicheTechniqueMenuItem::class, 'id_partie')
            ->orderBy('ordre');
    }
}
