<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Audit extends Model
{
    protected $table = 'audits';

    protected $fillable = [
        'id_utilisateur',
        'action',
        'table_cible',
        'id_enregistrement',
        'anciennes_valeurs',
        'nouvelles_valeurs',
        'date_action',
        'adresse_ip',
        'user_agent',
        'route'
    ];

    protected $casts = [
        'date_action' => 'datetime',
        'anciennes_valeurs' => 'array',
        'nouvelles_valeurs' => 'array',
    ];

    // Relation avec l'utilisateur
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    // Scopes pour faciliter les requêtes
    public function scopeByTable($query, $table)
    {
        return $query->where('table_cible', $table);
    }

    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByUtilisateur($query, $utilisateurId)
    {
        return $query->where('id_utilisateur', $utilisateurId);
    }

    public function scopeByEnregistrement($query, $id)
    {
        return $query->where('id_enregistrement', $id);
    }

    public function scopePeriod($query, $debut, $fin)
    {
        return $query->whereBetween('date_action', [$debut, $fin]);
    }

    public function scopeRecents($query, $limit = 10)
    {
        return $query->orderBy('date_action', 'desc')->limit($limit);
    }
}