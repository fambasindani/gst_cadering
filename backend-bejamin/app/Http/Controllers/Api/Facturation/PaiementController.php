<?php

namespace App\Http\Controllers\Api\Facturation;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    /**
     * Liste des paiements
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $factureId = $request->input('facture_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Paiement::with(['facture.client', 'utilisateur']);

            if ($factureId) {
                $query->where('id_facture', $factureId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des paiements récupérée avec succès'
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
     * Enregistrer un paiement
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_facture' => 'required|exists:facture,id',
                'montant' => 'required|numeric|min:0.01',
                'date_paiement' => 'required|date',
                'mode_paiement' => 'required|in:VIREMENT,CHEQUE,ESPECES,CARTE,AUTRE',
                'reference' => 'nullable|string|max:50',
                'commentaire' => 'nullable|string',
            ]);

            $facture = Facture::findOrFail($validated['id_facture']);

            // Vérifier que la facture est émise
            if (!in_array($facture->statut, ['EMISE', 'PAYEE'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seule une facture émise peut être payée'
                ], 403);
            }

            // Vérifier le solde
            $solde = $facture->getSolde();
            if ($validated['montant'] > $solde) {
                return response()->json([
                    'success' => false,
                    'message' => "Le montant du paiement ({$validated['montant']}) dépasse le solde dû ({$solde})"
                ], 422);
            }

            DB::beginTransaction();

            try {
                $paiement = Paiement::create([
                    'id_facture' => $validated['id_facture'],
                    'montant' => $validated['montant'],
                    'date_paiement' => $validated['date_paiement'],
                    'mode_paiement' => $validated['mode_paiement'],
                    'reference' => $validated['reference'] ?? null,
                    'id_utilisateur' => Auth::id(),
                    'commentaire' => $validated['commentaire'] ?? null,
                ]);

                // Si la facture est entièrement payée, mettre à jour le statut
                if ($facture->getSolde() <= 0) {
                    $facture->update(['statut' => 'PAYEE']);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $paiement->load(['facture.client', 'utilisateur']),
                    'message' => 'Paiement enregistré avec succès'
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
                'message' => 'Erreur lors de l\'enregistrement du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un paiement
     */
    public function show($id)
    {
        try {
            $paiement = Paiement::with(['facture.client', 'utilisateur'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $paiement,
                'message' => 'Détail du paiement récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Paiement non trouvé'
            ], 404);
        }
    }

    /**
     * Supprimer un paiement
     */
    public function destroy($id)
    {
        try {
            $paiement = Paiement::findOrFail($id);
            $facture = $paiement->facture;

            if ($facture->statut === 'PAYEE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer un paiement sur une facture déjà payée'
                ], 403);
            }

            $paiement->delete();

            // Si la facture n'est plus payée, remettre le statut à EMISE
            if ($facture->getSolde() > 0 && $facture->statut === 'PAYEE') {
                $facture->update(['statut' => 'EMISE']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Paiement supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}