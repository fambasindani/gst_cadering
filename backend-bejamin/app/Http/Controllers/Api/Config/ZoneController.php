<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Zone;
use Illuminate\Http\Request;

class ZoneController extends BaseController
{
    protected $model = Zone::class;
    protected $searchFields = ['nom', 'type_zone'];

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $villeId = $request->input('ville_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Zone::with('ville');

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nom', 'LIKE', "%{$search}%")
                      ->orWhere('type_zone', 'LIKE', "%{$search}%");
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
            $zones = Zone::where('id_ville', $villeId)
                         ->where('actif', true)
                         ->get();

            return response()->json([
                'success' => true,
                'data' => $zones,
                'message' => 'Zones récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des zones'
            ], 500);
        }
    }

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => "required|string|max:100",
            'id_ville' => "required|exists:villes,id",
            'type_zone' => "required|in:production,stockage,service,hygiene",
            'description' => 'nullable|string',
            'actif' => 'nullable|boolean'
        ];
    }
}