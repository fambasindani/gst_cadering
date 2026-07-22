<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'mot_de_passe_hash',
        'id_role',
        'id_ville',
        'id_departement',
        'id_zone',
        'id_emplacement',
        'actif',
        'derniere_connexion'
    ];

    protected $hidden = [
        'mot_de_passe_hash',
        'remember_token',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'derniere_connexion' => 'datetime',
    ];

    // Authentification
    public function getAuthPassword()
    {
        return $this->mot_de_passe_hash;
    }

    // Relations
    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role');
    }

    public function ville()
    {
        return $this->belongsTo(Ville::class, 'id_ville');
    }

    public function departement()
    {
        return $this->belongsTo(Departement::class, 'id_departement');
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class, 'id_zone');
    }

    public function emplacement()
    {
        return $this->belongsTo(Emplacement::class, 'id_emplacement');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('nom', 'LIKE', "%{$search}%")
                     ->orWhere('prenom', 'LIKE', "%{$search}%")
                     ->orWhere('email', 'LIKE', "%{$search}%");
    }

    public function scopeByVille($query, $villeId)
    {
        return $query->where('id_ville', $villeId);
    }

    public function scopeByDepartement($query, $departementId)
    {
        return $query->where('id_departement', $departementId);
    }

    // Permissions
    public function hasPermission($permissionCode)
    {
        if (!$this->role) {
            return false;
        }
        return $this->role->hasPermission($permissionCode);
    }

    public function hasRole($roleNom)
    {
        return $this->role && $this->role->nom === $roleNom;
    }

    // Nom complet
    public function getFullNameAttribute()
    {
        return trim($this->prenom . ' ' . $this->nom);
    }
}