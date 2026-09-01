<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\ControleLivraison;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ControleLivraisonController extends Controller
{
    public function index(Request $request)
    {
        $query = ControleLivraison::with(['utilisateur', 'partenaire', 'lot.produit']);

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
        $allowed = ['id', 'date_operation', 'cie_numero_vol', 'created_at'];
        if (!in_array($sortBy, $allowed)) $sortBy = 'id';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $data = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $data, 'message' => 'Liste des contrôles livraison récupérée']);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'date_operation' => 'required|date',
                'id_partenaire' => 'nullable|exists:partenaires,id',
                'id_lot' => 'nullable|exists:lots,id',
                'cie_numero_vol' => 'nullable|string|max:100',
                'camion_propre' => 'nullable|boolean',
                'heure_debut' => 'nullable|date_format:H:i',
                'heure_fin' => 'nullable|date_format:H:i',
                'code_prestation_classe' => 'nullable|string|max:50',
                'code_couleur' => 'nullable|string|max:50',
                'final_holding_temperature' => 'nullable|numeric',
                'reception_client_temperature' => 'nullable|numeric',
                'commentaires' => 'nullable|string',
                'nom_signature_superviseur' => 'nullable|string|max:100',
                'nom_signature_responsable_client' => 'nullable|string|max:100',
                'remarque_generale' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $validated['id_utilisateur'] = Auth::id();
            $item = ControleLivraison::create($validated);
            $item->load(['utilisateur', 'partenaire', 'lot.produit']);
            DB::commit();

            return response()->json(['success' => true, 'data' => $item, 'message' => 'Contrôle livraison créé avec succès'], 201);
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
                'lignes.*.cie_numero_vol' => 'nullable|string|max:100',
                'lignes.*.camion_propre' => 'nullable|boolean',
                'lignes.*.heure_debut' => 'nullable|date_format:H:i',
                'lignes.*.heure_fin' => 'nullable|date_format:H:i',
                'lignes.*.code_prestation_classe' => 'nullable|string|max:50',
                'lignes.*.code_couleur' => 'nullable|string|max:50',
                'lignes.*.final_holding_temperature' => 'nullable|numeric',
                'lignes.*.reception_client_temperature' => 'nullable|numeric',
                'lignes.*.commentaires' => 'nullable|string',
                'lignes.*.nom_signature_superviseur' => 'nullable|string|max:100',
                'lignes.*.nom_signature_responsable_client' => 'nullable|string|max:100',
                'lignes.*.remarque_generale' => 'nullable|string',
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
                $created[] = ControleLivraison::create($data);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'data' => $created,
                'message' => count($created) . ' contrôle(s) livraison créé(s) avec succès',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $item = ControleLivraison::with(['utilisateur', 'partenaire', 'lot.produit'])->find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        return response()->json(['success' => true, 'data' => $item, 'message' => 'Contrôle livraison récupéré']);
    }

    public function update(Request $request, $id)
    {
        $item = ControleLivraison::find($id);
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
                'cie_numero_vol' => 'nullable|string|max:100',
                'camion_propre' => 'nullable|boolean',
                'heure_debut' => 'nullable|date_format:H:i',
                'heure_fin' => 'nullable|date_format:H:i',
                'code_prestation_classe' => 'nullable|string|max:50',
                'code_couleur' => 'nullable|string|max:50',
                'final_holding_temperature' => 'nullable|numeric',
                'reception_client_temperature' => 'nullable|numeric',
                'commentaires' => 'nullable|string',
                'nom_signature_superviseur' => 'nullable|string|max:100',
                'nom_signature_responsable_client' => 'nullable|string|max:100',
                'remarque_generale' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $item->update($validated);
            $item->load(['utilisateur', 'partenaire', 'lot.produit']);
            DB::commit();

            return response()->json(['success' => true, 'data' => $item, 'message' => 'Contrôle livraison mis à jour']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $item = ControleLivraison::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Non trouvé'], 404);

        $user = Auth::user();
        if (!$user->hasRole('ADMIN') && $item->id_utilisateur !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        try {
            $item->delete();
            return response()->json(['success' => true, 'message' => 'Contrôle livraison supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
}
