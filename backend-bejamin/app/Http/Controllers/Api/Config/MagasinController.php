<?php

namespace App\Http\Controllers\Api\Config;

use App\Models\Magasin;
use Illuminate\Validation\Rule;

class MagasinController extends BaseController
{
    protected $model = Magasin::class;
    protected $searchFields = ['nom', 'code', 'pays'];

    protected function getValidationRules($id = null)
    {
        return [
            'nom' => "required|string|max:100",
            'code' => [
                'nullable', 'string', 'max:20',
                Rule::unique('magasins', 'code')->ignore($id)->whereNull('deleted_at'),
            ],
            'pays' => "nullable|string|max:100",
            'actif' => 'nullable|boolean'
        ];
    }
}
