<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeMouvement extends Model
{
    protected $table = 'type_mouvement';

    protected $fillable = [
        'libelle',
        'sens',
        'actif'
    ];

    protected $casts = [
        'sens' => 'integer',
        'actif' => 'boolean',
    ];

    // Relations
    public function mouvements()
    {
        return $this->hasMany(MouvementStock::class, 'id_type_mouvement');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeEntree($query)
    {
        return $query->where('sens', 1);
    }

    public function scopeSortie($query)
    {
        return $query->where('sens', -1);
    }
}