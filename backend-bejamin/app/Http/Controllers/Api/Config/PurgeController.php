<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\Avoir;
use App\Models\BonCommande;
use App\Models\EntreeRecette;
use App\Models\Inventaire;
use App\Models\LigneCommande;
use App\Models\LigneRetour;
use App\Models\Lot;
use App\Models\MouvementStock;
use App\Models\PeriodeInventaire;
use App\Models\Retour;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PurgeController extends Controller
{
    /**
     * Purge complète du module stock : entrées, sorties, lots, commandes,
     * réceptions, retours, avoirs, recettes et inventaires.
     * Les produits, la configuration et l'historique des prix sont conservés.
     */
    public function purgeStock(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->hasRole('ADMIN')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un administrateur peut purger le stock'
                ], 403);
            }

            // Confirmation obligatoire pour éviter toute suppression accidentelle
            $confirmation = strtoupper(trim((string) $request->input('confirmation', '')));

            if ($confirmation !== 'PURGER') {
                return response()->json([
                    'success' => false,
                    'message' => 'Confirmation requise : tapez "PURGER" pour confirmer'
                ], 422);
            }

            $supprime = [];

            DB::transaction(function () use (&$supprime) {
                // Ordre de suppression respectant les contraintes de clés étrangères
                $tables = [
                    'mouvements' => MouvementStock::class,
                    'lignes_retour' => LigneRetour::class,
                    'lignes_commande' => LigneCommande::class,
                    'avoirs' => Avoir::class,
                    'retours' => Retour::class,
                    'bons_commande' => BonCommande::class,
                    'entrees_recette' => EntreeRecette::class,
                    'inventaires' => Inventaire::class,
                    'lots' => Lot::class,
                    'periodes_inventaire' => PeriodeInventaire::class,
                    'audits' => Audit::class,
                ];

                foreach ($tables as $label => $modelClass) {
                    $supprime[$label] = $modelClass::count();
                    $modelClass::query()->delete();
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Stock purgé avec succès',
                'data' => ['supprime' => $supprime]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la purge du stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
