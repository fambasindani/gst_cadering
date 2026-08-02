<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('permissions')->updateOrInsert(
            ['code' => 'config:purge:stock'],
            ['nom' => 'Purger le stock (entrées/sorties)', 'actif' => true]
        );

        $permissionId = DB::table('permissions')->where('code', 'config:purge:stock')->value('id');
        $adminRoleId = DB::table('roles')->where('nom', 'ADMIN')->value('id');

        if ($permissionId && $adminRoleId) {
            DB::table('role_permission')->updateOrInsert(
                ['id_role' => $adminRoleId, 'id_permission' => $permissionId],
                []
            );
        }
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('code', 'config:purge:stock')->value('id');

        if ($permissionId) {
            DB::table('role_permission')->where('id_permission', $permissionId)->delete();
            DB::table('permissions')->where('id', $permissionId)->delete();
        }
    }
};
