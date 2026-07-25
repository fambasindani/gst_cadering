<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';

    protected $fillable = [
        'type',
        'message',
        'id_utilisateur',
        'reference_type',
        'reference_id',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public function scopeNonLues($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeByUtilisateur($query, $userId)
    {
        return $query->where('id_utilisateur', $userId);
    }
}