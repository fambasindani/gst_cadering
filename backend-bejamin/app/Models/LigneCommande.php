<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LigneCommande extends Model
{
    use SoftDeletes;

    protected $table = 'ligne_commande';

    protected $fillable = [
        'id_bon_commande',
        'id_produit',
        'quantite_commandee',
        'prix_unitaire_ht',
        'id_devise',
        'quantite_recue'
    ];

    protected $casts = [
        'quantite_commandee' => 'integer',
        'prix_unitaire_ht' => 'decimal:2',
        'quantite_recue' => 'integer',
    ];

    // Relations
    public function bonCommande()
    {
        return $this->belongsTo(BonCommande::class, 'id_bon_commande');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }

    public function devise()
    {
        return $this->belongsTo(Devise::class, 'id_devise');
    }

    // Méthodes
    public function getTotalLigne()
    {
        return $this->quantite_commandee * $this->prix_unitaire_ht;
    }

    public function getTotalRecu()
    {
        return $this->quantite_recue * $this->prix_unitaire_ht;
    }

    public function getQuantiteRestante()
    {
        return $this->quantite_commandee - $this->quantite_recue;
    }

    public function isComplete()
    {
        return $this->quantite_recue >= $this->quantite_commandee;
    }
}