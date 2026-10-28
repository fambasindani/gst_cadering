<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Unite;
use Illuminate\Validation\Rule;

class UniteController extends BaseController
{
    protected $model = Unite::class;
    protected $searchFields = ['nom', 'symbole'];

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => [
                'required', 'string', 'max:50',
                Rule::unique('unites', 'nom')->ignore($id)->whereNull('deleted_at'),
            ],
            'symbole' => [
                'required', 'string', 'max:10',
                Rule::unique('unites', 'symbole')->ignore($id)->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string',
            'actif' => 'nullable|boolean'
        ];
    }
}
