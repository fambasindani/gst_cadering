<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\EntreeFicheTechnique;
use App\Models\FicheTechniqueMenu;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EntreeFicheTechniqueController extends Controller
{
    /**
     * Liste des rapports générés (entrées fiche technique)
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $menuId = $request->input('menu_id');
            $partenaireId = $request->input('partenaire_id');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = EntreeFicheTechnique::with([
                'menu',
                'partenaire',
                'utilisateur',
            ]);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('menu', fn ($m) => $m->where('nom', 'LIKE', "%{$search}%"))
                      ->orWhereHas('partenaire', fn ($p) => $p->where('nom', 'LIKE', "%{$search}%"));
                });
            }

            if ($menuId) {
                $query->where('id_fiche_technique_menu', $menuId);
            }

            if ($partenaireId) {
                $query->where('id_partenaire', $partenaireId);
            }

            if ($dateFrom) {
                $query->whereDate('date_rapport', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->whereDate('date_rapport', '<=', $dateTo);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des rapports récupérée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Aperçu d'un rapport (calcul sans enregistrement)
     */
    public function apercu(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_fiche_technique_menu' => 'required|exists:fiche_technique_menu,id',
                'nombre_passagers' => 'required|integer|min:1',
            ]);

            $menu = $this->chargerMenu($validated['id_fiche_technique_menu']);
            $detail = $this->calculerRapport($menu, $validated['nombre_passagers']);

            return response()->json([
                'success' => true,
                'data' => $detail,
                'message' => 'Aperçu du rapport calculé avec succès'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul de l\'aperçu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer et enregistrer un rapport de fiche technique (menu)
     */
    public function generer(Request $request)
    {
        try {
            $validated = $request->validate([
                'id_fiche_technique_menu' => 'required|exists:fiche_technique_menu,id',
                'id_partenaire' => 'required|exists:partenaires,id',
                'nombre_passagers' => 'required|integer|min:1',
                'date_rapport' => 'nullable|date',
                'commentaire' => 'nullable|string',
            ]);

            $menu = $this->chargerMenu($validated['id_fiche_technique_menu']);

            DB::beginTransaction();

            try {
                $rapport = EntreeFicheTechnique::create([
                    'id_fiche_technique_menu' => $menu->id,
                    'id_partenaire' => $validated['id_partenaire'],
                    'nombre_passagers' => $validated['nombre_passagers'],
                    'date_rapport' => $validated['date_rapport'] ?? now()->toDateString(),
                    'commentaire' => $validated['commentaire'] ?? null,
                    'id_utilisateur' => Auth::id(),
                ]);

                DB::commit();

                $detail = $this->calculerRapport($menu, $validated['nombre_passagers']);

                return response()->json([
                    'success' => true,
                    'data' => array_merge([
                        'rapport' => $rapport->load(['menu', 'partenaire', 'utilisateur']),
                    ], $detail),
                    'message' => 'Rapport de fiche technique enregistré avec succès'
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un rapport (recalculé en direct)
     */
    public function show($id)
    {
        try {
            $rapport = EntreeFicheTechnique::with(['menu', 'partenaire', 'utilisateur'])
                ->findOrFail($id);

            $menu = $this->chargerMenu($rapport->id_fiche_technique_menu);
            $detail = $this->calculerRapport($menu, $rapport->nombre_passagers);

            return response()->json([
                'success' => true,
                'data' => array_merge([
                    'rapport' => $rapport,
                ], $detail),
                'message' => 'Détail du rapport récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rapport non trouvé'
            ], 404);
        }
    }

    /**
     * Supprimer un rapport
     */
    public function destroy($id)
    {
        try {
            $rapport = EntreeFicheTechnique::findOrFail($id);
            $rapport->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rapport supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Charge le menu complet (parties, items, recettes, lignes).
     */
    private function chargerMenu(int $menuId): FicheTechniqueMenu
    {
        return FicheTechniqueMenu::with([
            'partenaire',
            'magasin',
            'parties.items.ficheTechnique',
            'parties.items.ficheTechnique.lignes.ingredient',
            'parties.items.ficheTechnique.lignes.unite',
            'parties.items.produit.unite',
        ])->findOrFail($menuId);
    }

    /**
     * Calcule le rapport complet : détail par partie + récapitulatif articles.
     */
    private function calculerRapport(FicheTechniqueMenu $menu, int $passagers): array
    {
        $parties = [];
        $articles = [];
        $coutTotalFiche = 0.0;

        foreach ($menu->parties as $partie) {
            $items = [];

            foreach ($partie->items as $item) {
                $pourcentage = (float) $item->pourcentage;
                $pct = $pourcentage / 100;
                $composants = [];

                // Item = produit (non recette)
                if ($item->produit) {
                    $produit = $item->produit;
                    $dernierPrix = $produit->getDernierPrixAchat();
                    $prixUnitaire = (float) ($dernierPrix->prix_achat_ht ?? 0);
                    $quantiteTotale = $passagers * $pct;
                    $coutItem = $quantiteTotale * $prixUnitaire;
                    $coutTotalFiche += $coutItem;

                    $composants[] = [
                        'id_produit' => $produit->id,
                        'code_article' => $produit->code_article,
                        'nom' => $produit->nom,
                        'unite' => $produit->unite->symbole ?? $produit->unite->nom ?? '—',
                        'rendement' => 1,
                        'quantiteParPortion' => round($pct, 3),
                        'quantiteTotale' => round($quantiteTotale, 3),
                        'prixUnitaire' => round($prixUnitaire, 2),
                        'coutTotal' => round($coutItem, 2),
                    ];

                    $this->agregerArticle($articles, $produit, $produit->unite, $quantiteTotale, $coutItem);

                    $items[] = [
                        'id' => $item->id,
                        'designation' => $item->designation ?? $produit->nom,
                        'code' => $produit->code_article,
                        'type' => 'produit',
                        'pourcentage' => $pourcentage,
                        'coutParPassager' => round($prixUnitaire * $pct, 2),
                        'coutTotal' => round($coutItem, 2),
                        'composants' => $composants,
                    ];

                    continue;
                }

                $recette = $item->ficheTechnique;
                if (!$recette) {
                    continue;
                }

                $rendement = max((int) $recette->rendement, 1);

                $coutParPassager = (float) $recette->cout_unitaire * $pct;
                $coutItem = $coutParPassager * $passagers;
                $coutTotalFiche += $coutItem;

                foreach ($recette->lignes as $ligne) {
                    $quantiteParPortion = (float) $ligne->poids_net / $rendement;
                    $quantiteTotale = $quantiteParPortion * $passagers * $pct;
                    $prixUnitaire = (float) $ligne->prix_unitaire;
                    $coutLigne = $quantiteTotale * $prixUnitaire;

                    $composants[] = [
                        'id_produit' => $ligne->ingredient->id ?? null,
                        'code_article' => $ligne->ingredient->code_article ?? null,
                        'nom' => $ligne->ingredient->nom ?? '—',
                        'unite' => $ligne->unite->symbole ?? $ligne->unite->nom ?? '—',
                        'rendement' => (float) $ligne->rendement,
                        'quantiteParPortion' => round($quantiteParPortion, 3),
                        'quantiteTotale' => round($quantiteTotale, 3),
                        'prixUnitaire' => round($prixUnitaire, 2),
                        'coutTotal' => round($coutLigne, 2),
                    ];

                    $this->agregerArticle($articles, $ligne->ingredient, $ligne->unite, $quantiteTotale, $coutLigne);
                }

                $items[] = [
                    'id' => $item->id,
                    'designation' => $item->designation ?? $recette->nom,
                    'code' => $recette->code,
                    'type' => 'recette',
                    'pourcentage' => $pourcentage,
                    'coutParPassager' => round($coutParPassager, 2),
                    'coutTotal' => round($coutItem, 2),
                    'composants' => $composants,
                ];
            }

            $parties[] = [
                'id' => $partie->id,
                'nom' => $partie->nom,
                'ordre' => $partie->ordre,
                'items' => $items,
            ];
        }

        // Récapitulatif articles consommés (tri par coût décroissant)
        $totalArticles = collect($articles)
            ->sortByDesc(fn ($a) => $a['coutTotal'])
            ->values()
            ->map(function ($article) {
                $article['prixUnitaire'] = $article['quantiteTotale'] > 0
                    ? round($article['coutTotal'] / $article['quantiteTotale'], 2)
                    : 0;
                return $article;
            })
            ->values()
            ->all();

        return [
            'menu' => $menu->load(['partenaire', 'magasin']),
            'parties' => $parties,
            'totalArticles' => $totalArticles,
            'coutTotalFiche' => round($coutTotalFiche, 2),
            'coutParPassagerTotal' => $passagers > 0 ? round($coutTotalFiche / $passagers, 2) : 0,
        ];
    }

    /**
     * Agrége les quantités/coûts d'un article dans le récapitulatif.
     */
    private function agregerArticle(array &$articles, $produit, $unite, float $quantiteTotale, float $coutLigne): void
    {
        if (!$produit) {
            return;
        }

        $key = $produit->id;

        $uniteLibelle = $unite ? ($unite->symbole ?? $unite->nom ?? '—') : '—';

        if (!isset($articles[$key])) {
            $articles[$key] = [
                'id_produit' => $produit->id,
                'code_article' => $produit->code_article,
                'nom' => $produit->nom,
                'unite' => $uniteLibelle,
                'quantiteTotale' => 0.0,
                'coutTotal' => 0.0,
                'prixUnitaire' => 0,
            ];
        }

        $articles[$key]['quantiteTotale'] += $quantiteTotale;
        $articles[$key]['coutTotal'] += $coutLigne;
    }
}
