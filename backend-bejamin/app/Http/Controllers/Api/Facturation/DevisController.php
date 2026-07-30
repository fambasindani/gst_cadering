<?php

namespace App\Http\Controllers\Api\Facturation;

use App\Http\Controllers\Controller;
use App\Models\Devis;
use App\Models\LigneDevis;
use App\Models\BonCommande;
use App\Models\LigneCommande;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Helpers\CodeGenerator;

class DevisController extends Controller
{
    /**
     * Liste des devis
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $clientId = $request->input('client_id');
            $statut = $request->input('statut');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Devis::with(['client', 'ville', 'devise', 'utilisateur', 'lignes.produit']);

            if ($search) {
                $query->where('numero_devis', 'LIKE', "%{$search}%")
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

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des devis récupérée avec succès'
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
     * Créer un devis
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'numero_devis' => 'nullable|string|max:50|unique:devis,numero_devis',
                'date_devis' => 'required|date',
                'date_validite' => 'nullable|date|after_or_equal:date_devis',
                'id_partenaire_client' => 'required|exists:partenaires,id',
                'id_ville' => 'required|exists:villes,id',
                'id_devise' => 'required|exists:devises,id',
                'commentaire' => 'nullable|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.id_produit' => 'required|exists:produits,id',
                'lignes.*.quantite' => 'required|integer|min:1',
                'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
                'lignes.*.remise' => 'nullable|numeric|min:0|max:100',
            ]);

            DB::beginTransaction();

            try {
                // Auto-générer le numéro de devis si non fourni
                if (empty($validated['numero_devis'])) {
                    $validated['numero_devis'] = CodeGenerator::devis();
                }

                $devis = Devis::create([
                    'numero_devis' => $validated['numero_devis'],
                    'date_devis' => $validated['date_devis'],
                    'date_validite' => $validated['date_validite'] ?? null,
                    'id_partenaire_client' => $validated['id_partenaire_client'],
                    'id_ville' => $validated['id_ville'],
                    'id_devise' => $validated['id_devise'],
                    'id_utilisateur' => Auth::id(),
                    'commentaire' => $validated['commentaire'] ?? null,
                    'statut' => 'BROUILLON',
                ]);

                $total = 0;
                foreach ($validated['lignes'] as $ligne) {
                    $montantLigne = $ligne['quantite'] * $ligne['prix_unitaire_ht'] * (1 - ($ligne['remise'] ?? 0) / 100);
                    $total += $montantLigne;

                    LigneDevis::create([
                        'id_devis' => $devis->id,
                        'id_produit' => $ligne['id_produit'],
                        'quantite' => $ligne['quantite'],
                        'prix_unitaire_ht' => $ligne['prix_unitaire_ht'],
                        'remise' => $ligne['remise'] ?? 0,
                    ]);
                }

                $devis->update(['montant_ht' => $total]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $devis->load(['client', 'ville', 'devise', 'lignes.produit']),
                    'message' => 'Devis créé avec succès'
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
                'message' => 'Erreur lors de la création du devis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un devis
     */
    public function show($id)
    {
        try {
            $devis = Devis::with(['client', 'ville', 'devise', 'utilisateur', 'lignes.produit'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $devis,
                'message' => 'Détail du devis récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Devis non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un devis
     */
    public function update(Request $request, $id)
    {
        try {
            $devis = Devis::findOrFail($id);

            if ($devis->statut !== 'BROUILLON') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un devis en brouillon peut être modifié'
                ], 403);
            }

            $validated = $request->validate([
                'date_devis' => 'sometimes|required|date',
                'date_validite' => 'nullable|date|after_or_equal:date_devis',
                'id_partenaire_client' => 'sometimes|required|exists:partenaires,id',
                'id_ville' => 'sometimes|required|exists:villes,id',
                'id_devise' => 'sometimes|required|exists:devises,id',
                'commentaire' => 'nullable|string',
            ]);

            $devis->update($validated);

            return response()->json([
                'success' => true,
                'data' => $devis->load(['client', 'ville', 'devise']),
                'message' => 'Devis mis à jour avec succès'
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
     * Supprimer un devis
     */
    public function destroy($id)
    {
        try {
            $devis = Devis::findOrFail($id);

            if ($devis->statut !== 'BROUILLON') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un devis en brouillon peut être supprimé'
                ], 403);
            }

            $devis->lignes()->delete();
            $devis->delete();

            return response()->json([
                'success' => true,
                'message' => 'Devis supprimé avec succès'
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
     * Transformer un devis en commande
     */
    public function transformerEnCommande($id)
    {
        try {
            $devis = Devis::with(['client', 'ville', 'lignes.produit'])->findOrFail($id);

            if ($devis->statut !== 'ACCEPTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un devis accepté peut être transformé en commande'
                ], 403);
            }

            DB::beginTransaction();

            try {
                // Créer le bon de commande
                $bonCommande = BonCommande::create([
                    'numero_commande' => 'CMD-' . $devis->numero_devis,
                    'id_partenaire' => $devis->id_partenaire_client,
                    'id_ville_destination' => $devis->id_ville,
                    'date_commande' => now(),
                    'id_devise' => $devis->id_devise,
                    'id_utilisateur' => Auth::id(),
                    'statut' => 'BROUILLON',
                    'statut_validation' => 'EN ATTENTE',
                    'commentaire' => 'Commande issue du devis ' . $devis->numero_devis,
                ]);

                $total = 0;
                foreach ($devis->lignes as $ligne) {
                    $ligneCommande = LigneCommande::create([
                        'id_bon_commande' => $bonCommande->id,
                        'id_produit' => $ligne->id_produit,
                        'quantite_commandee' => $ligne->quantite,
                        'prix_unitaire_ht' => $ligne->prix_unitaire_ht,
                        'id_devise' => $devis->id_devise,
                    ]);

                    $total += $ligneCommande->quantite_commandee * $ligneCommande->prix_unitaire_ht;
                }

                $bonCommande->update(['montant_total_ht' => $total]);

                // Mettre à jour le devis
                $devis->update(['statut' => 'TRANSFORME_EN_COMMANDE']);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'devis' => $devis,
                        'bon_commande' => $bonCommande->load(['partenaire', 'villeDestination', 'lignes.produit'])
                    ],
                    'message' => 'Devis transformé en commande avec succès'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la transformation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Changer le statut d'un devis
     */
    public function changeStatut(Request $request, $id)
    {
        try {
            $devis = Devis::findOrFail($id);

            $validated = $request->validate([
                'statut' => 'required|in:BROUILLON,ENVOYE,ACCEPTE,REFUSE,TRANSFORME_EN_COMMANDE',
            ]);

            $devis->update(['statut' => $validated['statut']]);

            return response()->json([
                'success' => true,
                'data' => $devis,
                'message' => 'Statut du devis mis à jour avec succès'
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
                'message' => 'Erreur lors du changement de statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}