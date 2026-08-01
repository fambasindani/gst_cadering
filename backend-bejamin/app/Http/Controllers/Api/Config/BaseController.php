<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

abstract class BaseController extends Controller
{
    protected $model;
    protected $searchFields = ['nom'];

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = $this->model::query();

            if ($search) {
                $query->where(function($q) use ($search) {
                    foreach ($this->searchFields as $field) {
                        $q->orWhere($field, 'LIKE', "%{$search}%");
                    }
                });
            }

            if ($request->has('magasin_id')) {
                $query->where('id_magasin', $request->magasin_id);
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

    public function store(Request $request)
    {
        try {
            $validated = $request->validate($this->getValidationRules());
            $data = $this->model::create($validated);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Enregistrement créé avec succès'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $data = $this->model::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Détail récupéré avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Enregistrement non trouvé'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = $this->model::findOrFail($id);
            $validated = $request->validate($this->getValidationRules($id));
            $data->update($validated);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Enregistrement mis à jour avec succès'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
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

    public function destroy($id)
    {
        try {
            $data = $this->model::findOrFail($id);
            $data->delete();

            return response()->json([
                'success' => true,
                'message' => 'Enregistrement supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function toggleActif($id)
    {
        try {
            $data = $this->model::findOrFail($id);
            $data->actif = !$data->actif;
            $data->save();

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Statut modifié avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut'
            ], 500);
        }
    }

    abstract protected function getValidationRules($id = null);
}