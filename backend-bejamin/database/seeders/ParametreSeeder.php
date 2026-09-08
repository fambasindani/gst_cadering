<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Parametre;

class ParametreSeeder extends Seeder
{
    public function run(): void
    {
        $params = [
            ['cle' => 'nom_entreprise', 'valeur' => 'FONDEG CATERING CONGO SA', 'description' => "Nom de l'entreprise", 'type' => 'text', 'est_modifiable' => true],
            ['cle' => 'seuil_alerte_stock', 'valeur' => '10', 'description' => 'Seuil minimum de stock pour déclencher une alerte', 'type' => 'number', 'est_modifiable' => true],
            ['cle' => 'email_contact', 'valeur' => 'contact@fondeg.com', 'description' => 'Email de contact principal', 'type' => 'email', 'est_modifiable' => true],
            ['cle' => 'devise_defaut', 'valeur' => 'USD', 'description' => 'Devise par défaut du système', 'type' => 'text', 'est_modifiable' => false],
            ['cle' => 'logo_entreprise', 'valeur' => '', 'description' => "Logo de l'entreprise (URL)", 'type' => 'url', 'est_modifiable' => true],
            ['cle' => 'couleur_primaire', 'valeur' => '#1e3a5f', 'description' => "Couleur primaire de l'interface", 'type' => 'color', 'est_modifiable' => true],
            ['cle' => 'footer_pdf', 'valeur' => 'FONDEG CATERING CONGO SA - Tous droits réservés', 'description' => 'Texte de pied de page des PDF', 'type' => 'text', 'est_modifiable' => true],
            ['cle' => 'version_app', 'valeur' => '1.0.0', 'description' => "Version actuelle de l'application", 'type' => 'text', 'est_modifiable' => false],
        ];

        foreach ($params as $p) {
            Parametre::updateOrCreate(['cle' => $p['cle']], $p);
        }

        $this->command->info('✅ ' . count($params) . ' paramètres créés avec succès !');
    }
}
