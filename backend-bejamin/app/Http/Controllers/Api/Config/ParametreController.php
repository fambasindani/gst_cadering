<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Parametre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ParametreController extends BaseController
{
    protected $model = Parametre::class;
    protected $searchFields = ['cle', 'description', 'valeur'];

    protected function getValidationRules($id = null)
    {
        return [
            'cle' => "required|string|max:100|unique:parametres,cle,{$id}",
            'valeur' => 'nullable|string',
            'description' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:text,number,boolean,color,url,email,password',
            'est_modifiable' => 'nullable|boolean',
            'actif' => 'nullable|boolean',
        ];
    }

    public function showByCle($cle)
    {
        $parametre = Parametre::where('cle', $cle)->first();

        if (!$parametre) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètre non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $parametre
        ]);
    }

    public function updateByCle(Request $request, $cle)
    {
        $parametre = Parametre::where('cle', $cle)->first();

        if (!$parametre) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètre non trouvé'
            ], 404);
        }

        if (!$parametre->est_modifiable) {
            return response()->json([
                'success' => false,
                'message' => "Ce paramètre n'est pas modifiable"
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'valeur' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $parametre->update(['valeur' => $request->valeur]);

        return response()->json([
            'success' => true,
            'message' => 'Paramètre mis à jour avec succès',
            'data' => $parametre
        ]);
    }

    public function updateMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'parametres' => 'required|array',
            'parametres.*.cle' => 'required|string|exists:parametres,cle',
            'parametres.*.valeur' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $updated = [];
        $errors = [];

        foreach ($request->parametres as $param) {
            $parametre = Parametre::where('cle', $param['cle'])->first();

            if (!$parametre->est_modifiable) {
                $errors[] = "Le paramètre '{$param['cle']}' n'est pas modifiable";
                continue;
            }

            $parametre->update(['valeur' => $param['valeur']]);
            $updated[] = $parametre;
        }

        return response()->json([
            'success' => true,
            'message' => count($updated) . ' paramètre(s) mis à jour',
            'updated' => $updated,
            'errors' => $errors
        ]);
    }
}
