<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\CuissonTracabilite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CuissonController extends Controller
{
    public function index(Request $request)
    {
        $query = CuissonTracabilite::with(['utilisateur', 'partenaire', 'lot.produit']);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN')) {
            $query->where('id_utilisateur', $user->id);
        }

        if ($request->filled('search')) $query->search($request->input('search'));
        if ($request->filled('date_debut')) $query->byDateDebut($request->input('date_debut'));
        if ($request->filled('date_fin')) $query->byDateFin($request->input('date_fin'));
        if ($request->filled('utilisateur_id') && $user->hasRole('ADMIN')) {
            $query->where('id_utilisateur', $request->input('utilisateur_id'));
        }

        $sortBy = $request->input('sort_by', 'id');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowed = ['id', 'date_operation', 'created_at'];
        if (!in_array($sortBy, $allowed)) $sortBy = 'id';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $data = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Liste des cuissons récupérée']);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'date_operation' => 'required|date',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'id_lot' => 'nullable|exists:lots,id',
                'mise_en_decongelation' => 'nullable|string|max:50',
                'code_couleur' => 'nullable|string|max:50',
                'quantite_avant_cuisson' => 'nullable|string|max:50',
                'quantite_apres_cuisson' => 'nullable|string|max:50',
                'dlc_dluo' => 'nullable|string|max:50',
                'numero_lot_cree' => 'nullable|string|max:100',
                'mode_cuisson' => 'nullable|string|max:50',
                'heure_fin_cuisson' => 'nullable|date_format:H:i',
                'temperature_coeur_cuisson' => 'nullable|numeric',
                'heure_debut_refroidissement' => 'nullable|date_format:H:i',
                'heure_fin_refroidissement' => 'nullable|date_format:H:i',
                'temperature_coeur_refroidissement' => 'nullable|numeric',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $validated['id_utilisateur'] = Auth::id();
            $item = CuissonTracabilite::create($validated);
            $item->load(['utilisateur', 'partenaire', 'lot.produit']);
            DB::commit();

            return response()->json(['success' => true, 'data' => $item, 'message' => 'Cuisson créée avec succès'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function storeBulk(Request $request)
    {
        $lignes = $request->input('lignes', []);
        if (empty($lignes)) {
            return response()->json(['success' => false, 'message' => 'Aucune ligne à enregistrer'], 422);
        }

        try {
            $request->validate([
                'lignes' => 'required|array|min:1',
                '*.id_lot' => 'nullable|exists:lots,id',
                '*.id_partenaire' => 'nullable|exists:partenaires,id',
                '*.mise_en_decongelation' => 'nullable|string|max:50',
                '*.code_couleur' => 'nullable|string|max:50',
                '*.quantite_avant_cuisson' => 'nullable|string|max:50',
                '*.quantite_apres_cuisson' => 'nullable|string|max:50',
                '*.dlc_dluo' => 'nullable|string|max:50',
                '*.numero_lot_cree' => 'nullable|string|max:100',
                '*.mode_cuisson' => 'nullable|string|max:50',
                '*.heure_fin_cuisson' => 'nullable|date_format:H:i',
                '*.temperature_coeur_cuisson' => 'nullable|numeric',
                '*.heure_debut_refroidissement' => 'nullable|date_format:H:i',
                '*.heure_fin_refroidissement' => 'nullable|date_format:H:i',
                '*.temperature_coeur_refroidissement' => 'nullable|numeric',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $userId = Auth::id();
            $dateOperation = $request->input('date_operation');
            $created = [];

            foreach ($lignes as $ligne) {
                $data = array_merge($ligne, [
                    'date_operation' => $dateOperation,
                    'id_utilisateur' => $userId,
                ]);
                $created[] = CuissonTracabilite::create($data);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'data' => $created,
                'message' => count($created) . ' cuisson(s) créée(s) avec succès',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $item = CuissonTracabilite::with(['utilisateur', 'partenaire', 'lot.produit'])->find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvée'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        return response()->json(['success' => true, 'data' => $item, 'message' => 'Cuisson récupérée']);
    }

    public function update(Request $request, $id)
    {
        $item = CuissonTracabilite::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvée'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $validated = $request->validate([
                'date_operation' => 'sometimes|required|date',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'id_lot' => 'nullable|exists:lots,id',
                'mise_en_decongelation' => 'nullable|string|max:50',
                'code_couleur' => 'nullable|string|max:50',
                'quantite_avant_cuisson' => 'nullable|string|max:50',
                'quantite_apres_cuisson' => 'nullable|string|max:50',
                'dlc_dluo' => 'nullable|string|max:50',
                'numero_lot_cree' => 'nullable|string|max:100',
                'mode_cuisson' => 'nullable|string|max:50',
                'heure_fin_cuisson' => 'nullable|date_format:H:i',
                'temperature_coeur_cuisson' => 'nullable|numeric',
                'heure_debut_refroidissement' => 'nullable|date_format:H:i',
                'heure_fin_refroidissement' => 'nullable|date_format:H:i',
                'temperature_coeur_refroidissement' => 'nullable|numeric',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $item->update($validated);
            $item->load(['utilisateur', 'partenaire', 'lot.produit']);
            DB::commit();

            return response()->json(['success' => true, 'data' => $item, 'message' => 'Cuisson mise à jour']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $item = CuissonTracabilite::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvée'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $item->delete();
            return response()->json(['success' => true, 'message' => 'Cuisson supprimée avec succès']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
}
