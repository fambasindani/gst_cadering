<?php

namespace App\Http\Controllers\Api\Facturation;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\LigneFacture;
use App\Models\Lot;
use App\Models\MouvementStock;
use App\Models\Paiement;
use App\Models\Avoir;
use App\Models\BonCommande;
use App\Models\TypeMouvement;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Helpers\CodeGenerator;

class FactureController extends Controller
{
    /**
     * Liste des factures
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $clientId = $request->input('client_id');
            $statut = $request->input('statut');
            $villeId = $request->input('ville_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Facture::with(['client', 'ville', 'devise', 'utilisateur', 'lignes.produit', 'paiements', 'mouvements']);

            if ($search) {
                $query->where('numero_facture', 'LIKE', "%{$search}%")
                      ->orWhereHas('client', function($q) use ($search) {
                          $q->where('nom', 'LIKE', "%{$search}%");
                      });
            }

            if ($clientId) {
                $query->where('id_partenaire_client', $clientId);
            }

            if ($statut) {
                $query->where('statut', $statut);
            }

            if ($villeId) {
                $query->where('id_ville', $villeId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            // Ajouter le solde pour chaque facture
            foreach ($data as $facture) {
                $facture->solde = $facture->getSolde();
                $facture->total_paye = $facture->getTotalPaye();
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des factures récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une facture
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'numero_facture' => 'nullable|string|max:50|unique:facture,numero_facture',
                'date_facture' => 'required|date',
                'date_echeance' => 'required|date|after_or_equal:date_facture',
                'id_partenaire_client' => 'required|exists:partenaires,id',
                'id_bon_commande' => 'nullable|exists:bon_commande,id',
                'id_ville' => 'required|exists:villes,id',
                'id_devise' => 'required|exists:devises,id',
                'commentaire' => 'nullable|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.id_produit' => 'required|exists:produits,id',
                'lignes.*.quantite' => 'required|integer|min:1',
                'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
                'lignes.*.remise' => 'nullable|numeric|min:0|max:100',
                'lignes.*.id_lot' => 'nullable|exists:lots,id',
            ]);

            DB::beginTransaction();

            try {
                $total = 0;
                foreach ($validated['lignes'] as $ligne) {
                    $total += $ligne['quantite'] * $ligne['prix_unitaire_ht'] * (1 - ($ligne['remise'] ?? 0) / 100);
                }

                // Auto-générer le numéro de facture si non fourni
                if (empty($validated['numero_facture'])) {
                    $validated['numero_facture'] = CodeGenerator::facture();
                }

                $facture = Facture::create([
                    'numero_facture' => $validated['numero_facture'],
                    'date_facture' => $validated['date_facture'],
                    'date_echeance' => $validated['date_echeance'],
                    'id_partenaire_client' => $validated['id_partenaire_client'],
                    'id_bon_commande' => $validated['id_bon_commande'] ?? null,
                    'id_ville' => $validated['id_ville'],
                    'id_devise' => $validated['id_devise'],
                    'montant_ht' => $total,
                    'montant_ttc' => $total, // Pas de TVA
                    'id_utilisateur' => Auth::id(),
                    'commentaire' => $validated['commentaire'] ?? null,
                    'statut' => 'BROUILLON',
                ]);

                foreach ($validated['lignes'] as $ligne) {
                    LigneFacture::create([
                        'id_facture' => $facture->id,
                        'id_produit' => $ligne['id_produit'],
                        'id_lot' => $ligne['id_lot'] ?? null,
                        'quantite' => $ligne['quantite'],
                        'prix_unitaire_ht' => $ligne['prix_unitaire_ht'],
                        'remise' => $ligne['remise'] ?? 0,
                    ]);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $facture->load(['client', 'ville', 'devise', 'lignes.produit']),
                    'message' => 'Facture créée avec succès'
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
                'message' => 'Erreur lors de la création de la facture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'une facture
     */
    public function show($id)
    {
        try {
            $facture = Facture::with([
                'client',
                'ville',
                'devise',
                'utilisateur',
                'bonCommande',
                'lignes.produit',
                'lignes.lot',
                'paiements',
                'avoirs',
                'mouvements'
            ])->findOrFail($id);

            $facture->solde = $facture->getSolde();
            $facture->total_paye = $facture->getTotalPaye();

            return response()->json([
                'success' => true,
                'data' => $facture,
                'message' => 'Détail de la facture récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Facture non trouvée'
            ], 404);
        }
    }

