<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\MouvementStock;
use App\Models\Lot;
use App\Models\TypeMouvement;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MouvementStockController extends Controller
{
    /**
     * Liste des mouvements de stock
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $lotId = $request->input('lot_id');
            $typeId = $request->input('type_id');
            $villeId = $request->input('ville_id');
            $statut = $request->input('statut');
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $sortBy = $request->input('sort_by', 'date_mouvement');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = MouvementStock::with([
                'lot.produit',
                'lot.ville',
                'typeMouvement',
                'utilisateur',
                'validePar'
            ]);

            if ($search) {
                $query->whereHas('lot.produit', function($q) use ($search) {
                    $q->where('nom', 'LIKE', "%{$search}%")
                      ->orWhere('code_article', 'LIKE', "%{$search}%");
                })->orWhere('reference_document', 'LIKE', "%{$search}%");
            }

            if ($lotId) {
                $query->where('id_lot', $lotId);
            }

            if ($typeId) {
                $query->where('id_type_mouvement', $typeId);
            }

            if ($villeId) {
                $query->whereHas('lot', function($q) use ($villeId) {
                    $q->where('id_ville', $villeId);
                });
            }

            if ($statut) {
                $query->where('statut_validation', $statut);
            }

            if ($dateDebut) {
                $query->whereDate('date_mouvement', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->whereDate('date_mouvement', '<=', $dateFin);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des mouvements récupérée avec succès'
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
     * Créer un mouvement de stock (entrée ou sortie)
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_lot' => 'required|exists:lots,id',
                'id_type_mouvement' => 'required|exists:type_mouvement,id',
                'quantite' => 'required|integer|min:1',
                'date_mouvement' => 'nullable|date',
                'reference_document' => 'nullable|string|max:100',
                'commentaire' => 'nullable|string',
            ]);

            // Récupérer le lot
            $lot = Lot::findOrFail($validated['id_lot']);
            
            // Récupérer le type de mouvement
            $typeMouvement = TypeMouvement::findOrFail($validated['id_type_mouvement']);
            
            // Vérifier le stock disponible pour une sortie
            if ($typeMouvement->sens === -1) {
                if ($lot->quantite_disponible < $validated['quantite']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Stock insuffisant. Disponible: {$lot->quantite_disponible}, Demandé: {$validated['quantite']}"
                    ], 422);
                }
            }

            // Démarrer une transaction
            DB::beginTransaction();

            try {
                // Créer le mouvement
                $mouvement = MouvementStock::create([
                    'id_lot' => $validated['id_lot'],
                    'id_type_mouvement' => $validated['id_type_mouvement'],
                    'quantite' => $validated['quantite'],
                    'date_mouvement' => $validated['date_mouvement'] ?? now(),
                    'id_utilisateur' => Auth::id(),
                    'reference_document' => $validated['reference_document'] ?? null,
                    'commentaire' => $validated['commentaire'] ?? null,
                    'statut_validation' => 'EN ATTENTE',
                ]);

                // Le stock du lot n'est mis à jour qu'à la validation

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $mouvement->load(['lot.produit', 'typeMouvement', 'utilisateur']),
                    'message' => 'Mouvement de stock créé avec succès'
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
                'message' => 'Erreur lors de la création du mouvement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

  
public function show($id)
{
    try {
        $mouvement = MouvementStock::with([
            'lot.produit',
            'lot.ville',
            'lot.zone',
            'typeMouvement',
            'utilisateur',
            'validePar'
            // 'periodeInventaire' // <- Commenter ou supprimer cette ligne
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $mouvement,
            'message' => 'Détail du mouvement récupéré avec succès'
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Mouvement non trouvé'
        ], 404);
    }
}

    /**
     * Modifier un mouvement de stock
     */
    public function update(Request $request, $id)
    {
        try {
            $mouvement = MouvementStock::findOrFail($id);

            // Ne peut modifier que les mouvements non validés
            if ($mouvement->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce mouvement a déjà été validé ou rejeté'
                ], 403);
            }

            $validated = $request->validate([
                'reference_document' => 'nullable|string|max:100',
                'commentaire' => 'nullable|string',
            ]);

            $mouvement->update($validated);

            return response()->json([
                'success' => true,
                'data' => $mouvement->load(['lot.produit', 'typeMouvement']),
                'message' => 'Mouvement mis à jour avec succès'
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
     * Supprimer un mouvement de stock
     */
    public function destroy($id)
    {
        try {
            $mouvement = MouvementStock::findOrFail($id);

            // Ne peut supprimer que les mouvements non validés
            if ($mouvement->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce mouvement a déjà été validé ou rejeté'
                ], 403);
            }

            $mouvement->delete();

            return response()->json([
                'success' => true,
                'message' => 'Mouvement supprimé avec succès'
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
     * Valider un mouvement de stock
     */
    public function validateMouvement($id)
    {
        try {
            $mouvement = MouvementStock::findOrFail($id);

            if ($mouvement->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce mouvement a déjà été validé ou rejeté'
                ], 403);
            }

            DB::beginTransaction();

            try {
                $lot = $mouvement->lot;
                $typeMouvement = $mouvement->typeMouvement;

                if ($typeMouvement->sens === 1) {
                    $lot->quantite_disponible += $mouvement->quantite;
                } else {
                    if ($lot->quantite_disponible < $mouvement->quantite) {
                        throw new \Exception("Stock insuffisant. Disponible: {$lot->quantite_disponible}, Demandé: {$mouvement->quantite}");
                    }
                    $lot->quantite_disponible -= $mouvement->quantite;
                }
                $lot->save();

                $mouvement->update([
                    'statut_validation' => 'VALIDÉ',
                    'valide_par' => Auth::id(),
                    'date_validation' => now(),
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $mouvement,
                    'message' => 'Mouvement validé avec succès'
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
     * Rejeter un mouvement de stock
     */
    public function rejectMouvement($id)
    {
        try {
            $mouvement = MouvementStock::findOrFail($id);

            if ($mouvement->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce mouvement a déjà été validé ou rejeté'
                ], 403);
            }

            $mouvement->update([
                'statut_validation' => 'REJETÉ',
                'valide_par' => Auth::id(),
                'date_validation' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $mouvement,
                'message' => 'Mouvement rejeté avec succès'
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
     * Mouvements d'un lot spécifique
     */
    public function getByLot($lotId)
    {
        try {
            $lot = Lot::findOrFail($lotId);
            
            $mouvements = MouvementStock::with(['typeMouvement', 'utilisateur'])
                ->where('id_lot', $lotId)
                ->orderBy('date_mouvement', 'desc')
                ->get();

            // Calculer le solde
            $solde = 0;
            foreach ($mouvements as $m) {
                if ($m->typeMouvement->sens === 1) {
                    $solde += $m->quantite;
                } else {
                    $solde -= $m->quantite;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'lot' => $lot->load('produit'),
                    'mouvements' => $mouvements,
                    'solde_actuel' => $solde
                ],
                'message' => 'Mouvements du lot récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques des mouvements
     */
    public function statistiques(Request $request)
    {
        try {
            $villeId = $request->input('ville_id');
            $dateDebut = $request->input('date_debut', now()->startOfMonth());
            $dateFin = $request->input('date_fin', now());

            $query = MouvementStock::with('typeMouvement', 'lot');

            if ($villeId) {
                $query->whereHas('lot', function($q) use ($villeId) {
                    $q->where('id_ville', $villeId);
                });
            }

            $query->whereBetween('date_mouvement', [$dateDebut, $dateFin]);

            $mouvements = $query->get();

            $totalEntree = 0;
            $totalSortie = 0;

            foreach ($mouvements as $m) {
                if ($m->typeMouvement->sens === 1) {
                    $totalEntree += $m->quantite;
                } else {
                    $totalSortie += $m->quantite;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'periode' => [
                        'debut' => $dateDebut,
                        'fin' => $dateFin
                    ],
                    'total_entree' => $totalEntree,
                    'total_sortie' => $totalSortie,
                    'solde' => $totalEntree - $totalSortie,
                    'nombre_mouvements' => $mouvements->count()
                ],
                'message' => 'Statistiques récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}