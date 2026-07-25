<?php

namespace App\Console\Commands;

use App\Models\BonCommande;
use App\Models\Notification;
use App\Models\Retour;
use App\Models\Lot;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateNotifications extends Command
{
    protected $signature = 'notifications:generate';
    protected $description = 'Génère les notifications selon les permissions de chaque utilisateur';

    public function handle()
    {
        $this->notifyBonsCommandeEnAttente();
        $this->notifyRetoursEnAttente();
        $this->notifyLotsPeremptionProche();
        $this->info('Notifications générées avec succès.');
    }

    private function notifyBonsCommandeEnAttente()
    {
        $count = BonCommande::where('statut_validation', 'EN ATTENTE')->count();
        if ($count === 0) return;

        $users = Utilisateur::actif()->get();
        foreach ($users as $user) {
            if (!$user->hasPermission('config:bon_commande:view')) continue;

            $existing = Notification::where('type', 'bon_commande_en_attente')
                ->where('id_utilisateur', $user->id)
                ->whereNull('read_at')
                ->exists();
            if ($existing) continue;

            Notification::create([
                'type' => 'bon_commande_en_attente',
                'message' => "{$count} bon(s) de commande en attente de validation",
                'id_utilisateur' => $user->id,
                'reference_type' => BonCommande::class,
                'reference_id' => null,
            ]);
        }
    }

    private function notifyRetoursEnAttente()
    {
        $count = Retour::where('statut_validation', 'EN ATTENTE')->count();
        if ($count === 0) return;

        $users = Utilisateur::actif()->get();
        foreach ($users as $user) {
            if (!$user->hasPermission('config:retours:view')) continue;

            $existing = Notification::where('type', 'retour_en_attente')
                ->where('id_utilisateur', $user->id)
                ->whereNull('read_at')
                ->exists();
            if ($existing) continue;

            Notification::create([
                'type' => 'retour_en_attente',
                'message' => "{$count} retour(s) stock en attente de validation",
                'id_utilisateur' => $user->id,
                'reference_type' => Retour::class,
                'reference_id' => null,
            ]);
        }
    }

    private function notifyLotsPeremptionProche()
    {
        $threshold = Carbon::now()->addDays(30);
        $lots = Lot::where('date_peremption', '<=', $threshold)
            ->where('date_peremption', '>=', Carbon::now())
            ->where('statut_validation', 'VALIDÉ')
            ->count();

        if ($lots === 0) return;

        $users = Utilisateur::actif()->get();
        foreach ($users as $user) {
            if (!$user->hasPermission('config:lots:view')) continue;

            $existing = Notification::where('type', 'lot_peremption_proche')
                ->where('id_utilisateur', $user->id)
                ->whereNull('read_at')
                ->exists();
            if ($existing) continue;

            Notification::create([
                'type' => 'lot_peremption_proche',
                'message' => "{$lots} lot(s) arrivant à expiration dans les 30 jours",
                'id_utilisateur' => $user->id,
                'reference_type' => Lot::class,
                'reference_id' => null,
            ]);
        }
    }
}