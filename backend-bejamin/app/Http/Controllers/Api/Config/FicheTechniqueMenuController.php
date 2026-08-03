<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\FicheTechniqueMenu;
use App\Models\FicheTechniqueMenuPartie;
use App\Models\FicheTechniqueMenuItem;
use App\Helpers\CodeGenerator;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class FicheTechniqueMenuController extends Controller
{
    /**
     * Liste des fiches techniques (menus)
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $magasinId = $request->input('magasin_id');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = FicheTechniqueMenu::with(['magasin', 'partenaire'])
                ->withCount('parties as nombre_parties');

            if ($search) {
                $query->search($search);
            }

            if ($magasinId) {
                $query->byMagasin($magasinId);
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des fiches techniques récupérée avec succès'
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
     * Créer une fiche technique (menu)
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'code' => 'nullable|string|max:50|unique:fiche_technique_menu,code',
                'nom' => 'required|string|max:200',
                'description' => 'nullable|string',
                'cycle' => 'nullable|string|max:50',
                'periodicite' => 'nullable|string|max:100',
                'validite' => 'nullable|string|max:100',
                'id_partenaire' => 'required|exists:partenaires,id',
                'id_magasin' => 'required|exists:magasins,id',
                'actif' => 'nullable|boolean',
                'parties' => 'nullable|array|min:1',
                'parties.*.nom' => 'required_with:parties|string|max:200',
                'parties.*.ordre' => 'nullable|integer',
                'parties.*.items' => 'required_with:parties|array|min:1',
                'parties.*.items.*.id_fiche_technique' => 'nullable|exists:fiche_technique,id',
                'parties.*.items.*.id_produit' => 'nullable|exists:produits,id',
                'parties.*.items.*.designation' => 'nullable|string|max:200',
                'parties.*.items.*.pourcentage' => 'required_with:parties|numeric|min:0|max:100',
                'parties.*.items.*.ordre' => 'nullable|integer',
                'items' => 'nullable|array|min:1',
                'items.*.nom_partie' => 'required_with:items|string|max:200',
                'items.*.id_fiche_technique' => 'nullable|exists:fiche_technique,id',
                'items.*.id_produit' => 'nullable|exists:produits,id',
                'items.*.pourcentage' => 'required_with:items|numeric|min:0|max:100',
            ]);

            // Le frontend envoie des items plats (nom de partie par ligne) : regrouper en parties
            if ($request->has('items')) {
                $validated['parties'] = $this->grouperParties($request->input('items'));
            }

            // Chaque item doit référencer une fiche recette OU un produit
            foreach ($validated['parties'] as $pIndex => $partie) {
                foreach ($partie['items'] as $iIndex => $item) {
                    if (empty($item['id_fiche_technique']) && empty($item['id_produit'])) {
                        throw ValidationException::withMessages([
                            "parties.{$pIndex}.items.{$iIndex}.id_fiche_technique" => 'Chaque item doit référencer une fiche recette ou un produit.'
                        ]);
                    }
                }
            }

            if (empty($validated['code'])) {
                $validated['code'] = CodeGenerator::ficheTechniqueMenu();
            }

            DB::beginTransaction();

            try {
                $menu = FicheTechniqueMenu::create([
                    'code' => $validated['code'],
                    'nom' => $validated['nom'],
                    'description' => $validated['description'] ?? null,
                    'cycle' => $validated['cycle'] ?? null,
                    'periodicite' => $validated['periodicite'] ?? null,
                    'validite' => $validated['validite'] ?? null,
                    'id_partenaire' => $validated['id_partenaire'] ?? null,
                    'id_magasin' => $validated['id_magasin'],
                    'actif' => $validated['actif'] ?? true,
                ]);

                $this->synchroniserParties($menu->id, $validated['parties']);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $menu->load(['magasin', 'partenaire', 'parties.items.ficheTechnique', 'parties.items.produit.unite']),
                    'message' => 'Fiche technique créée avec succès'
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
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'une fiche technique (menu)
     */
    public function show($id)
    {
        try {
            $menu = FicheTechniqueMenu::with([
                'magasin',
                'partenaire',
                'parties.items.ficheTechnique',
                'parties.items.ficheTechnique.lignes.ingredient',
                'parties.items.ficheTechnique.lignes.unite',
                'parties.items.produit.unite',
            ])->findOrFail($id);

            // Attacher le dernier prix d'achat à chaque produit pour l'affichage
            foreach ($menu->parties as $partie) {
                foreach ($partie->items as $item) {
                    if ($item->produit) {
                        $dernierPrix = $item->produit->getDernierPrixAchat();
                        $item->produit->prix_unitaire = $dernierPrix->prix_achat_ht ?? 0;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $menu,
                'message' => 'Détail de la fiche technique récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fiche technique non trouvée'
            ], 404);
        }
    }

    /**
     * Modifier une fiche technique (menu)
     */
    public function update(Request $request, $id)
    {
        try {
            $menu = FicheTechniqueMenu::findOrFail($id);

            $validated = $request->validate([
                'code' => 'sometimes|required|string|max:50|unique:fiche_technique_menu,code,' . $id,
                'nom' => 'sometimes|required|string|max:200',
                'description' => 'nullable|string',
                'cycle' => 'nullable|string|max:50',
                'periodicite' => 'nullable|string|max:100',
                'validite' => 'nullable|string|max:100',
                'id_partenaire' => 'sometimes|required|exists:partenaires,id',
                'id_magasin' => 'sometimes|required|exists:magasins,id',
                'actif' => 'nullable|boolean',
                'parties' => 'nullable|array|min:1',
                'parties.*.nom' => 'required_with:parties|string|max:200',
                'parties.*.ordre' => 'nullable|integer',
                'parties.*.items' => 'required_with:parties|array|min:1',
                'parties.*.items.*.id_fiche_technique' => 'nullable|exists:fiche_technique,id',
                'parties.*.items.*.id_produit' => 'nullable|exists:produits,id',
                'parties.*.items.*.designation' => 'nullable|string|max:200',
                'parties.*.items.*.pourcentage' => 'required_with:parties|numeric|min:0|max:100',
                'parties.*.items.*.ordre' => 'nullable|integer',
                'items' => 'nullable|array|min:1',
                'items.*.nom_partie' => 'required_with:items|string|max:200',
                'items.*.id_fiche_technique' => 'nullable|exists:fiche_technique,id',
                'items.*.id_produit' => 'nullable|exists:produits,id',
                'items.*.pourcentage' => 'required_with:items|numeric|min:0|max:100',
            ]);

            // Le frontend envoie des items plats (nom de partie par ligne) : regrouper en parties
            if ($request->has('items')) {
                $validated['parties'] = $this->grouperParties($request->input('items'));
            }

            // Chaque item doit référencer une fiche recette OU un produit
            if ($request->has('parties') || $request->has('items')) {
                foreach ($validated['parties'] as $pIndex => $partie) {
                    foreach ($partie['items'] as $iIndex => $item) {
                        if (empty($item['id_fiche_technique']) && empty($item['id_produit'])) {
                            throw ValidationException::withMessages([
                                "parties.{$pIndex}.items.{$iIndex}.id_fiche_technique" => 'Chaque item doit référencer une fiche recette ou un produit.'
                            ]);
                        }
                    }
                }
            }

            DB::beginTransaction();

            try {
                $menu->update([
                    'code' => $validated['code'] ?? $menu->code,
                    'nom' => $validated['nom'] ?? $menu->nom,
                    'description' => array_key_exists('description', $validated) ? $validated['description'] : $menu->description,
                    'cycle' => array_key_exists('cycle', $validated) ? $validated['cycle'] : $menu->cycle,
                    'periodicite' => array_key_exists('periodicite', $validated) ? $validated['periodicite'] : $menu->periodicite,
                    'validite' => array_key_exists('validite', $validated) ? $validated['validite'] : $menu->validite,
                    'id_partenaire' => array_key_exists('id_partenaire', $validated) ? ($validated['id_partenaire'] ?? null) : $menu->id_partenaire,
                    'id_magasin' => $validated['id_magasin'] ?? $menu->id_magasin,
                    'actif' => array_key_exists('actif', $validated) ? $validated['actif'] : $menu->actif,
                ]);

                if ($request->has('parties') || $request->has('items')) {
                    $menu->parties()->delete();
                    $this->synchroniserParties($menu->id, $validated['parties']);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => $menu->load(['magasin', 'partenaire', 'parties.items.ficheTechnique', 'parties.items.produit.unite']),
                    'message' => 'Fiche technique mise à jour avec succès'
                ]);

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
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une fiche technique (menu)
     */
    public function destroy($id)
    {
        try {
            $menu = FicheTechniqueMenu::findOrFail($id);

            DB::beginTransaction();
            try {
                $menu->parties()->delete();
                $menu->delete();
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            return response()->json([
                'success' => true,
                'message' => 'Fiche technique supprimée avec succès'
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), '23000')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cette fiche technique car elle a déjà été utilisée dans un rapport. Vous pouvez plutôt la désactiver.'
                ], 409);
            }
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer/Désactiver une fiche technique (menu)
     */
    public function toggleActif($id)
    {
        try {
            $menu = FicheTechniqueMenu::findOrFail($id);
            $menu->actif = !$menu->actif;
            $menu->save();

            return response()->json([
                'success' => true,
                'data' => $menu,
                'message' => 'Statut modifié avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut'
            ], 500);
        }
    }

    /**
     * Regroupe les items plats (nom de partie par ligne) en parties.
     */
    private function grouperParties(array $items): array
    {
        $parties = [];
        $indexParNom = [];

        foreach ($items as $item) {
            $nom = trim((string) ($item['nom_partie'] ?? ''));
            if ($nom === '') {
                $nom = 'Autres';
            }

            if (!isset($indexParNom[$nom])) {
                $indexParNom[$nom] = count($parties);
                $parties[] = [
                    'nom' => $nom,
                    'items' => [],
                ];
            }

            $parties[$indexParNom[$nom]]['items'][] = [
                'id_fiche_technique' => $item['id_fiche_technique'] ?? null,
                'id_produit' => $item['id_produit'] ?? null,
                'pourcentage' => $item['pourcentage'] ?? 100,
            ];
        }

        return $parties;
    }

    /**
     * Supprime les parties existantes et recrée les parties/items à partir du payload.
     */
    private function synchroniserParties(int $menuId, array $parties): void
    {
        $ordrePartie = 0;
        foreach ($parties as $partie) {
            $ordrePartie++;
            $newPartie = FicheTechniqueMenuPartie::create([
                'id_fiche_technique_menu' => $menuId,
                'nom' => $partie['nom'],
                'ordre' => $partie['ordre'] ?? $ordrePartie,
            ]);

            $ordreItem = 0;
            foreach ($partie['items'] as $item) {
                $ordreItem++;
                FicheTechniqueMenuItem::create([
                    'id_partie' => $newPartie->id,
                    'id_fiche_technique' => $item['id_fiche_technique'] ?? null,
                    'id_produit' => $item['id_produit'] ?? null,
                    'designation' => $item['designation'] ?? null,
                    'pourcentage' => $item['pourcentage'],
                    'ordre' => $item['ordre'] ?? $ordreItem,
                ]);
            }
        }
    }
}
