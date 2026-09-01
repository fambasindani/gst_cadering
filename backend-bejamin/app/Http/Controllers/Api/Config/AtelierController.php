<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\AtelierTracabilite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AtelierController extends Controller
{
    public function index(Request $request)
    {
        $query = AtelierTracabilite::with(['utilisateur', 'partenaire', 'lot.produit']);

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
        if ($request->filled('type_atelier')) {
            $query->where('type_atelier', $request->input('type_atelier'));
        }

        $sortBy = $request->input('sort_by', 'id');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowed = ['id', 'date_operation', 'type_atelier', 'created_at'];
        if (!in_array($sortBy, $allowed)) $sortBy = 'id';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $data = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Liste des ateliers récupérée']);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'type_atelier' => 'required|in:DRESSAGE,MONTAGE',
                'date_operation' => 'required|date',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'id_lot' => 'nullable|exists:lots,id',
                'temperature_atelier' => 'nullable|numeric',
                'code_prestation' => 'nullable|string|max:50',
                'quantite' => 'nullable|string|max:50',
                'produits_utilises' => 'nullable|string',
                'code_couleur_produit_dlc' => 'nullable|string|max:100',
                'cycle_classe' => 'nullable|string|max:50',
                'heure_debut' => 'nullable|date_format:H:i',
                'temperature_surface_debut' => 'nullable|numeric',
                'heure_fin' => 'nullable|date_format:H:i',
                'temperature_surface_fin' => 'nullable|numeric',
                'action_corrective' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $validated['id_utilisateur'] = Auth::id();
            $item = AtelierTracabilite::create($validated);
            $item->load(['utilisateur', 'partenaire', 'lot.produit']);
            DB::commit();

            return response()->json(['success' => true, 'data' => $item, 'message' => 'Atelier créé avec succès'], 201);
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
                'lignes.*.temperature_atelier' => 'nullable|numeric',
                'lignes.*.code_prestation' => 'nullable|string|max:50',
                'lignes.*.quantite' => 'nullable|string|max:50',
                'lignes.*.produits_utilises' => 'nullable|string',
                'lignes.*.code_couleur_produit_dlc' => 'nullable|string|max:100',
                'lignes.*.cycle_classe' => 'nullable|string|max:50',
                'lignes.*.heure_debut' => 'nullable|date_format:H:i',
                'lignes.*.temperature_surface_debut' => 'nullable|numeric',
                'lignes.*.heure_fin' => 'nullable|date_format:H:i',
                'lignes.*.temperature_surface_fin' => 'nullable|numeric',
                'lignes.*.action_corrective' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $userId = Auth::id();
            $typeAtelier = $request->input('type_atelier');
            $dateOperation = $request->input('date_operation');
            $created = [];

            foreach ($lignes as $ligne) {
                $data = array_merge($ligne, [
                    'type_atelier' => $typeAtelier,
                    'date_operation' => $dateOperation,
                    'id_utilisateur' => $userId,
                ]);
                $created[] = AtelierTracabilite::create($data);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'data' => $created,
                'message' => count($created) . ' atelier(s) créé(s) avec succès',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $item = AtelierTracabilite::with(['utilisateur', 'partenaire', 'lot.produit'])->find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        return response()->json(['success' => true, 'data' => $item, 'message' => 'Atelier récupéré']);
    }

    public function update(Request $request, $id)
    {
        $item = AtelierTracabilite::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $validated = $request->validate([
                'type_atelier' => 'sometimes|required|in:DRESSAGE,MONTAGE',
                'date_operation' => 'sometimes|required|date',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'id_lot' => 'nullable|exists:lots,id',
                'temperature_atelier' => 'nullable|numeric',
                'code_prestation' => 'nullable|string|max:50',
                'quantite' => 'nullable|string|max:50',
                'produits_utilises' => 'nullable|string',
                'code_couleur_produit_dlc' => 'nullable|string|max:100',
                'cycle_classe' => 'nullable|string|max:50',
                'heure_debut' => 'nullable|date_format:H:i',
                'temperature_surface_debut' => 'nullable|numeric',
                'heure_fin' => 'nullable|date_format:H:i',
                'temperature_surface_fin' => 'nullable|numeric',
                'action_corrective' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $item->update($validated);
            $item->load(['utilisateur', 'partenaire', 'lot.produit']);
            DB::commit();

            return response()->json(['success' => true, 'data' => $item, 'message' => 'Atelier mis à jour']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $item = AtelierTracabilite::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $item->delete();
            return response()->json(['success' => true, 'message' => 'Atelier supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
}
