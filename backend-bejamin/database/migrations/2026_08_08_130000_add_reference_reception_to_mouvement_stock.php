<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mouvement_stock', function (Blueprint $table) {
            $table->string('reference_reception', 100)->nullable()->after('reference_document');
        });
    }

    public function down(): void
    {
        Schema::table('mouvement_stock', function (Blueprint $table) {
            $table->dropColumn('reference_reception');
        });
    }
};
