<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Marquage des lots périmés (renseigné par la tâche planifiée lots:marquer-perimes).
     * Un lot périmé ne compte plus dans le stock disponible (rupture).
     */
    public function up(): void
    {
        Schema::table('lots', function (Blueprint $table) {
            $table->boolean('est_perime')->default(false)->after('statut_validation');
            $table->index('est_perime');
        });

        // Backfill : marquer immédiatement les lots déjà périmés
        DB::table('lots')
            ->whereNotNull('date_peremption')
            ->whereDate('date_peremption', '<', now()->toDateString())
            ->update(['est_perime' => true]);
    }

    public function down(): void
    {
        Schema::table('lots', function (Blueprint $table) {
            $table->dropIndex(['est_perime']);
            $table->dropColumn('est_perime');
        });
    }
};
