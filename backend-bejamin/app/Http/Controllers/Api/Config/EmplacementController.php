<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Emplacement;
use Illuminate\Http\Request;

class EmplacementController extends BaseController
{
    protected $model = Emplacement::class;
    protected $searchFields = ['nom'];

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $zoneId = $request->input('zone_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Emplacement::with('zone.ville');

            if ($search) {
                $query->where('nom', 'LIKE', "%{$search}%");
            }

            if ($zoneId) {
                $query->where('id_zone', $zoneId);
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

    public function getByZone($zoneId)
    {
        try {
            $emplacements = Emplacement::where('id_zone', $zoneId)
                                       ->where('actif', true)
                                       ->get();

            return response()->json([
                'success' => true,
                'data' => $emplacements,
                'message' => 'Emplacements récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des emplacements'
            ], 500);
        }
    }

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => "required|string|max:100",
            'id_zone' => "required|exists:zones,id",
            'description' => 'nullable|string',
            'actif' => 'nullable|boolean'
        ];
    }
}