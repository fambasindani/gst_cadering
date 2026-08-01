<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\BonCommande;
use App\Models\LigneCommande;
use App\Models\Lot;
use App\Models\MouvementStock;
use App\Models\Notification;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Helpers\CodeGenerator;

class BonCommandeController extends Controller
{
    /**
     * Liste des bons de commande
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $statut = $request->input('statut');
            $statutValidation = $request->input('statut_validation');
            $magasinId = $request->input('magasin_id');
            $partenaireId = $request->input('partenaire_id');
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = BonCommande::with([
                'partenaire',
                'magasinDestination',
                'devise',
                'utilisateur',
                'validePar',
                'lignes.produit'
            ]);

            if ($search) {
                $query->search($search);
            }

            if ($statut) {
                $query->byStatut($statut);
            }

            if ($statutValidation) {
                $query->where('statut_validation', $statutValidation);
            }

            if ($magasinId) {
                $query->byMagasin($magasinId);
            }

            if ($partenaireId) {
                $query->byPartenaire($partenaireId);
            }

            if ($dateDebut) {
                $query->whereDate('date_commande', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->whereDate('date_commande', '<=', $dateFin);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des bons de commande récupérée avec succès'
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
     * Créer un bon de commande
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'numero_commande' => 'nullable|string|max:50|unique:bon_commande,numero_commande',
                'id_partenaire' => 'required|exists:partenaires,id',
                'id_magasin_destination' => 'required|exists:magasins,id',
                'date_commande' => 'required|date',
                'date_livraison_prevue' => 'nullable|date|after_or_equal:date_commande',
                'id_devise' => 'nullable|exists:devises,id',
                'commentaire' => 'nullable|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.id_produit' => 'required|exists:produits,id',
                'lignes.*.quantite_commandee' => 'required|integer|min:1',
                'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
                'lignes.*.id_devise' => 'required|exists:devises,id',
            ]);

            DB::beginTransaction();

            try {
                // Auto-générer le numéro de commande si non fourni
                if (empty($validated['numero_commande'])) {
                    $validated['numero_commande'] = CodeGenerator::bonCommande();
                }

                // Créer le bon de commande
                $bonCommande = BonCommande::create([
                    'numero_commande' => $validated['numero_commande'],
                    'id_partenaire' => $validated['id_partenaire'],
                    'id_magasin_destination' => $validated['id_magasin_destination'],
                    'date_commande' => $validated['date_commande'],
                    'date_livraison_prevue' => $validated['date_livraison_prevue'] ?? null,
                    'id_devise' => $validated['id_devise'] ?? null,
                    'id_utilisateur' => Auth::id(),
                    'commentaire' => $validated['commentaire'] ?? null,
                    'statut' => 'BROUILLON',
                    'statut_validation' => 'EN ATTENTE',
                ]);

                // Créer les lignes de commande
                $total = 0;
                foreach ($validated['lignes'] as $ligne) {
                    $ligneCommande = LigneCommande::create([
                        'id_bon_commande' => $bonCommande->id,
                        'id_produit' => $ligne['id_produit'],
                        'quantite_commandee' => $ligne['quantite_commandee'],
                        'prix_unitaire_ht' => $ligne['prix_unitaire_ht'],
                        'id_devise' => $ligne['id_devise'],
                    ]);

                    $total += $ligne['quantite_commandee'] * $ligne['prix_unitaire_ht'];
                }

                // Mettre à jour le montant total
                $bonCommande->update(['montant_total_ht' => $total]);

                DB::commit();

                // Créer/mettre à jour une notification pour tous les utilisateurs actifs ayant la permission
                $count = BonCommande::where('statut_validation', 'EN ATTENTE')->count();
                $users = Utilisateur::actif()->get();
                foreach ($users as $user) {
                    if (!$user->hasPermission('config:bon_commande:view')) continue;
                    $existing = Notification::where('type', 'bon_commande_en_attente')
                        ->where('id_utilisateur', $user->id)
                        ->whereNull('read_at')
                        ->first();
                    if ($existing) {
                        $existing->update(['message' => "{$count} bon(s) de commande en attente de validation"]);
                    } else {
                        Notification::create([
                            'type' => 'bon_commande_en_attente',
                            'message' => "{$count} bon(s) de commande en attente de validation",
                            'id_utilisateur' => $user->id,
                            'reference_type' => BonCommande::class,
                            'reference_id' => null,
                        ]);
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => $bonCommande->load(['partenaire', 'magasinDestination', 'devise', 'lignes.produit']),
                    'message' => 'Bon de commande créé avec succès'
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
                'message' => 'Erreur lors de la création du bon de commande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un bon de commande
     */
    public function show($id)
    {
        try {
            $bonCommande = BonCommande::with([
                'partenaire',
                'magasinDestination',
                'devise',
                'utilisateur',
                'validePar',
                'lignes.produit',
                'lignes.devise'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $bonCommande,
                'message' => 'Détail du bon de commande récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bon de commande non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un bon de commande (seulement si BROUILLON)
     */
    public function update(Request $request, $id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            // Vérifier que le bon est en brouillon
            if ($bonCommande->statut !== 'BROUILLON') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un bon en brouillon peut être modifié'
                ], 403);
            }

            $validated = $request->validate([
                'id_partenaire' => 'sometimes|required|exists:partenaires,id',
                'id_magasin_destination' => 'sometimes|required|exists:magasins,id',
                'date_commande' => 'sometimes|required|date',
                'date_livraison_prevue' => 'nullable|date|after_or_equal:date_commande',
                'id_devise' => 'nullable|exists:devises,id',
                'commentaire' => 'nullable|string',
            ]);

            $bonCommande->update($validated);

            return response()->json([
                'success' => true,
                'data' => $bonCommande->load(['partenaire', 'magasinDestination', 'devise']),
                'message' => 'Bon de commande mis à jour avec succès'
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
     * Supprimer un bon de commande (seulement si BROUILLON)
     */
    public function destroy($id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            if ($bonCommande->statut !== 'BROUILLON') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un bon en brouillon peut être supprimé'
                ], 403);
            }

            // Supprimer les lignes
            $bonCommande->lignes()->delete();
            $bonCommande->delete();

            return response()->json([
                'success' => true,
                'message' => 'Bon de commande supprimé avec succès'
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
     * Valider un bon de commande
     */
    public function validateBon($id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            if ($bonCommande->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce bon a déjà été validé ou rejeté'
                ], 403);
            }

            $bonCommande->update([
                'statut_validation' => 'VALIDÉ',
                'valide_par' => Auth::id(),
                'date_validation' => now(),
                'statut' => 'ENVOYÉ',
            ]);

            // Mettre à jour les notifications existantes
            $remaining = BonCommande::where('statut_validation', 'EN ATTENTE')->count();
            if ($remaining > 0) {
                Notification::where('type', 'bon_commande_en_attente')
                    ->whereNull('read_at')
                    ->update(['message' => "{$remaining} bon(s) de commande en attente de validation"]);
            } else {
                Notification::where('type', 'bon_commande_en_attente')
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            return response()->json([
                'success' => true,
                'data' => $bonCommande,
                'message' => 'Bon de commande validé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejeter un bon de commande
     */
    public function rejectBon($id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            if ($bonCommande->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce bon a déjà été validé ou rejeté'
                ], 403);
            }

            $bonCommande->update([
                'statut_validation' => 'REJETÉ',
                'valide_par' => Auth::id(),
                'date_validation' => now(),
                'statut' => 'ANNULE',
            ]);

            // Mettre à jour les notifications existantes
            $remaining = BonCommande::where('statut_validation', 'EN ATTENTE')->count();
            if ($remaining > 0) {
                Notification::where('type', 'bon_commande_en_attente')
                    ->whereNull('read_at')
                    ->update(['message' => "{$remaining} bon(s) de commande en attente de validation"]);
            } else {
                Notification::where('type', 'bon_commande_en_attente')
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            return response()->json([
                'success' => true,
                'data' => $bonCommande,
                'message' => 'Bon de commande rejeté avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Réceptionner un bon de commande (partielle ou totale)
     */
    public function receive(Request $request, $id)
    {
        try {
            $bonCommande = BonCommande::with('lignes')->findOrFail($id);

            if (!in_array($bonCommande->statut, ['ENVOYÉ', 'REÇU PARTIELLEMENT'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un bon envoyé peut être réceptionné'
                ], 403);
            }

            $validated = $request->validate([
                'receptions' => 'required|array|min:1',
                'receptions.*.id_ligne_commande' => 'required|exists:ligne_commande,id',
                'receptions.*.quantite_recue' => 'required|integer|min:1',
                'receptions.*.numero_lot' => 'nullable|string|max:50',
                'receptions.*.date_peremption' => 'required|date|after_or_equal:today',
                'receptions.*.prix_achat_ht_unitaire' => 'nullable|numeric|min:0',
            ]);

            DB::beginTransaction();

            try {
                foreach ($validated['receptions'] as $reception) {
                    $ligne = LigneCommande::findOrFail($reception['id_ligne_commande']);
                    
                    // Vérifier que la ligne appartient bien au bon
                    if ($ligne->id_bon_commande != $bonCommande->id) {
                        throw new \Exception('Ligne de commande invalide');
                    }

                    // Vérifier la quantité
                    $quantiteRestante = $ligne->quantite_commandee - $ligne->quantite_recue;
                    if ($reception['quantite_recue'] > $quantiteRestante) {
                        throw new \Exception("Quantité reçue (${reception['quantite_recue']}) dépasse la quantité restante (${quantiteRestante})");
                    }

                    // Auto-générer le numéro de lot si non fourni
                    if (empty($reception['numero_lot'])) {
                        $reception['numero_lot'] = CodeGenerator::lot();
                    }

                    // Créer le lot
                    $lot = Lot::create([
                        'id_produit' => $ligne->id_produit,
                        'id_magasin' => $bonCommande->id_magasin_destination,
                        'numero_lot' => $reception['numero_lot'],
                        'code_qr' => 'QR-' . $reception['numero_lot'] . '-' . uniqid(),
                        'quantite_recue' => $reception['quantite_recue'],
                        'quantite_disponible' => $reception['quantite_recue'],
                        'date_peremption' => $reception['date_peremption'],
                        'date_reception' => now(),
                        'id_partenaire' => $bonCommande->id_partenaire,
                        'prix_achat_ht_unitaire' => $reception['prix_achat_ht_unitaire'] ?? $ligne->prix_unitaire_ht,
                        'id_devise' => $ligne->id_devise,
                        'statut_validation' => 'EN ATTENTE',
                    ]);

                    // Créer le mouvement d'entrée (stock déjà appliqué sur le lot)
                    MouvementStock::create([
                        'id_lot' => $lot->id,
                        'id_type_mouvement' => 1, // Entrée réception
                        'quantite' => $reception['quantite_recue'],
                        'date_mouvement' => now(),
                        'id_utilisateur' => Auth::id(),
                        'reference_document' => $bonCommande->numero_commande,
                        'commentaire' => 'Réception du bon de commande #' . $bonCommande->numero_commande,
                        'statut_validation' => 'EN ATTENTE',
                    ]);

                    // Mettre à jour la ligne de commande
                    $ligne->quantite_recue += $reception['quantite_recue'];
                    $ligne->save();
                }

                // Mettre à jour le statut du bon
                $bonCommande->refresh();
                if ($bonCommande->isComplete()) {
                    $bonCommande->statut = 'REÇU';
                } else {
                    $bonCommande->statut = 'REÇU PARTIELLEMENT';
                }
                $bonCommande->save();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $bonCommande->load(['partenaire', 'magasinDestination', 'lignes']),
                    'message' => 'Réception effectuée avec succès'
                ]);

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
                'message' => 'Erreur lors de la réception',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler un bon de commande
     */
    public function cancel($id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            if (in_array($bonCommande->statut, ['REÇU', 'ANNULE'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce bon ne peut plus être annulé'
                ], 403);
            }

            $bonCommande->statut = 'ANNULE';
            $bonCommande->save();

            return response()->json([
                'success' => true,
                'data' => $bonCommande,
                'message' => 'Bon de commande annulé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}