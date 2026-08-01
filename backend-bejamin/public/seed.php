<?php
// SUPPRIME CE FICHIER APRÈS EXÉCUTION !
// Accède via : https://concept-innovation.org/archives/seed.php?token=seed2024

if (($_GET['token'] ?? '') !== 'seed2024') {
    http_response_code(403);
    die('Token invalide');
}

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$seeder = $app->make(Database\Seeders\RolePermissionSeeder::class);
$seeder->run();

echo "Permissions mises à jour avec succès !\n";
