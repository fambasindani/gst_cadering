<?php

namespace App\Http\Controllers\Api\Audit;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    /**
     * Liste des audits
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);

            $audits = $this->buildQuery($request)
                ->orderBy('id', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $audits,
                'message' => 'Liste des audits récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des audits',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Construit la requête avec les filtres (recherche, table, action, dates)
     */
    private function buildQuery(Request $request)
    {
        $query = Audit::with('utilisateur');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'LIKE', "%{$search}%")
                    ->orWhere('table_cible', 'LIKE', "%{$search}%")
                    ->orWhere('route', 'LIKE', "%{$search}%")
                    ->orWhere('id_enregistrement', 'LIKE', "%{$search}%")
                    ->orWhereHas('utilisateur', function ($u) use ($search) {
                        $u->where('nom', 'LIKE', "%{$search}%")
                            ->orWhere('prenom', 'LIKE', "%{$search}%");
                    });
            });
        }

        if ($table = $request->input('table_cible')) {
            $query->where('table_cible', $table);
        }

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($dateDebut = $request->input('date_debut')) {
            $query->where('date_action', '>=', $dateDebut . ' 00:00:00');
        }

        if ($dateFin = $request->input('date_fin')) {
            $query->where('date_action', '<=', $dateFin . ' 23:59:59');
        }

        return $query;
    }

    /**
     * Export des audits en CSV (lisible par Excel)
     */
    public function export(Request $request)
    {
        try {
            $audits = $this->buildQuery($request)
                ->orderBy('id', 'desc')
                ->get();

            $filename = 'audits_' . now()->format('Y-m-d') . '.csv';

            return response()->streamDownload(function () use ($audits) {
                $handle = fopen('php://output', 'w');
                fwrite($handle, "\xEF\xBB\xBF"); // BOM UTF-8 pour Excel

                fputcsv($handle, [
                    'ID', 'Date', 'Utilisateur', 'Action', 'Table', 'ID enregistrement',
                    'Adresse IP', 'Route', 'User-Agent', 'Anciennes valeurs', 'Nouvelles valeurs',
                ], ';');

                foreach ($audits as $audit) {
                    fputcsv($handle, [
                        $audit->id,
                        $audit->date_action ? $audit->date_action->format('d/m/Y H:i:s') : '',
                        $audit->utilisateur ? trim($audit->utilisateur->prenom . ' ' . $audit->utilisateur->nom) : 'Système',
                        $audit->action,
                        $audit->table_cible,
                        $audit->id_enregistrement,
                        $audit->adresse_ip,
                        $audit->route,
                        $audit->user_agent,
                        json_encode($audit->anciennes_valeurs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                        json_encode($audit->nouvelles_valeurs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    ], ';');
                }

                fclose($handle);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des audits',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un audit
     */
    public function show($id)
    {
        try {
            $audit = Audit::with('utilisateur')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $audit,
                'message' => 'Détail de l\'audit récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé'
            ], 404);
        }
    }

    /**
     * Statistiques des audits
     */
    public function statistiques(Request $request)
    {
        try {
            $total = Audit::count();
            $parAction = Audit::selectRaw('action, COUNT(*) as total')
                ->groupBy('action')
                ->get();
            $parTable = Audit::selectRaw('table_cible, COUNT(*) as total')
                ->groupBy('table_cible')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_audits' => $total,
                    'par_action' => $parAction,
                    'par_table' => $parTable,
                ],
                'message' => 'Statistiques récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Audits par table
     */
    public function byTable($table, Request $request)
    {
        try {
            $perPage = $request->input('per_page', 50);

            $audits = Audit::with('utilisateur')
                ->where('table_cible', $table)
                ->orderBy('id', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $audits,
                'message' => "Audits de la table '{$table}' récupérés avec succès"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des audits',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Audits par utilisateur
     */
    public function byUtilisateur($utilisateurId, Request $request)
    {
        try {
            $perPage = $request->input('per_page', 50);

            $audits = Audit::with('utilisateur')
                ->where('id_utilisateur', $utilisateurId)
                ->orderBy('id', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $audits,
                'message' => "Audits de l'utilisateur récupérés avec succès"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des audits',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tables disponibles
     */
    public function tables()
    {
        try {
            $tables = Audit::selectRaw('table_cible, COUNT(*) as total')
                ->groupBy('table_cible')
                ->orderBy('table_cible')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $tables,
                'message' => 'Tables d\'audit récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des tables',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actions disponibles
     */
    public function actions()
    {
        try {
            $actions = Audit::selectRaw('action, COUNT(*) as total')
                ->groupBy('action')
                ->orderBy('action')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $actions,
                'message' => 'Actions d\'audit récupérées avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des actions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}