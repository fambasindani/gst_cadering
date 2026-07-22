<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Audit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AuditMiddleware
{
    protected $excludedTables = [
        'audits',
        'failed_jobs',
        'migrations',
        'password_resets',
        'personal_access_tokens',
        'sessions',
        'cache',
        'jobs'
    ];

    protected $excludedActions = [
        'GET',
        'HEAD',
        'OPTIONS'
    ];

    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($this->shouldAudit($request)) {
            try {
                $this->logAudit($request, $response);
            } catch (\Exception $e) {
                Log::error('Erreur lors de l\'audit: ' . $e->getMessage());
            }
        }

        return $response;
    }

    protected function shouldAudit(Request $request): bool
    {
        if (in_array($request->method(), $this->excludedActions)) {
            return false;
        }

        // Exclure les routes d'authentification (déjà gérées par AuthController)
        $excludedRoutes = ['api/auth/login', 'api/auth/register', 'api/auth/logout'];
        if (in_array($request->path(), $excludedRoutes)) {
            return false;
        }

        $table = $this->getTableName($request);
        if (in_array($table, $this->excludedTables)) {
            return false;
        }

        return true;
    }

    protected function getTableName(Request $request): string
    {
        $path = $request->path();
        
        $patterns = [
            '/api\/config\/([a-zA-Z_]+)/',
            '/api\/facturation\/([a-zA-Z_]+)/',
            '/api\/rapports\/([a-zA-Z_]+)/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $path, $matches)) {
                return $this->singularize($matches[1]);
            }
        }

        $routeName = $request->route() ? $request->route()->getName() : 'unknown';
        return str_replace(['api.', 'config.', 'facturation.', 'rapports.'], '', $routeName);
    }

    protected function singularize(string $word): string
    {
        $irregulars = [
            'unites' => 'unite',
            'villes' => 'ville',
            'departements' => 'departement',
            'zones' => 'zone',
            'emplacements' => 'emplacement',
            'categories' => 'categorie',
            'devises' => 'devise',
            'produits' => 'produit',
            'lots' => 'lot',
            'partenaires' => 'partenaire',
            'utilisateurs' => 'utilisateur',
            'roles' => 'role',
            'permissions' => 'permission',
            'bons-commande' => 'bon_commande',
            'mouvements' => 'mouvement',
            'retours' => 'retour',
            'factures' => 'facture',
            'paiements' => 'paiement',
            'avoirs' => 'avoir',
            'devis' => 'devis',
            'periodes-inventaire' => 'periode_inventaire',
            'inventaires' => 'inventaire',
        ];

        return $irregulars[$word] ?? $word;
    }

    protected function logAudit(Request $request, $response)
    {
        $user = Auth::user();
        $method = $request->method();
        $table = $this->getTableName($request);
        $id = $request->route('id') ?? $request->input('id') ?? 0;

        $nouvellesValeurs = $request->all();
        
        if (isset($nouvellesValeurs['mot_de_passe'])) {
            unset($nouvellesValeurs['mot_de_passe']);
        }
        if (isset($nouvellesValeurs['mot_de_passe_hash'])) {
            unset($nouvellesValeurs['mot_de_passe_hash']);
        }

        $anciennesValeurs = null;
        if (in_array($method, ['PUT', 'PATCH', 'DELETE']) && $id > 0) {
            $anciennesValeurs = $this->getOldValues($table, $id);
        }

        $action = $this->getAction($method);

        Audit::create([
            'id_utilisateur' => $user ? $user->id : null,
            'action' => $action,
            'table_cible' => $table,
            'id_enregistrement' => $id,
            'anciennes_valeurs' => $anciennesValeurs ? json_encode($anciennesValeurs) : null,
            'nouvelles_valeurs' => !empty($nouvellesValeurs) ? json_encode($nouvellesValeurs) : null,
            'date_action' => now(),
            'adresse_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'route' => $request->route() ? $request->route()->getName() : $request->path(),
        ]);
    }

    protected function getOldValues(string $table, int $id)
    {
        try {
            $modelClass = $this->getModelClass($table);
            if ($modelClass && class_exists($modelClass)) {
                $model = $modelClass::find($id);
                if ($model) {
                    return $model->toArray();
                }
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function getModelClass(string $table): ?string
    {
        $map = [
            'unite' => 'App\Models\Unite',
            'ville' => 'App\Models\Ville',
            'departement' => 'App\Models\Departement',
            'zone' => 'App\Models\Zone',
            'emplacement' => 'App\Models\Emplacement',
            'categorie' => 'App\Models\Categorie',
            'devise' => 'App\Models\Devise',
            'produit' => 'App\Models\Produit',
            'lot' => 'App\Models\Lot',
            'partenaire' => 'App\Models\Partenaire',
            'utilisateur' => 'App\Models\Utilisateur',
            'role' => 'App\Models\Role',
            'permission' => 'App\Models\Permission',
            'bon_commande' => 'App\Models\BonCommande',
            'ligne_commande' => 'App\Models\LigneCommande',
            'mouvement' => 'App\Models\MouvementStock',
            'retour' => 'App\Models\Retour',
            'ligne_retour' => 'App\Models\LigneRetour',
            'facture' => 'App\Models\Facture',
            'ligne_facture' => 'App\Models\LigneFacture',
            'paiement' => 'App\Models\Paiement',
            'avoir' => 'App\Models\Avoir',
            'devis' => 'App\Models\Devis',
            'ligne_devis' => 'App\Models\LigneDevis',
            'periode_inventaire' => 'App\Models\PeriodeInventaire',
            'inventaire' => 'App\Models\Inventaire',
            'type_mouvement' => 'App\Models\TypeMouvement',
        ];

        return $map[$table] ?? null;
    }

    protected function getAction(string $method): string
    {
        $map = [
            'POST' => 'INSERT',
            'PUT' => 'UPDATE',
            'PATCH' => 'UPDATE',
            'DELETE' => 'DELETE',
        ];

        return $map[$method] ?? $method;
    }
}