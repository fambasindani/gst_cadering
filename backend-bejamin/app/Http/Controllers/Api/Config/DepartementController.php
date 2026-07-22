<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Departement;
use Illuminate\Http\Request;

class DepartementController extends BaseController
{
    protected $model = Departement::class;
    protected $searchFields = ['nom', 'code'];

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $villeId = $request->input('ville_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Departement::with('ville');

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'LIKE', "%{$search}%")
                      ->orWhere('code', 'LIKE', "%{$search}%");
                });
            }

            if ($villeId) {
                $query->where('id_ville', $villeId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getByVille($villeId)
    {
        try {
            $departements = Departement::where('id_ville', $villeId)
                                       ->where('actif', true)
                                       ->get();

            return response()->json([
                'success' => true,
                'data' => $departements,
                'message' => 'Départements récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des départements'
            ], 500);
        }
    }

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => "required|string|max:100",
            'code' => "nullable|string|max:20",
            'id_ville' => "required|exists:villes,id",
            'actif' => 'nullable|boolean'
        ];
    }
}