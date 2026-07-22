<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\FicheTechnique;
use App\Models\Lot;
use App\Models\MouvementStock;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EntreeRecetteController extends Controller
{
    /**
     * Produire à partir d'une recette
     */
    public function produire(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_fiche_technique' => 'required|exists:fiche_technique,id',
                'quantite_produite' => 'required|integer|min:1',
                'id_ville' => 'required|exists:villes,id',
                'id_zone' => 'required|exists:zones,id',
                'id_emplacement' => 'nullable|exists:emplacements,id',
                'date_production' => 'nullable|date',
                'commentaire' => 'nullable|string',
            ]);

            $fiche = FicheTechnique::with('lignes.ingredient')->findOrFail($validated['id_fiche_technique']);

            DB::beginTransaction();

            try {
                $quantiteProduite = $validated['quantite_produite'];
                $produitFini = $fiche->produitFini;

                // Vérifier les stocks des ingrédients
                foreach ($fiche->lignes as $ligne) {
                    $quantiteNecessaire = $ligne->quantite_ingredient * $quantiteProduite;
                    $stockDisponible = Lot::where('id_produit', $ligne->id_produit_ingredient)
                        ->where('id_ville', $validated['id_ville'])
                        ->where('statut_validation', 'VALIDÉ')
                        ->sum('quantite_disponible');

                    if ($stockDisponible < $quantiteNecessaire) {
                        return response()->json([
                            'success' => false,
                            'message' => "Stock insuffisant pour l'ingrédient: {$ligne->ingredient->nom}. Disponible: {$stockDisponible}, Nécessaire: {$quantiteNecessaire}"
                        ], 422);
                    }
                }

                // 1. CONSOMMER LES INGRÉDIENTS (SORTIES)
                foreach ($fiche->lignes as $ligne) {
                    $quantiteNecessaire = $ligne->quantite_ingredient * $quantiteProduite;
                    $quantiteRestante = $quantiteNecessaire;

                    // Récupérer les lots disponibles (FIFO - premier entré, premier sorti)
                    $lots = Lot::where('id_produit', $ligne->id_produit_ingredient)
                        ->where('id_ville', $validated['id_ville'])
                        ->where('statut_validation', 'VALIDÉ')
                        ->where('quantite_disponible', '>', 0)
                        ->orderBy('date_reception')
                        ->get();

                    foreach ($lots as $lot) {
                        if ($quantiteRestante <= 0) break;

                        $quantiteAPrelever = min($lot->quantite_disponible, $quantiteRestante);

                        // Créer mouvement de sortie
                        MouvementStock::create([
                            'id_lot' => $lot->id,
                            'id_type_mouvement' => 2, // Sortie consommation
                            'quantite' => $quantiteAPrelever,
                            'date_mouvement' => $validated['date_production'] ?? now(),
                            'id_utilisateur' => Auth::id(),
                            'reference_document' => $fiche->code,
                            'commentaire' => "Consommation pour production: {$fiche->nom} (x{$quantiteProduite})",
                            'statut_validation' => 'VALIDÉ',
                        ]);

                        // Mettre à jour le lot
                        $lot->quantite_disponible -= $quantiteAPrelever;
                        $lot->save();

                        $quantiteRestante -= $quantiteAPrelever;
                    }
                }

                // 2. ENTRÉE DU PRODUIT FINI
                $quantiteProduiteTotale = $quantiteProduite * $fiche->rendement;

                // Créer un lot pour le produit fini
                $lot = Lot::create([
                    'id_produit' => $produitFini->id,
                    'id_ville' => $validated['id_ville'],
                    'id_zone' => $validated['id_zone'],
                    'id_emplacement' => $validated['id_emplacement'] ?? null,
                    'numero_lot' => 'PROD-' . $fiche->code . '-' . date('YmdHis'),
                    'code_qr' => 'QR-PROD-' . uniqid(),
                    'quantite_recue' => $quantiteProduiteTotale,
                    'quantite_disponible' => $quantiteProduiteTotale,
                    'date_fabrication' => $validated['date_production'] ?? now(),
                    'date_peremption' => now()->addDays(7), // À ajuster selon le produit
                    'date_reception' => now(),
                    'prix_achat_ht_unitaire' => $fiche->cout_unitaire,
                    'statut_validation' => 'EN ATTENTE',
                    'commentaire' => $validated['commentaire'] ?? null,
                ]);

                // Créer mouvement d'entrée
                MouvementStock::create([
                    'id_lot' => $lot->id,
                    'id_type_mouvement' => 1, // Entrée réception
                    'quantite' => $quantiteProduiteTotale,
                    'date_mouvement' => $validated['date_production'] ?? now(),
                    'id_utilisateur' => Auth::id(),
                    'reference_document' => $fiche->code,
                    'commentaire' => "Production: {$fiche->nom} (x{$quantiteProduite})",
                    'statut_validation' => 'EN ATTENTE',
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'fiche_technique' => $fiche,
                        'lot_produit' => $lot->load(['produit', 'ville', 'zone']),
                        'quantite_produite' => $quantiteProduiteTotale,
                        'cout_total' => $fiche->cout_total * $quantiteProduite,
                        'cout_unitaire' => $fiche->cout_unitaire,
                    ],
                    'message' => 'Production réalisée avec succès'
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la production',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}