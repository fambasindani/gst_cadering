<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Ville;

class VilleController extends BaseController
{
    protected $model = Ville::class;
    protected $searchFields = ['nom', 'code', 'pays'];

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => "required|string|max:100",
            'code' => "nullable|string|max:20|unique:villes,code,{$id}",
            'pays' => "nullable|string|max:100",
            'actif' => 'nullable|boolean'
        ];
    }
}