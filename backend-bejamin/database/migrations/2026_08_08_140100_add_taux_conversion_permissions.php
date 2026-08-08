<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['code' => 'config:taux_conversion:view', 'nom' => 'Voir les taux de conversion'],
            ['code' => 'config:taux_conversion:create', 'nom' => 'Créer un taux de conversion'],
            ['code' => 'config:taux_conversion:update', 'nom' => 'Modifier un taux de conversion'],
            ['code' => 'config:taux_conversion:delete', 'nom' => 'Supprimer un taux de conversion'],
        ];

        $adminRoleId = DB::table('roles')->where('nom', 'ADMIN')->value('id');

        foreach ($permissions as $perm) {
            DB::table('permissions')->updateOrInsert(
                ['code' => $perm['code']],
                ['nom' => $perm['nom'], 'actif' => true]
            );

            $permissionId = DB::table('permissions')->where('code', $perm['code'])->value('id');

            if ($permissionId && $adminRoleId) {
                DB::table('role_permission')->updateOrInsert(
                    ['id_role' => $adminRoleId, 'id_permission' => $permissionId],
                    []
                );
            }
        }
    }

    public function down(): void
    {
        $codes = [
            'config:taux_conversion:view',
            'config:taux_conversion:create',
            'config:taux_conversion:update',
            'config:taux_conversion:delete',
        ];

        foreach ($codes as $code) {
            $permissionId = DB::table('permissions')->where('code', $code)->value('id');
            if ($permissionId) {
                DB::table('role_permission')->where('id_permission', $permissionId)->delete();
                DB::table('permissions')->where('id', $permissionId)->delete();
            }
        }
    }
};
