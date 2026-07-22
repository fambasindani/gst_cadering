<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Unite;

class UniteController extends BaseController
{
    protected $model = Unite::class;
    protected $searchFields = ['nom', 'symbole'];

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => "required|string|max:50|unique:unites,nom,{$id}",
            'symbole' => "required|string|max:10|unique:unites,symbole,{$id}",
            'description' => 'nullable|string',
            'actif' => 'nullable|boolean'
        ];
    }
}