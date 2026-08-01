<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\Partenaire;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PartenaireController extends Controller
{
    /**
     * Liste des partenaires
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $type = $request->input('type');
            $typeClient = $request->input('type_client');
            $magasinId = $request->input('magasin_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Partenaire::with('magasin');

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%")
                      ->orWhere('telephone', 'LIKE', "%{$search}%")
                      ->orWhere('identifiant_fiscal', 'LIKE', "%{$search}%")
                      ->orWhere('code_iata', 'LIKE', "%{$search}%");
                });
            }

            if ($type) {
                $query->where('type', $type);
            }

            if ($typeClient) {
                $query->where('type_client', $typeClient);
            }

            if ($magasinId) {
                $query->where('id_magasin', $magasinId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des partenaires récupérée avec succès'
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
     * Créer un partenaire
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'type' => 'required|in:fournisseur,client,both',
                'type_client' => 'nullable|in:aerien,non_aerien,both',
                'code_iata' => 'nullable|string|max:10',
                'nom' => 'required|string|max:150',
                'adresse' => 'nullable|string',
                'telephone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:100',
                'identifiant_fiscal' => 'nullable|string|max:50',
                'id_magasin' => 'nullable|exists:magasins,id',
                'actif' => 'nullable|boolean',
            ]);

            // ✅ Vérifier si type_client est présent avant de l'utiliser
            $typeClient = $validated['type_client'] ?? null;

            // Validation conditionnelle : si type_client est renseigné, le type doit être 'client' ou 'both'
            if ($typeClient && !in_array($validated['type'], ['client', 'both'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le type_client ne peut être renseigné que pour un partenaire de type "client" ou "both"'
                ], 422);
            }

            $partenaire = Partenaire::create([
                'type' => $validated['type'],
                'type_client' => $typeClient,
                'code_iata' => $validated['code_iata'] ?? null,
                'nom' => $validated['nom'],
                'adresse' => $validated['adresse'] ?? null,
                'telephone' => $validated['telephone'] ?? null,
                'email' => $validated['email'] ?? null,
                'identifiant_fiscal' => $validated['identifiant_fiscal'] ?? null,
                'id_magasin' => $validated['id_magasin'] ?? null,
                'actif' => $validated['actif'] ?? true,
            ]);

            return response()->json([
                'success' => true,
                'data' => $partenaire->load('magasin'),
                'message' => 'Partenaire créé avec succès'
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
                'message' => 'Erreur lors de la création du partenaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un partenaire
     */
    public function show($id)
    {
        try {
            $partenaire = Partenaire::with('magasin')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $partenaire,
                'message' => 'Détail du partenaire récupéré avec succès'
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Partenaire non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du détail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Modifier un partenaire
     */
    public function update(Request $request, $id)
    {
        try {
            $partenaire = Partenaire::findOrFail($id);

            $validated = $request->validate([
                'type' => 'sometimes|required|in:fournisseur,client,both',
                'type_client' => 'nullable|in:aerien,non_aerien,both',
                'code_iata' => 'nullable|string|max:10',
                'nom' => 'sometimes|required|string|max:150',
                'adresse' => 'nullable|string',
                'telephone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:100',
                'identifiant_fiscal' => 'nullable|string|max:50',
                'id_magasin' => 'nullable|exists:magasins,id',
                'actif' => 'nullable|boolean',
            ]);

            // ✅ Vérifier si type_client est présent
            $typeClient = $validated['type_client'] ?? null;
            $type = $validated['type'] ?? $partenaire->type;

            // Validation conditionnelle
            if ($typeClient && !in_array($type, ['client', 'both'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le type_client ne peut être renseigné que pour un partenaire de type "client" ou "both"'
                ], 422);
            }

            $partenaire->update($validated);

            return response()->json([
                'success' => true,
                'data' => $partenaire->load('magasin'),
                'message' => 'Partenaire mis à jour avec succès'
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Partenaire non trouvé'
            ], 404);
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
     * Supprimer un partenaire
     */
    public function destroy($id)
    {
        try {
            $partenaire = Partenaire::findOrFail($id);

            // Vérifier si le partenaire est utilisé
            if ($partenaire->produits()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce partenaire est utilisé comme fournisseur principal pour des produits. Supprimez-les d\'abord.'
                ], 403);
            }

            $partenaire->delete();

            return response()->json([
                'success' => true,
                'message' => 'Partenaire supprimé avec succès'
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Partenaire non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer/Désactiver un partenaire
     */
    public function toggleActif($id)
    {
        try {
            $partenaire = Partenaire::findOrFail($id);
            $partenaire->actif = !$partenaire->actif;
            $partenaire->save();

            return response()->json([
                'success' => true,
                'data' => $partenaire,
                'message' => 'Statut modifié avec succès'
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Partenaire non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut'
            ], 500);
        }
    }

    /**
     * Liste des fournisseurs uniquement
     */
    public function getFournisseurs(Request $request)
    {
        try {
            $search = $request->input('search');
            $perPage = $request->input('per_page', 15);

            $query = Partenaire::with('magasin')
                ->where(function($q) {
                    $q->where('type', 'fournisseur')
                      ->orWhere('type', 'both');
                });

            if ($search) {
                $query->where('nom', 'LIKE', "%{$search}%");
            }

            $data = $query->where('actif', true)
                         ->orderBy('nom')
                         ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des fournisseurs récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des fournisseurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des clients uniquement
     */
    public function getClients(Request $request)
    {
        try {
            $search = $request->input('search');
            $typeClient = $request->input('type_client');
            $perPage = $request->input('per_page', 15);

            $query = Partenaire::with('magasin')
                ->where(function($q) {
                    $q->where('type', 'client')
                      ->orWhere('type', 'both');
                });

            if ($search) {
                $query->where('nom', 'LIKE', "%{$search}%");
            }

            if ($typeClient) {
                $query->where('type_client', $typeClient);
            }

            $data = $query->where('actif', true)
                         ->orderBy('nom')
                         ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des clients récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des clients aériens uniquement
     */
    public function getClientsAeriens(Request $request)
    {
        try {
            $search = $request->input('search');
            $perPage = $request->input('per_page', 15);

            $query = Partenaire::with('magasin')
                ->where(function($q) {
                    $q->where('type', 'client')
                      ->orWhere('type', 'both');
                })
                ->where(function($q) {
                    $q->where('type_client', 'aerien')
                      ->orWhere('type_client', 'both');
                });

            if ($search) {
                $query->where('nom', 'LIKE', "%{$search}%");
            }

            $data = $query->where('actif', true)
                         ->orderBy('nom')
                         ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des clients aériens récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients aériens',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des clients non aériens uniquement
     */
    public function getClientsNonAeriens(Request $request)
    {
        try {
            $search = $request->input('search');
            $perPage = $request->input('per_page', 15);

            $query = Partenaire::with('magasin')
                ->where(function($q) {
                    $q->where('type', 'client')
                      ->orWhere('type', 'both');
                })
                ->where('type_client', 'non_aerien');

            if ($search) {
                $query->where('nom', 'LIKE', "%{$search}%");
            }

            $data = $query->where('actif', true)
                         ->orderBy('nom')
                         ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des clients non aériens récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients non aériens',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}