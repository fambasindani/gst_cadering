<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Helpers\CodeGenerator;
use App\Models\Tracabilite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TracabiliteController extends Controller
{
    public function index(Request $request)
    {
        $query = Tracabilite::with([
            'lot.produit',
            'lot.magasin',
            'utilisateur',
            'departement',
            'partenaire',
        ]);

        // Filtre : admin voit tout, les autres voient leurs enregistrements uniquement
        $user = Auth::user();
        if (!$user->hasRole('ADMIN')) {
            $query->where('id_utilisateur', $user->id);
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->search($search);
        }

        // Filtre par plage de dates
        if ($request->filled('date_debut')) {
            $query->byDateDebut($request->input('date_debut'));
        }
        if ($request->filled('date_fin')) {
            $query->byDateFin($request->input('date_fin'));
        }

        // Filtre par utilisateur (admin uniquement)
        if ($request->filled('utilisateur_id') && $user->hasRole('ADMIN')) {
            $query->where('id_utilisateur', $request->input('utilisateur_id'));
        }

        // Filtre par lot
        if ($request->filled('lot_id')) {
            $query->where('id_lot', $request->input('lot_id'));
        }

        // Tri
        $sortBy = $request->input('sort_by', 'id');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowed = ['id', 'numero_tracabilite', 'date_tracabilite', 'quantite', 'created_at'];
        if (!in_array($sortBy, $allowed)) {
            $sortBy = 'id';
        }
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $data = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Liste des traçabilités récupérée avec succès',
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_lot' => 'required|exists:lots,id',
                'id_departement' => 'nullable|exists:departements,id',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'quantite' => 'required|integer|min:1',
                'commentaire' => 'nullable|string|max:500',
                'date_tracabilite' => 'required|date',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $tracabilite = Tracabilite::create([
                'numero_tracabilite' => CodeGenerator::tracabilite(),
                'id_lot' => $validated['id_lot'],
                'id_utilisateur' => Auth::id(),
                'id_departement' => $validated['id_departement'] ?? null,
                'id_partenaire' => $validated['id_partenaire'] ?? null,
                'quantite' => $validated['quantite'],
                'commentaire' => $validated['commentaire'] ?? null,
                'date_tracabilite' => $validated['date_tracabilite'],
            ]);

            $tracabilite->load(['lot.produit', 'lot.magasin', 'utilisateur', 'departement', 'partenaire']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $tracabilite,
                'message' => 'Traçabilité créée avec succès',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function storeMultiple(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_departement' => 'nullable|exists:departements,id',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'date_tracabilite' => 'required|date',
                'lignes' => 'required|array|min:1',
                'lignes.*.id_lot' => 'required|exists:lots,id',
                'lignes.*.quantite' => 'required|integer|min:1',
                'lignes.*.commentaire' => 'nullable|string|max:500',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $created = [];
            $idUtilisateur = Auth::id();

            foreach ($validated['lignes'] as $ligne) {
                $tracabilite = Tracabilite::create([
                    'numero_tracabilite' => CodeGenerator::tracabilite(),
                    'id_lot' => $ligne['id_lot'],
                    'id_utilisateur' => $idUtilisateur,
                    'id_departement' => $validated['id_departement'] ?? null,
                    'id_partenaire' => $validated['id_partenaire'] ?? null,
                    'quantite' => $ligne['quantite'],
                    'commentaire' => $ligne['commentaire'] ?? null,
                    'date_tracabilite' => $validated['date_tracabilite'],
                ]);

                $tracabilite->load(['lot.produit', 'lot.magasin', 'utilisateur', 'departement', 'partenaire']);
                $created[] = $tracabilite;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $created,
                'message' => count($created) . ' traçabilité(s) créée(s) avec succès',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        $tracabilite = Tracabilite::with([
            'lot.produit',
            'lot.magasin',
            'lot.partenaire',
            'utilisateur',
            'departement',
            'partenaire',
        ])->find($id);

        if (!$tracabilite) {
            return response()->json([
                'success' => false,
                'message' => 'Traçabilité non trouvée',
            ], 404);
        }

        // Non-admin ne peut voir que ses propres enregistrements
        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $tracabilite->id_utilisateur !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $tracabilite,
            'message' => 'Traçabilité récupérée avec succès',
        ]);
    }

    public function update(Request $request, $id)
    {
        $tracabilite = Tracabilite::find($id);

        if (!$tracabilite) {
            return response()->json([
                'success' => false,
                'message' => 'Traçabilité non trouvée',
            ], 404);
        }

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $tracabilite->id_utilisateur !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé',
            ], 403);
        }

        try {
            $validated = $request->validate([
                'id_lot' => 'sometimes|required|exists:lots,id',
                'id_departement' => 'nullable|exists:departements,id',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'quantite' => 'sometimes|required|integer|min:1',
                'commentaire' => 'nullable|string|max:500',
                'date_tracabilite' => 'sometimes|required|date',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $tracabilite->update($validated);
            $tracabilite->load(['lot.produit', 'lot.magasin', 'utilisateur', 'departement', 'partenaire']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $tracabilite,
                'message' => 'Traçabilité mise à jour avec succès',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $tracabilite = Tracabilite::find($id);

        if (!$tracabilite) {
            return response()->json([
                'success' => false,
                'message' => 'Traçabilité non trouvée',
            ], 404);
        }

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $tracabilite->id_utilisateur !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé',
            ], 403);
        }

        try {
            $tracabilite->delete();

            return response()->json([
                'success' => true,
                'message' => 'Traçabilité supprimée avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage(),
            ], 500);
        }
    }
}
