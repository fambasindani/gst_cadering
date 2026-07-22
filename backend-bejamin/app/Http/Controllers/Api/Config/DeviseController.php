<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Devise;

class DeviseController extends BaseController
{
    protected $model = Devise::class;
    protected $searchFields = ['code', 'nom', 'symbole'];

    protected function getValidationRules($id = null)
    {
        return [
            'code' => "required|string|max:10|unique:devises,code,{$id}",
            'nom' => "required|string|max:50",
            'symbole' => "nullable|string|max:10",
            'actif' => 'nullable|boolean'
        ];
    }
}