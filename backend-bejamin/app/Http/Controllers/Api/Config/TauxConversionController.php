<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\TauxConversion;

class TauxConversionController extends BaseController
{
    protected $model = TauxConversion::class;
    protected $searchFields = ['code_devise', 'nom'];

    protected function getValidationRules($id = null)
    {
        return [
            'code_devise' => "required|string|max:10|unique:taux_conversion,code_devise,{$id}",
            'nom' => 'nullable|string|max:100',
            'taux' => 'required|numeric|gt:0',
            'date_application' => 'required|date',
            'actif' => 'nullable|boolean'
        ];
    }

    /**
     * Taux actif le plus récent (utile pour la conversion USD → CDF côté frontend).
     */
    public function tauxActuel()
    {
        try {
            $taux = TauxConversion::where('actif', true)
                ->orderBy('date_application', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            if (!$taux) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Aucun taux de conversion actif'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $taux,
                'message' => 'Taux de conversion récupéré avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du taux',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