    /**
     * Modifier une facture
     */
    public function update(Request $request, $id)
    {
        try {
            $facture = Facture::findOrFail($id);

            if ($facture->statut !== 'BROUILLON') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seule une facture en brouillon peut être modifiée'
                ], 403);
            }

            $validated = $request->validate([
                'date_facture' => 'sometimes|required|date',
                'date_echeance' => 'sometimes|required|date|after_or_equal:date_facture',
                'commentaire' => 'nullable|string',
                'lignes' => 'nullable|array|min:1',
                'lignes.*.id_produit' => 'required_with:lignes|exists:produits,id',
                'lignes.*.quantite' => 'required_with:lignes|integer|min:1',
                'lignes.*.prix_unitaire_ht' => 'required_with:lignes|numeric|min:0',
                'lignes.*.remise' => 'nullable|numeric|min:0|max:100',
                'lignes.*.id_lot' => 'nullable|exists:lots,id',
            ]);

            $facture->update($validated);

            if ($request->has('lignes')) {
                // Recalculer le montant total
                $total = 0;
                foreach ($validated['lignes'] as $ligne) {
                    $total += $ligne['quantite'] * $ligne['prix_unitaire_ht'] * (1 - ($ligne['remise'] ?? 0) / 100);
                }
                $facture->update(['montant_ht' => $total, 'montant_ttc' => $total]);

                // Supprimer les anciennes lignes et recréer
                $facture->lignes()->delete();
                foreach ($validated['lignes'] as $ligne) {
                    LigneFacture::create([
                        'id_facture' => $facture->id,
                        'id_produit' => $ligne['id_produit'],
                        'id_lot' => $ligne['id_lot'] ?? null,
                        'quantite' => $ligne['quantite'],
                        'prix_unitaire_ht' => $ligne['prix_unitaire_ht'],
                        'remise' => $ligne['remise'] ?? 0,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $facture->load(['client', 'ville', 'devise', 'lignes.produit', 'lignes.lot']),
                'message' => 'Facture mise à jour avec succès'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une facture
     */
    public function destroy($id)
    {
        try {
            $facture = Facture::findOrFail($id);

            if ($facture->statut !== 'BROUILLON') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seule une facture en brouillon peut être supprimée'
                ], 403);
            }

            $facture->lignes()->delete();
            $facture->delete();

            return response()->json([
                'success' => true,
                'message' => 'Facture supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Émettre une facture
     */
    public function emettre($id)
    {
        try {
            $facture = Facture::findOrFail($id);

            if ($facture->statut !== 'BROUILLON') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seule une facture en brouillon peut être émise'
                ], 403);
            }

            $facture->update(['statut' => 'EMISE']);

            return response()->json([
                'success' => true,
                'data' => $facture,
                'message' => 'Facture émise avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'émission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler une facture
     */
    public function annuler($id)
    {
        try {
            $facture = Facture::findOrFail($id);

            if (in_array($facture->statut, ['PAYEE', 'ANNULEE'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette facture ne peut pas être annulée'
                ], 403);
            }

            $facture->update(['statut' => 'ANNULEE']);

            return response()->json([
                'success' => true,
                'data' => $facture,
                'message' => 'Facture annulée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marquer une facture comme payée
     */
    public function marquerPayee($id)
    {
        try {
            $facture = Facture::findOrFail($id);

            if ($facture->statut !== 'EMISE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seule une facture émise peut être marquée comme payée'
                ], 403);
            }

            $facture->update(['statut' => 'PAYEE']);

            return response()->json([
                'success' => true,
                'data' => $facture,
                'message' => 'Facture marquée comme payée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du marquage',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer les sorties de stock à partir des lignes de facture
     */
    public function genererSortieStock($id)
    {
        try {
            $facture = Facture::with(['lignes.produit', 'lignes.lot'])->findOrFail($id);

            if (!in_array($facture->statut, ['EMISE', 'PAYEE'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'La facture doit être émise ou payée pour générer une sortie stock'
                ], 403);
            }

            // Vérifier qu'aucune sortie n'a déjà été générée
            $existingSorties = MouvementStock::where('id_facture', $facture->id)->count();
            if ($existingSorties > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une sortie stock a déjà été générée pour cette facture'
                ], 409);
            }

            // Trouver un type de mouvement de sortie
            $typeSortie = TypeMouvement::where('sens', -1)->where('actif', true)->first();
            if (!$typeSortie) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun type de mouvement de sortie disponible. Créez-en un dans Configuration > Types de mouvement.'
                ], 422);
            }

            DB::beginTransaction();

            try {
                $mouvements = [];
                foreach ($facture->lignes as $ligne) {
                    $idLot = $ligne->id_lot;

                    // Si aucun lot n'est associé, chercher un lot validé pour ce produit
                    if (!$idLot) {
                        $lotTrouve = Lot::where('id_produit', $ligne->id_produit)
                            ->where('statut_validation', 'VALIDÉ')
                            ->orderBy('id', 'desc')
                            ->first();
                        if ($lotTrouve) {
                            $idLot = $lotTrouve->id;
                            // Mettre à jour la ligne de facture avec le lot trouvé
                            $ligne->update(['id_lot' => $idLot]);
                        }
                    }

                    if (!$idLot) continue;

                    $lot = Lot::findOrFail($idLot);

                    // Vérifier le stock suffisant
                    if ($lot->quantite_disponible < $ligne->quantite) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Stock insuffisant pour le lot {$lot->numero_lot} ({$lot->produit->nom}). Disponible: {$lot->quantite_disponible}, Demandé: {$ligne->quantite}"
                        ], 422);
                    }

                    // Déduire le stock
                    $lot->quantite_disponible -= $ligne->quantite;
                    $lot->save();

                    $mouvement = MouvementStock::create([
                        'id_lot' => $idLot,
                        'id_type_mouvement' => $typeSortie->id,
                        'id_facture' => $facture->id,
                        'quantite' => $ligne->quantite,
                        'date_mouvement' => now(),
                        'id_utilisateur' => Auth::id(),
                        'reference_document' => $facture->numero_facture,
                        'commentaire' => 'Sortie générée depuis la facture ' . $facture->numero_facture,
                        'statut_validation' => 'VALIDÉ',
                        'valide_par' => Auth::id(),
                        'date_validation' => now(),
                    ]);
                    $mouvements[] = $mouvement;
                }

                if (empty($mouvements)) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Aucun lot disponible pour les produits de cette facture. Ajoutez d\'abord un lot validé pour chaque produit.'
                    ], 422);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $mouvements,
                    'message' => count($mouvements) . ' sortie(s) de stock générée(s) avec succès'
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération des sorties',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}