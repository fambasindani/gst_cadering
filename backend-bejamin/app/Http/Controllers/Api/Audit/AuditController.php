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
            
            $audits = Audit::with('utilisateur')
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