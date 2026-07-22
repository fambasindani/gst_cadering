<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lot extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'id_produit',
        'id_ville',
        'id_zone',
        'id_emplacement',
        'numero_lot',
        'code_qr',
        'quantite_recue',
        'quantite_disponible',
        'date_fabrication',
        'date_peremption',
        'date_reception',
        'id_partenaire',
        'prix_achat_ht_unitaire',
        'id_devise',
        'valide_par',
        'date_validation',
        'statut_validation',
        'commentaire'
    ];

    protected $casts = [
        'quantite_recue' => 'integer',
        'quantite_disponible' => 'integer',
        'date_fabrication' => 'date',
        'date_peremption' => 'date',
        'date_reception' => 'datetime',
        'date_validation' => 'datetime',
    ];

    // Relations
    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit');
    }

    public function ville()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class, 'id_zone');
    }

    public function emplacement()
    {
        return $this->belongsTo(Emplacement::class, 'id_emplacement');
    }

    public function partenaire()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire');
    }

    public function devise()
    {
        return $this->belongsTo(Devise::class, 'id_devise');
    }

    public function validePar()
    {
        return $this->belongsTo(Utilisateur::class, 'valide_par');
    }

    public function mouvements()
    {
        return $this->hasMany(MouvementStock::class, 'id_lot');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('statut_validation', 'VALIDÉ')
                     ->where('quantite_disponible', '>', 0);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('numero_lot', 'LIKE', "%{$search}%")
                     ->orWhere('code_qr', 'LIKE', "%{$search}%");
    }

    public function scopeByProduit($query, $produitId)
    {
        return $query->where('id_produit', $produitId);
    }

    public function scopeByVille($query, $villeId)
    {
        return $query->where('id_ville', $villeId);
    }

    public function scopeByZone($query, $zoneId)
    {
        return $query->where('id_zone', $zoneId);
    }

    public function scopePerime($query)
    {
        return $query->where('date_peremption', '<', now());
    }

    public function scopeProchePeremption($query, $jours = 7)
    {
        return $query->whereBetween('date_peremption', [now(), now()->addDays($jours)]);
    }

    // Méthodes
    public function getStockDisponible()
    {
        return $this->quantite_disponible;
    }

    public function getPrixAchat()
    {
        return $this->prix_achat_ht_unitaire;
    }

    public function isPerime()
    {
        return $this->date_peremption < now();
    }

    public function isProchePeremption($jours = 7)
    {
        return $this->date_peremption <= now()->addDays($jours);
    }

    public function getStatut()
    {
        if ($this->quantite_disponible <= 0) return 'ÉPUISÉ';
        if ($this->isPerime()) return 'PÉRIMÉ';
        if ($this->isProchePeremption(7)) return 'PROCHE PÉREMPTION';
        return 'DISPONIBLE';
    }

    // Générer un QR code unique
    public static function generateQrCode($numeroLot)
    {
        return 'QR-' . $numeroLot . '-' . uniqid();
    }
}