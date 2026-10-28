<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Devise;
use Illuminate\Validation\Rule;

class DeviseController extends BaseController
{
    protected $model = Devise::class;
    protected $searchFields = ['code', 'nom', 'symbole'];

    protected function getValidationRules($id = null)
    {
        return [
            'code' => [
                'required', 'string', 'max:10',
                Rule::unique('devises', 'code')->ignore($id)->whereNull('deleted_at'),
            ],
            'nom' => "required|string|max:50",
            'symbole' => "nullable|string|max:10",
            'actif' => 'nullable|boolean'
        ];
    }
}
