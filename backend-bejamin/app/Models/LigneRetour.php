<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LigneRetour extends Model
{
    use SoftDeletes;

    protected $table = 'ligne_retour';

    protected $fillable = [
        'id_retour',
        'id_lot',
        'quantite_retournee',
        'motif'
    ];

    protected $casts = [
        'quantite_retournee' => 'integer',
    ];

    // Relations
    public function retour()
    {
        return $this->belongsTo(Retour::class, 'id_retour');
    }

    public function lot()
    {
        return $this->belongsTo(Lot::class, 'id_lot');
    }
}