<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\HistoriquePrix;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;

class HistoriquePrixController extends Controller
{
    /**
     * Liste des historiques de prix
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $produitId = $request->input('produit_id');
            $search = $request->input('search');
            $sortBy = $request->input('sort_by', 'date_application');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = HistoriquePrix::with(['produit', 'devise', 'utilisateur']);

            if ($produitId) {
                $query->where('id_produit', $produitId);
            }

            if ($search) {
                $query->whereHas('produit', function($q) use ($search) {
                    $q->where('nom', 'LIKE', "%{$search}%")
                      ->orWhere('code_article', 'LIKE', "%{$search}%");
                });
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Historique des prix récupéré avec succès'
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
     * Ajouter un prix à l'historique
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_produit' => 'required|exists:produits,id',
                'prix_achat_ht' => 'required|numeric|min:0',
                'id_devise' => 'required|exists:devises,id',
                'date_application' => 'nullable|date',
                'commentaire' => 'nullable|string',
            ]);

            $historique = HistoriquePrix::create([
                'id_produit' => $validated['id_produit'],
                'prix_achat_ht' => $validated['prix_achat_ht'],
                'id_devise' => $validated['id_devise'],
                'date_application' => $validated['date_application'] ?? now(),
                'commentaire' => $validated['commentaire'] ?? null,
                'id_utilisateur' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $historique->load(['produit', 'devise', 'utilisateur']),
                'message' => 'Prix ajouté à l\'historique avec succès'
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
                'message' => 'Erreur lors de l\'ajout du prix',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un historique de prix
     */
    public function show($id)
    {
        try {
            $historique = HistoriquePrix::with(['produit', 'devise', 'utilisateur'])
                                       ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $historique,
                'message' => 'Détail de l\'historique récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Historique non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un historique de prix
     */
    public function update(Request $request, $id)
    {
        try {
            $historique = HistoriquePrix::findOrFail($id);

            $validated = $request->validate([
                'prix_achat_ht' => 'sometimes|required|numeric|min:0',
                'id_devise' => 'sometimes|required|exists:devises,id',
                'date_application' => 'nullable|date',
                'commentaire' => 'nullable|string',
            ]);

            $historique->update($validated);

            return response()->json([
                'success' => true,
                'data' => $historique->load(['produit', 'devise', 'utilisateur']),
                'message' => 'Historique mis à jour avec succès'
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
     * Supprimer un historique de prix
     */
    public function destroy($id)
    {
        try {
            $historique = HistoriquePrix::findOrFail($id);
            $historique->delete();

            return response()->json([
                'success' => true,
                'message' => 'Historique supprimé avec succès'
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
     * Dernier prix d'un produit
     */
    public function dernierPrix($produitId)
    {
        try {
            $produit = Produit::findOrFail($produitId);
            
            $dernierAchat = $produit->getDernierPrixAchat();

            return response()->json([
                'success' => true,
                'data' => [
                    'produit' => $produit->nom,
                    'dernier_prix_achat' => $dernierAchat ? [
                        'prix' => $dernierAchat->prix_achat_ht,
                        'devise' => $dernierAchat->devise->code,
                        'date' => $dernierAchat->date_application,
                    ] : null,
                ],
                'message' => 'Derniers prix récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des prix',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}