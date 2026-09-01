<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\SuiviChlore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SuiviChloreController extends Controller
{
    public function index(Request $request)
    {
        $query = SuiviChlore::with(['utilisateur', 'partenaire', 'lot.produit']);

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
        $allowed = ['id', 'date_operation', 'concentration_ppm', 'created_at'];
        if (!in_array($sortBy, $allowed)) $sortBy = 'id';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $data = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Liste des suivis chlore récupérée']);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'date_operation' => 'required|date',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'id_lot' => 'nullable|exists:lots,id',
                'concentration_ppm' => 'nullable|numeric',
                'temps_trempage_minutes' => 'nullable|integer|min:0',
                'commentaire_action_corrective' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $validated['id_utilisateur'] = Auth::id();
            $item = SuiviChlore::create($validated);
            $item->load(['utilisateur', 'partenaire', 'lot.produit']);
            DB::commit();

            return response()->json(['success' => true, 'data' => $item, 'message' => 'Suivi chlore créé avec succès'], 201);
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
                'lignes.*.id_lot' => 'nullable|exists:lots,id',
                'lignes.*.id_partenaire' => 'nullable|exists:partenaires,id',
                'lignes.*.concentration_ppm' => 'nullable|numeric',
                'lignes.*.temps_trempage_minutes' => 'nullable|integer|min:0',
                'lignes.*.commentaire_action_corrective' => 'nullable|string',
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
                $created[] = SuiviChlore::create($data);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'data' => $created,
                'message' => count($created) . ' suivi(s) chlore créé(s) avec succès',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $item = SuiviChlore::with(['utilisateur', 'partenaire', 'lot.produit'])->find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        return response()->json(['success' => true, 'data' => $item, 'message' => 'Suivi chlore récupéré']);
    }

    public function update(Request $request, $id)
    {
        $item = SuiviChlore::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $validated = $request->validate([
                'date_operation' => 'sometimes|required|date',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'id_lot' => 'nullable|exists:lots,id',
                'concentration_ppm' => 'nullable|numeric',
                'temps_trempage_minutes' => 'nullable|integer|min:0',
                'commentaire_action_corrective' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $item->update($validated);
            $item->load(['utilisateur', 'partenaire', 'lot.produit']);
            DB::commit();

            return response()->json(['success' => true, 'data' => $item, 'message' => 'Suivi chlore mis à jour']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $item = SuiviChlore::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $item->delete();
            return response()->json(['success' => true, 'message' => 'Suivi chlore supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
}
