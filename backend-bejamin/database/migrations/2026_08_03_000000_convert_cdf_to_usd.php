<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $usdId = 2;
        $cdfId = 1;

        // Lots
        DB::table('lots')
            ->where(function ($q) use ($cdfId) {
                $q->where('id_devise', $cdfId)->orWhereNull('id_devise');
            })
            ->update([
                'prix_achat_ht_unitaire' => DB::raw('COALESCE(prix_achat_ht_unitaire, 0) / 2350'),
                'id_devise' => $usdId,
            ]);

        // Historique prix
        DB::table('historique_prix')
            ->where(function ($q) use ($cdfId) {
                $q->where('id_devise', $cdfId)->orWhereNull('id_devise');
            })
            ->update([
                'prix_achat_ht' => DB::raw('prix_achat_ht / 2350'),
                'prix_vente_ht' => DB::raw('COALESCE(prix_vente_ht, 0) / 2350'),
                'id_devise' => $usdId,
            ]);

        // Bon commande
        DB::table('bon_commande')
            ->where(function ($q) use ($cdfId) {
                $q->where('id_devise', $cdfId)->orWhereNull('id_devise');
            })
            ->update([
                'montant_total_ht' => DB::raw('montant_total_ht / 2350'),
                'id_devise' => $usdId,
            ]);

        // Ligne commande
        DB::table('ligne_commande')
            ->where(function ($q) use ($cdfId) {
                $q->where('id_devise', $cdfId)->orWhereNull('id_devise');
            })
            ->update([
                'prix_unitaire_ht' => DB::raw('prix_unitaire_ht / 2350'),
                'id_devise' => $usdId,
            ]);

        // Avoir
        DB::table('avoir')
            ->where(function ($q) use ($cdfId) {
                $q->where('id_devise', $cdfId)->orWhereNull('id_devise');
            })
            ->update([
                'montant_ht' => DB::raw('montant_ht / 2350'),
                'id_devise' => $usdId,
            ]);
    }

    public function down(): void
    {
        // Non réversible : on ne remultiplie pas.
    }
};
