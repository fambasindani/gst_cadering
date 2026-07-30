<?php

namespace App\Http\Controllers\Api\Facturation;

use App\Http\Controllers\Controller;
use App\Models\Avoir;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CodeGenerator;

class AvoirController extends Controller
{
    /**
     * Liste des avoirs
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $clientId = $request->input('client_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Avoir::with(['client', 'factureOrigine', 'devise', 'utilisateur']);

            if ($search) {
                $query->where('numero_avoir', 'LIKE', "%{$search}%");
            }

            if ($clientId) {
                $query->where('id_partenaire_client', $clientId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des avoirs récupérée avec succès'
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
     * Créer un avoir
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'numero_avoir' => 'nullable|string|max:50|unique:avoir,numero_avoir',
                'date_avoir' => 'required|date',
                'id_partenaire_client' => 'required|exists:partenaires,id',
                'id_facture_origine' => 'nullable|exists:facture,id',
                'id_retour' => 'nullable|exists:retour,id',
                'id_devise' => 'required|exists:devises,id',
                'montant_ht' => 'required|numeric|min:0.01',
                'commentaire' => 'nullable|string',
            ]);

            // Vérifier qu'au moins une des deux est spécifiée
            if (!($validated['id_facture_origine'] ?? null) && !($validated['id_retour'] ?? null)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La facture d\'origine ou le retour est obligatoire'
                ], 422);
            }

            // Auto-générer le numéro d'avoir si non fourni
            if (empty($validated['numero_avoir'])) {
                $validated['numero_avoir'] = CodeGenerator::avoir();
            }

            $avoir = Avoir::create([
                'numero_avoir' => $validated['numero_avoir'],
                'date_avoir' => $validated['date_avoir'],
                'id_partenaire_client' => $validated['id_partenaire_client'],
                'id_facture_origine' => $validated['id_facture_origine'] ?? null,
                'id_retour' => $validated['id_retour'] ?? null,
                'id_devise' => $validated['id_devise'],
                'montant_ht' => $validated['montant_ht'],
                'id_utilisateur' => Auth::id(),
                'commentaire' => $validated['commentaire'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'data' => $avoir->load(['client', 'factureOrigine', 'devise']),
                'message' => 'Avoir créé avec succès'
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
                'message' => 'Erreur lors de la création de l\'avoir',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un avoir
     */
    public function show($id)
    {
        try {
            $avoir = Avoir::with(['client', 'factureOrigine', 'retour', 'devise', 'utilisateur'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $avoir,
                'message' => 'Détail de l\'avoir récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Avoir non trouvé'
            ], 404);
        }
    }

    /**
     * Supprimer un avoir
     */
    public function destroy($id)
    {
        try {
            $avoir = Avoir::findOrFail($id);
            $avoir->delete();

            return response()->json([
                'success' => true,
                'message' => 'Avoir supprimé avec succès'
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