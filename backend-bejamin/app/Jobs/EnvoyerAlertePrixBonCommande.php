<?php

namespace App\Jobs;

use App\Mail\AlertePrixBonCommandeMail;
use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class EnvoyerAlertePrixBonCommande implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public array $alertes;
    public string $numeroCommande;
    public string $fournisseur;
    public string $dateCommande;

    public function __construct(array $alertes, string $numeroCommande, string $fournisseur, string $dateCommande)
    {
        $this->alertes = $alertes;
        $this->numeroCommande = $numeroCommande;
        $this->fournisseur = $fournisseur;
        $this->dateCommande = $dateCommande;
    }

    public function handle(): void
    {
        $users = Utilisateur::where('actif', true)->get();
        if ($users->isEmpty()) return;

        foreach ($users as $user) {
            if (empty($user->email)) continue;
            try {
                Mail::to($user->email)->send(
                    new AlertePrixBonCommandeMail(
                        $this->alertes,
                        $this->numeroCommande,
                        $this->fournisseur,
                        $this->dateCommande
                    )
                );
            } catch (\Exception $e) {
                \Log::warning("Échec envoi email alerte prix à {$user->email}: " . $e->getMessage());
            }
        }
    }

    public function failed(\Throwable $exception): void
    {
        \Log::error("Échec envoi alerte prix bon de commande: " . $exception->getMessage());
    }
}
