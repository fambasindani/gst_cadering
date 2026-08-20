<?php

namespace App\Console\Commands;

use App\Models\Lot;
use Illuminate\Console\Command;

class MarquerLotsPerimes extends Command
{
    protected $signature = 'lots:marquer-perimes';
    protected $description = 'Marque les lots dont la date de péremption est dépassée (est_perime) et démarque ceux rallongés';

    public function handle()
    {
        // Marquer les lots périmés (date de péremption dépassée)
        $marques = Lot::where('est_perime', false)
            ->whereNotNull('date_peremption')
            ->whereDate('date_peremption', '<', now()->toDateString())
            ->update(['est_perime' => true]);

        // Démarquer les lots dont la date de péremption a été repoussée
        $demarques = Lot::where('est_perime', true)
            ->where(function ($q) {
                $q->whereNull('date_peremption')
                    ->orWhereDate('date_peremption', '>=', now()->toDateString());
            })
            ->update(['est_perime' => false]);

        $this->info("Lots périmés marqués : {$marques} ; lots démarqués : {$demarques}");

        return self::SUCCESS;
    }
}
