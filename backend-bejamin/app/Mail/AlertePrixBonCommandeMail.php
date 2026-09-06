<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AlertePrixBonCommandeMail extends Mailable
{
    use Queueable, SerializesModels;

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

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "⚠ Alerte prix — Bon de commande {$this->numeroCommande}",
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
        $rows = '';
        foreach ($this->alertes as $a) {
            $rows .= "<tr>
                <td style='padding:10px 14px;border:1px solid #e5e7eb;'>{$a['produit']}</td>
                <td style='padding:10px 14px;border:1px solid #e5e7eb;'>{$a['ancien']}</td>
                <td style='padding:10px 14px;border:1px solid #e5e7eb;font-weight:bold;'>{$a['nouveau']}</td>
                <td style='padding:10px 14px;border:1px solid #e5e7eb;color:#e74c3c;'>{$a['difference']}</td>
            </tr>";
        }

        return "
        <div style='font-family:Arial,sans-serif;max-width:700px;margin:0 auto;'>
            <div style='background:#1e3a5f;color:white;padding:20px 24px;border-radius:8px 8px 0 0;'>
                <h1 style='margin:0;font-size:18px;'>FONDEG CATERING CONGO SA</h1>
                <p style='margin:4px 0 0;font-size:14px;opacity:0.9;'>Alerte de prix — Différences détectées</p>
            </div>
            <div style='background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;'>
                <p style='margin:0 0 16px;'>Des différences de prix ont été détectées lors de la création du bon de commande :</p>
                <table style='width:100%;border-collapse:collapse;margin-bottom:20px;'>
                    <thead>
                        <tr style='background:#f8fafc;'>
                            <th style='padding:10px 14px;border:1px solid #e5e7eb;text-align:left;'>Produit</th>
                            <th style='padding:10px 14px;border:1px solid #e5e7eb;text-align:left;'>Dernier prix</th>
                            <th style='padding:10px 14px;border:1px solid #e5e7eb;text-align:left;'>Prix saisi</th>
                            <th style='padding:10px 14px;border:1px solid #e5e7eb;text-align:left;'>Différence</th>
                        </tr>
                    </thead>
                    <tbody>{$rows}</tbody>
                </table>
                <table style='width:100%;border-collapse:collapse;'>
                    <tr><td style='padding:6px 0;color:#666;'>Bon de commande :</td><td style='padding:6px 0;font-weight:bold;'>{$this->numeroCommande}</td></tr>
                    <tr><td style='padding:6px 0;color:#666;'>Fournisseur :</td><td style='padding:6px 0;'>{$this->fournisseur}</td></tr>
                    <tr><td style='padding:6px 0;color:#666;'>Date :</td><td style='padding:6px 0;'>{$this->dateCommande}</td></tr>
                </table>
            </div>
            <div style='background:#f8fafc;padding:14px 24px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;text-align:center;'>
                <p style='margin:0;font-size:11px;color:#94a3b8;'>FONDEG CATERING CONGO SA — Système GST</p>
            </div>
        </div>";
    }
}
