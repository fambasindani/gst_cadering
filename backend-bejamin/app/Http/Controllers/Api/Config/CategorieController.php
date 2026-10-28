<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Categorie;
use Illuminate\Validation\Rule;

class CategorieController extends BaseController
{
    protected $model = Categorie::class;
    protected $searchFields = ['nom'];

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => [
                'required', 'string', 'max:100',
                Rule::unique('categories', 'nom')->ignore($id)->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string',
            'actif' => 'nullable|boolean'
        ];
    }
}
