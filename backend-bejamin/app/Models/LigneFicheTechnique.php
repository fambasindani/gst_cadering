<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LigneFicheTechnique extends Model
{
    use SoftDeletes;

    protected $table = 'ligne_fiche_technique';

    protected $fillable = [
        'id_fiche_technique',
        'id_produit_ingredient',
        'quantite_ingredient',
        'id_unite',
        'rendement',
        'prix_unitaire',
        'poids_net',
        'poids_brut',
        'cout_total',
        'rendement_apres_cuisson',
        'commentaire'
    ];

    protected $casts = [
        'quantite_ingredient' => 'decimal:2',
        'rendement' => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'poids_net' => 'decimal:3',
        'poids_brut' => 'decimal:3',
        'cout_total' => 'decimal:2',
        'rendement_apres_cuisson' => 'boolean',
    ];

    public function ficheTechnique()
    {
        return $this->belongsTo(FicheTechnique::class, 'id_fiche_technique');
    }

    public function ingredient()
    {
        return $this->belongsTo(Produit::class, 'id_produit_ingredient');
    }

    public function unite()
    {
        return $this->belongsTo(Unite::class, 'id_unite');
    }

    public function calculateCout()
    {
        $this->prix_unitaire = $this->ingredient->getDernierPrixAchat()->prix_achat_ht ?? 0;
        $this->cout_total = $this->poids_net * $this->prix_unitaire;
        $this->save();
        return $this->cout_total;
    }
}
