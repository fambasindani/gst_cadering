<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Retour;
use App\Models\LigneRetour;
use App\Models\Lot;
use App\Models\MouvementStock;
use App\Models\TypeMouvement;
use App\Models\Notification;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Helpers\CodeGenerator;

class RetourController extends Controller
{
    /**
     * Liste des retours
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $magasinId = $request->input('magasin_id');
            $statut = $request->input('statut');
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Retour::with([
                'partenaireClient',
                'partenaireDest',
                'magasin',
                'utilisateur',
                'validePar',
                'lignes.lot.produit'
            ]);

            if ($search) {
                $query->search($search);
            }

            if ($magasinId) {
                $query->byMagasin($magasinId);
            }

            if ($statut) {
                $query->byStatut($statut);
            }

            if ($dateDebut) {
                $query->whereDate('date_retour', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->whereDate('date_retour', '<=', $dateFin);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des retours récupérée avec succès'
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
     * Créer un retour
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'numero_retour' => 'nullable|string|max:50|unique:retour,numero_retour',
                'date_retour' => 'required|date',
                'id_partenaire_client' => 'nullable|exists:partenaires,id',
                'id_partenaire_dest' => 'nullable|exists:partenaires,id',
                'id_magasin' => 'required|exists:magasins,id',
                'commentaire' => 'nullable|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.id_lot' => 'required|exists:lots,id',
                'lignes.*.quantite_retournee' => 'required|integer|min:1',
                'lignes.*.motif' => 'nullable|string|max:255',
            ]);

            // Vérifier qu'au moins une provenance ou une destination est spécifiée
            if (empty($validated['id_partenaire_client']) && empty($validated['id_partenaire_dest'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'La provenance (client) ou la destination (fournisseur) est obligatoire'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Auto-générer le numéro de retour si non fourni
                if (empty($validated['numero_retour'])) {
                    $validated['numero_retour'] = CodeGenerator::retour();
                }

                // Créer le retour
                $retour = Retour::create([
                    'numero_retour' => $validated['numero_retour'],
                    'date_retour' => $validated['date_retour'],
                    'id_partenaire_client' => $validated['id_partenaire_client'] ?? null,
                    'id_partenaire_dest' => $validated['id_partenaire_dest'] ?? null,
                    'id_magasin' => $validated['id_magasin'],
                    'id_utilisateur' => Auth::id(),
                    'commentaire' => $validated['commentaire'] ?? null,
                    'statut_validation' => 'EN ATTENTE',
                ]);

                $estRetourClient = !is_null($validated['id_partenaire_client'] ?? null);

                // Créer les lignes de retour
                foreach ($validated['lignes'] as $ligne) {
                    $lot = Lot::findOrFail($ligne['id_lot']);

                    // Vérifier que le lot est dans la même magasin
                    if ($lot->id_magasin != $validated['id_magasin']) {
                        throw new \Exception('Le lot n\'appartient pas à la même magasin');
                    }

                    // Créer la ligne de retour
                    LigneRetour::create([
                        'id_retour' => $retour->id,
                        'id_lot' => $ligne['id_lot'],
                        'quantite_retournee' => $ligne['quantite_retournee'],
                        'motif' => $ligne['motif'] ?? null,
                    ]);

                    // Déterminer le type de mouvement (6 = Retour fournisseur, 7 = Retour client)
                    $typeMouvementId = $estRetourClient ? 7 : 6;

                    // Créer le mouvement de stock
                    MouvementStock::create([
                        'id_lot' => $lot->id,
                        'id_type_mouvement' => $typeMouvementId,
                        'quantite' => $ligne['quantite_retournee'],
                        'date_mouvement' => now(),
                        'id_utilisateur' => Auth::id(),
                        'reference_document' => $validated['numero_retour'],
                        'commentaire' => 'Retour: ' . ($ligne['motif'] ?? 'Retour de produit'),
                        'statut_validation' => 'EN ATTENTE',
                    ]);
                }

                DB::commit();

                // Créer/mettre à jour une notification pour tous les utilisateurs actifs ayant la permission
                $count = Retour::where('statut_validation', 'EN ATTENTE')->count();
                $users = Utilisateur::actif()->get();
                foreach ($users as $user) {
                    if (!$user->hasPermission('config:retours:view')) continue;
                    $existing = Notification::where('type', 'retour_en_attente')
                        ->where('id_utilisateur', $user->id)
                        ->whereNull('read_at')
                        ->first();
                    if ($existing) {
                        $existing->update(['message' => "{$count} retour(s) stock en attente de validation"]);
                    } else {
                        Notification::create([
                            'type' => 'retour_en_attente',
                            'message' => "{$count} retour(s) stock en attente de validation",
                            'id_utilisateur' => $user->id,
                            'reference_type' => Retour::class,
                            'reference_id' => null,
                        ]);
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => $retour->load(['partenaireClient', 'partenaireDest', 'lignes.lot.produit']),
                    'message' => 'Retour créé avec succès'
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
                'message' => 'Erreur lors de la création du retour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un retour
     */
    public function show($id)
    {
        try {
            $retour = Retour::with([
                'partenaireClient',
                'partenaireDest',
                'magasin',
                'utilisateur',
                'validePar',
                'lignes.lot.produit',
                'lignes.lot.magasin'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $retour,
                'message' => 'Détail du retour récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Retour non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un retour (seulement si EN ATTENTE)
     */
    public function update(Request $request, $id)
    {
        try {
            $retour = Retour::findOrFail($id);

            if ($retour->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce retour ne peut plus être modifié car il est ' . $retour->statut_validation
                ], 403);
            }

            $validated = $request->validate([
                'date_retour' => 'sometimes|required|date',
                'commentaire' => 'nullable|string',
            ]);

            $retour->update($validated);

            return response()->json([
                'success' => true,
                'data' => $retour,
                'message' => 'Retour mis à jour avec succès'
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
     * Supprimer un retour (seulement si EN ATTENTE)
     */
    public function destroy($id)
    {
        try {
            $retour = Retour::findOrFail($id);

            if ($retour->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce retour ne peut pas être supprimé car il est ' . $retour->statut_validation
                ], 403);
            }

            DB::beginTransaction();

            try {
                $retour->lignes()->delete();
                $retour->delete();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Retour supprimé avec succès'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Valider un retour
     */
    public function validateRetour($id)
    {
        try {
            $retour = Retour::findOrFail($id);

            if ($retour->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce retour a déjà été validé ou rejeté'
                ], 403);
            }

            DB::beginTransaction();

            try {
                $estRetourClient = !is_null($retour->id_partenaire_client);

                foreach ($retour->lignes as $ligne) {
                    $lot = $ligne->lot;

                    if ($estRetourClient) {
                        $lot->quantite_disponible += $ligne->quantite_retournee;
                    } else {
                        if ($lot->quantite_disponible < $ligne->quantite_retournee) {
                            throw new \Exception("Stock insuffisant pour le lot {$lot->numero_lot}. Disponible: {$lot->quantite_disponible}, Demandé: {$ligne->quantite_retournee}");
                        }
                        $lot->quantite_disponible -= $ligne->quantite_retournee;
                    }
                    $lot->save();
                }

                $retour->update([
                    'statut_validation' => 'VALIDÉ',
                    'valide_par' => Auth::id(),
                    'date_validation' => now(),
                ]);

                DB::commit();

                // Mettre à jour les notifications existantes
                $remaining = Retour::where('statut_validation', 'EN ATTENTE')->count();
                if ($remaining > 0) {
                    Notification::where('type', 'retour_en_attente')
                        ->whereNull('read_at')
                        ->update(['message' => "{$remaining} retour(s) stock en attente de validation"]);
                } else {
                    Notification::where('type', 'retour_en_attente')
                        ->whereNull('read_at')
                        ->update(['read_at' => now()]);
                }

                return response()->json([
                    'success' => true,
                    'data' => $retour,
                    'message' => 'Retour validé avec succès'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejeter un retour
     */
    public function rejectRetour($id)
    {
        try {
            $retour = Retour::findOrFail($id);

            if ($retour->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce retour a déjà été validé ou rejeté'
                ], 403);
            }

            $retour->update([
                'statut_validation' => 'REJETÉ',
                'valide_par' => Auth::id(),
                'date_validation' => now(),
            ]);

            // Mettre à jour les notifications existantes
            $remaining = Retour::where('statut_validation', 'EN ATTENTE')->count();
            if ($remaining > 0) {
                Notification::where('type', 'retour_en_attente')
                    ->whereNull('read_at')
                    ->update(['message' => "{$remaining} retour(s) stock en attente de validation"]);
            } else {
                Notification::where('type', 'retour_en_attente')
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            return response()->json([
                'success' => true,
                'data' => $retour,
                'message' => 'Retour rejeté avec succès'
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
     * Marquer un retour comme traité
     */
    public function traiterRetour($id)
    {
        try {
            $retour = Retour::findOrFail($id);

            if ($retour->statut_validation !== 'VALIDÉ') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un retour validé peut être marqué comme traité'
                ], 403);
            }

            $retour->update([
                'statut_validation' => 'TRAITÉ',
            ]);

            return response()->json([
                'success' => true,
                'data' => $retour,
                'message' => 'Retour marqué comme traité avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler un retour
     */
    public function cancelRetour($id)
    {
        try {
            $retour = Retour::findOrFail($id);

            if ($retour->statut_validation === 'TRAITÉ') {
                return response()->json([
                    'success' => false,
                    'message' => 'Un retour traité ne peut pas être annulé'
                ], 403);
            }

            DB::beginTransaction();

            try {
                if ($retour->statut_validation === 'VALIDÉ' || $retour->statut_validation === 'TRAITÉ') {
                    $estRetourClient = !is_null($retour->id_partenaire_client);
                    foreach ($retour->lignes as $ligne) {
                        $lot = $ligne->lot;
                        if ($estRetourClient) {
                            $lot->quantite_disponible -= $ligne->quantite_retournee;
                        } else {
                            $lot->quantite_disponible += $ligne->quantite_retournee;
                        }
                        $lot->save();
                    }
                }

                $retour->update([
                    'statut_validation' => 'ANNULE',
                    'valide_par' => Auth::id(),
                    'date_validation' => now(),
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $retour,
                    'message' => 'Retour annulé avec succès'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}