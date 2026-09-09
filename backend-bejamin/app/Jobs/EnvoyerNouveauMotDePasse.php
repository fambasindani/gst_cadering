<?php

namespace App\Jobs;

use App\Mail\NouveauMotDePasseMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class EnvoyerNouveauMotDePasse implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public string $nom;
    public string $email;
    public string $nouveauMotDePasse;

    public function __construct(string $nom, string $email, string $nouveauMotDePasse)
    {
        $this->nom = $nom;
        $this->email = $email;
        $this->nouveauMotDePasse = $nouveauMotDePasse;
    }

    public function handle(): void
    {
        Mail::to($this->email)->send(
            new NouveauMotDePasseMail(
                $this->nom,
                $this->email,
                $this->nouveauMotDePasse
            )
        );
    }

    public function failed(\Throwable $exception): void
    {
        \Log::error("Échec envoi email nouveau mot de passe à {$this->email}: " . $exception->getMessage());
    }
}
