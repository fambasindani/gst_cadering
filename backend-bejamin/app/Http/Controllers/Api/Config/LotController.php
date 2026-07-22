<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Lot;
use App\Models\Produit;
use App\Models\MouvementStock;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;

class LotController extends Controller
{
    /**
     * Liste des lots
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $produitId = $request->input('produit_id');
            $villeId = $request->input('ville_id');
            $zoneId = $request->input('zone_id');
            $statut = $request->input('statut');
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Lot::with(['produit', 'ville', 'zone', 'emplacement', 'partenaire', 'devise']);

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('numero_lot', 'LIKE', "%{$search}%")
                      ->orWhere('code_qr', 'LIKE', "%{$search}%")
                      ->orWhereHas('produit', function($pq) use ($search) {
                          $pq->where('nom', 'LIKE', "%{$search}%")
                             ->orWhere('code_article', 'LIKE', "%{$search}%");
                      });
                });
            }

            if ($produitId) {
                $query->where('id_produit', $produitId);
            }

            if ($villeId) {
                $query->where('id_ville', $villeId);
            }

            if ($zoneId) {
                $query->where('id_zone', $zoneId);
            }

            if ($statut) {
                $query->where('statut_validation', $statut);
            }

            if ($dateDebut) {
                $query->whereDate('date_reception', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->whereDate('date_reception', '<=', $dateFin);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des lots récupérée avec succès'
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
     * Créer un lot (réception)
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_produit' => 'required|exists:produits,id',
                'id_ville' => 'required|exists:villes,id',
                'id_zone' => 'required|exists:zones,id',
                'id_emplacement' => 'nullable|exists:emplacements,id',
                'numero_lot' => 'required|string|max:50',
                'quantite_recue' => 'required|integer|min:1',
                'date_peremption' => 'required|date|after:today',
                'date_fabrication' => 'nullable|date',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'prix_achat_ht_unitaire' => 'nullable|numeric|min:0',
                'id_devise' => 'nullable|exists:devises,id',
                'commentaire' => 'nullable|string',
            ]);

            // Générer le code QR
            $codeQr = Lot::generateQrCode($validated['numero_lot']);

            $lot = Lot::create([
                'id_produit' => $validated['id_produit'],
                'id_ville' => $validated['id_ville'],
                'id_zone' => $validated['id_zone'],
                'id_emplacement' => $validated['id_emplacement'] ?? null,
                'numero_lot' => $validated['numero_lot'],
                'code_qr' => $codeQr,
                'quantite_recue' => $validated['quantite_recue'],
                'quantite_disponible' => $validated['quantite_recue'],
                'date_peremption' => $validated['date_peremption'],
                'date_fabrication' => $validated['date_fabrication'] ?? null,
                'date_reception' => now(),
                'id_partenaire' => $validated['id_partenaire'] ?? null,
                'prix_achat_ht_unitaire' => $validated['prix_achat_ht_unitaire'] ?? null,
                'id_devise' => $validated['id_devise'] ?? null,
                'commentaire' => $validated['commentaire'] ?? null,
                'statut_validation' => 'EN ATTENTE',
            ]);

            // Créer le mouvement d'entrée
            MouvementStock::create([
                'id_lot' => $lot->id,
                'id_type_mouvement' => 1, // Entrée réception
                'quantite' => $validated['quantite_recue'],
                'id_utilisateur' => Auth::id(),
                'reference_document' => $validated['numero_lot'],
                'commentaire' => 'Réception de lot',
                'statut_validation' => 'EN ATTENTE',
            ]);

            return response()->json([
                'success' => true,
                'data' => $lot->load(['produit', 'ville', 'zone', 'partenaire']),
                'message' => 'Lot créé avec succès'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du lot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un lot
     */
    public function show($id)
    {
        try {
            $lot = Lot::with([
                'produit', 'ville', 'zone', 'emplacement',
                'partenaire', 'devise', 'validePar',
                'mouvements' => function($query) {
                    $query->orderBy('created_at', 'desc')->with('typeMouvement', 'utilisateur');
                }
            ])->findOrFail($id);

            // Ajouter le statut
            $lot->statut_actuel = $lot->getStatut();

            return response()->json([
                'success' => true,
                'data' => $lot,
                'message' => 'Détail du lot récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lot non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un lot
     */
    public function update(Request $request, $id)
    {
        try {
            $lot = Lot::findOrFail($id);

            $validated = $request->validate([
                'id_zone' => 'sometimes|required|exists:zones,id',
                'id_emplacement' => 'nullable|exists:emplacements,id',
                'date_peremption' => 'sometimes|required|date|after:today',
                'commentaire' => 'nullable|string',
            ]);

            $lot->update($validated);

            return response()->json([
                'success' => true,
                'data' => $lot->load(['produit', 'ville', 'zone']),
                'message' => 'Lot mis à jour avec succès'
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
     * Supprimer un lot
     */
    public function destroy($id)
    {
        try {
            $lot = Lot::findOrFail($id);

            // Vérifier si le lot a des mouvements
            if ($lot->mouvements()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce lot a des mouvements associés. Supprimez-les d\'abord.'
                ], 403);
            }

            $lot->delete();

            return response()->json([
                'success' => true,
                'message' => 'Lot supprimé avec succès'
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
     * Valider un lot
     */
    public function validateLot($id)
    {
        try {
            $lot = Lot::findOrFail($id);

            if ($lot->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce lot a déjà été validé ou rejeté'
                ], 403);
            }

            $lot->update([
                'statut_validation' => 'VALIDÉ',
                'valide_par' => Auth::id(),
                'date_validation' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $lot,
                'message' => 'Lot validé avec succès'
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
     * Rejeter un lot
     */
    public function rejectLot($id)
    {
        try {
            $lot = Lot::findOrFail($id);

            if ($lot->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce lot a déjà été validé ou rejeté'
                ], 403);
            }

            $lot->update([
                'statut_validation' => 'REJETÉ',
                'valide_par' => Auth::id(),
                'date_validation' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $lot,
                'message' => 'Lot rejeté avec succès'
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
     * Lots proches de la péremption
     */
    public function peremptionProche(Request $request)
    {
        try {
            $jours = $request->input('jours', 7);
            $villeId = $request->input('ville_id');

            $query = Lot::with(['produit', 'ville', 'zone'])
                ->where('quantite_disponible', '>', 0)
                ->where('statut_validation', 'VALIDÉ')
                ->whereBetween('date_peremption', [now(), now()->addDays($jours)]);

            if ($villeId) {
                $query->where('id_ville', $villeId);
            }

            $data = $query->orderBy('date_peremption')->get();

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Lots proches de la péremption récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des lots',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Scanner un lot par QR code
     */
    public function scan($codeQr)
    {
        try {
            $lot = Lot::with(['produit', 'ville', 'zone', 'emplacement'])
                ->where('code_qr', $codeQr)
                ->firstOrFail();

            $lot->statut_actuel = $lot->getStatut();

            return response()->json([
                'success' => true,
                'data' => $lot,
                'message' => 'Lot scanné avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'QR code non trouvé'
            ], 404);
        }
    }
}