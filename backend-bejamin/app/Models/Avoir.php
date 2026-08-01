<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Avoir extends Model
{
    use SoftDeletes;

      protected $table = 'avoir';

    protected $fillable = [
        'numero_avoir',
        'date_avoir',
        'id_partenaire_client',
        'id_retour',
        'id_devise',
        'montant_ht',
        'id_utilisateur',
        'commentaire'
    ];

    protected $casts = [
        'date_avoir' => 'date',
        'montant_ht' => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire_client');
    }

    public function retour()
    {
        return $this->belongsTo(Retour::class, 'id_retour');
    }

    public function devise()
    {
        return $this->belongsTo(Devise::class, 'id_devise');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
}