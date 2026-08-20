<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Produit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code_article',
        'code_barre',
        'nom',
        'description',
        'id_categorie',
        'id_partenaire_principal',
        'id_unite',
        'seuil_alerte',
        'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
        'seuil_alerte' => 'integer',
    ];

    // Relations
    public function categorie()
    {
        return $this->belongsTo(Categorie::class, 'id_categorie');
    }

    public function partenairePrincipal()
    {
        return $this->belongsTo(Partenaire::class, 'id_partenaire_principal');
    }

    public function unite()
    {
        return $this->belongsTo(Unite::class, 'id_unite');
    }

    public function historiquePrix()
    {
        return $this->hasMany(HistoriquePrix::class, 'id_produit');
    }

    public function lots()
    {
        return $this->hasMany(Lot::class, 'id_produit');
    }

    public function seuilsMagasin()
    {
        return $this->hasMany(ProduitMagasin::class, 'id_produit');
    }

    /**
     * Fiche recette liée à ce produit fini (si le produit est issu d'une recette).
     */
    public function ficheTechnique()
    {
        return $this->hasOne(FicheTechnique::class, 'id_produit_fini');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('code_article', 'LIKE', "%{$search}%")
                     ->orWhere('code_barre', 'LIKE', "%{$search}%")
                     ->orWhere('description', 'LIKE', "%{$search}%");
    }

    public function scopeByCategorie($query, $categorieId)
    {
        return $query->where('id_categorie', $categorieId);
    }

    // Méthodes
    public function getDernierPrixAchat()
    {
        return $this->historiquePrix()
                    ->whereNotNull('prix_achat_ht')
                    ->orderBy('date_application', 'desc')
                    ->first();
    }

    public function getPrixPondereAchat()
    {
        $lots = $this->lots()
                    ->where('statut_validation', 'VALIDÉ')
                    ->where('quantite_disponible', '>', 0)
                    ->nonPerime()
                    ->get();

        $qteTotale = 0;
        $valeurTotale = 0;
        foreach ($lots as $lot) {
            $qteTotale += (int) $lot->quantite_disponible;
            $valeurTotale += (float) $lot->prix_achat_ht_unitaire * (int) $lot->quantite_disponible;
        }

        if ($qteTotale > 0) {
            return round($valeurTotale / $qteTotale, 4);
        }

        return (float) ($this->getDernierPrixAchat()->prix_achat_ht ?? 0);
    }

    public function getStockTotal()
    {
        return $this->lots()
                    ->where('statut_validation', 'VALIDÉ')
                    ->nonPerime()
                    ->sum('quantite_disponible');
    }

    public function getStockParMagasin($magasinId)
    {
        return $this->lots()
                    ->where('statut_validation', 'VALIDÉ')
                    ->where('id_magasin', $magasinId)
                    ->nonPerime()
                    ->sum('quantite_disponible');
    }

    /**
     * Alertes « stock bas » du produit, en tenant compte :
     * - du seuil global (produits.seuil_alerte) sur le stock total ;
     * - des seuils spécifiques par magasin (produit_magasin.seuil_alerte).
     *
     * @return array<int, array{type:string, id_magasin:int|null, magasin:string|null, stock:int, seuil:int}>
     */
    public function getStockBasAlerts(): array
    {
        $alertes = [];

        $parMagasin = $this->lots()
            ->where('statut_validation', 'VALIDÉ')
            ->nonPerime()
            ->selectRaw('id_magasin, SUM(quantite_disponible) as stock')
            ->groupBy('id_magasin')
            ->pluck('stock', 'id_magasin');

        $total = (int) $parMagasin->sum();
        $seuilGlobal = (int) ($this->seuil_alerte ?? 0);

        if ($seuilGlobal > 0 && $total > 0 && $total <= $seuilGlobal) {
            $alertes[] = [
                'type' => 'global',
                'id_magasin' => null,
                'magasin' => null,
                'stock' => $total,
                'seuil' => $seuilGlobal,
            ];
        }

        foreach ($this->seuilsMagasin()->with('magasin')->get() as $sm) {
            $stock = (int) ($parMagasin[$sm->id_magasin] ?? 0);
            if ($sm->seuil_alerte > 0 && $stock > 0 && $stock <= $sm->seuil_alerte) {
                $alertes[] = [
                    'type' => 'magasin',
                    'id_magasin' => $sm->id_magasin,
                    'magasin' => $sm->magasin->nom ?? null,
                    'stock' => $stock,
                    'seuil' => (int) $sm->seuil_alerte,
                ];
            }
        }

        return $alertes;
    }
}