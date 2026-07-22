<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Categorie;

class CategorieController extends BaseController
{
    protected $model = Categorie::class;
    protected $searchFields = ['nom'];

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => "required|string|max:100|unique:categories,nom,{$id}",
            'description' => 'nullable|string',
            'actif' => 'nullable|boolean'
        ];
    }
}