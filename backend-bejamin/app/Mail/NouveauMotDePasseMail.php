<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NouveauMotDePasseMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $nom;
    public string $email;
    public string $nouveauMotDePasse;

    public function __construct(string $nom, string $email, string $nouveauMotDePasse)
    {
        $this->nom = $nom;
        $this->email = $email;
        $this->nouveauMotDePasse = $nouveauMotDePasse;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Nouveau mot de passe — FONDEG GST",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    private function buildHtml(): string
    {
        return "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
            <div style='background:#1e3a5f;color:white;padding:20px 24px;border-radius:8px 8px 0 0;'>
                <h1 style='margin:0;font-size:18px;'>FONDEG CATERING CONGO SA</h1>
                <p style='margin:4px 0 0;font-size:14px;opacity:0.9;'>Réinitialisation du mot de passe</p>
            </div>
            <div style='background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;'>
                <p style='margin:0 0 16px;'>Bonjour <strong>{$this->nom}</strong>,</p>
                <p style='margin:0 0 16px;'>Votre mot de passe a été réinitialisé. Voici votre nouveau mot de passe :</p>
                <div style='background:#f0f4f8;border:2px dashed #1e3a5f;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;'>
                    <p style='margin:0 0 6px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;'>Nouveau mot de passe</p>
                    <p style='margin:0;font-size:24px;font-weight:bold;color:#1e3a5f;font-family:monospace;letter-spacing:2px;'>{$this->nouveauMotDePasse}</p>
                </div>
                <p style='margin:0 0 16px;color:#e74c3c;font-weight:bold;'>⚠️ Connectez-vous et changez ce mot de passe immédiatement.</p>
                <table style='width:100%;border-collapse:collapse;'>
                    <tr><td style='padding:6px 0;color:#666;'>Email :</td><td style='padding:6px 0;'>{$this->email}</td></tr>
                    <tr><td style='padding:6px 0;color:#666;'>Date :</td><td style='padding:6px 0;'>{now()->format('d/m/Y H:i')}</td></tr>
                </table>
            </div>
            <div style='background:#f8fafc;padding:14px 24px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;text-align:center;'>
                <p style='margin:0;font-size:11px;color:#94a3b8;'>FONDEG CATERING CONGO SA — Système GST</p>
            </div>
        </div>";
    }
}
