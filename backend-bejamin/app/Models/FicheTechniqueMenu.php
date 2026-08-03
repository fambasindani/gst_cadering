<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FicheTechniqueMenu extends Model
{
    use SoftDeletes;

    protected $table = 'fiche_technique_menu';

    protected $fillable = [
        'code',
        'nom',
        'description',
        'cycle',
        'periodicite',
        'validite',
        'id_partenaire',
        'id_magasin',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function partenaire()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire');
    }

    public function magasin()
    {
        return $this->belongsTo(Magasin::class, 'id_magasin');
    }

    public function parties()
    {
        return $this->hasMany(FicheTechniqueMenuPartie::class, 'id_fiche_technique_menu')
            ->orderBy('ordre');
    }

    public function entreeFicheTechniques()
    {
        return $this->hasMany(EntreeFicheTechnique::class, 'id_fiche_technique_menu');
    }

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('code', 'LIKE', "%{$search}%")
                     ->orWhere('nom', 'LIKE', "%{$search}%");
    }

    public function scopeByMagasin($query, $magasinId)
    {
        return $query->where('id_magasin', $magasinId);
    }
}
