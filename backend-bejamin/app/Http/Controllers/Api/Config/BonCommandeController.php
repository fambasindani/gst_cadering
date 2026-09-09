<?php

namespace App\Http\Controllers\Api\Config;

use App\Http\Controllers\Controller;
use App\Models\BonCommande;
use App\Models\LigneCommande;
use App\Models\Lot;
use App\Models\MouvementStock;
use App\Models\Notification;
use App\Models\Partenaire;
use App\Models\PrixCommande;
use App\Models\Utilisateur;
use App\Jobs\EnvoyerAlerteReception;
use App\Jobs\EnvoyerAlertePrixBonCommande;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Helpers\CodeGenerator;

class BonCommandeController extends Controller
{
    /**
     * Liste des bons de commande
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $statut = $request->input('statut');
            $statutValidation = $request->input('statut_validation');
            $magasinId = $request->input('magasin_id');
            $partenaireId = $request->input('partenaire_id');
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $validationReceptions = $request->boolean('validation_receptions');
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = BonCommande::with([
                'partenaire',
                'magasinDestination',
                'devise',
                'utilisateur',
                'validePar',
                'lignes.produit',
                'lignes.produit.historiquePrix'
            ]);

            if ($search) {
                $query->search($search);
            }

            if ($statut) {
                $query->byStatut($statut);
            }

            if ($statutValidation) {
                $query->where('statut_validation', $statutValidation);
            }

            if ($magasinId) {
                $query->byMagasin($magasinId);
            }

            if ($partenaireId) {
                $query->byPartenaire($partenaireId);
            }

            if ($dateDebut) {
                $query->whereDate('date_commande', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->whereDate('date_commande', '<=', $dateFin);
            }

            if ($validationReceptions) {
                $query->whereExists(function ($sub) {
                    $sub->select(DB::raw('1'))
                        ->from('mouvement_stock')
                        ->whereColumn('mouvement_stock.reference_document', 'bon_commande.numero_commande')
                        ->where('mouvement_stock.id_type_mouvement', 1)
                        ->where('mouvement_stock.statut_validation', 'EN ATTENTE');
                });
            }

            $data = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            // Ajouter le prix actuel (dernier prix d'achat) et le montant recalculé au prix actuel
            foreach ($data as $bon) {
                $montantActuel = 0;
                foreach ($bon->lignes as $ligne) {
                    $produit = $ligne->produit;
                    $dernierPrix = $produit && $produit->historiquePrix
                        ? $produit->historiquePrix
                            ->filter(fn($h) => $h->prix_achat_ht !== null)
                            ->sortByDesc('date_application')
                            ->first()
                        : null;
                    $prixActuel = $dernierPrix ? (float) $dernierPrix->prix_achat_ht : (float) $ligne->prix_unitaire_ht;
                    $ligne->prix_actuel = $prixActuel;
                    $montantActuel += $ligne->quantite_commandee * $prixActuel;
                }
                $bon->montant_actuel = round($montantActuel, 2);

                if ($validationReceptions) {
                    $bon->receptions_en_attente = MouvementStock::where('reference_document', $bon->numero_commande)
                        ->where('id_type_mouvement', 1)
                        ->where('statut_validation', 'EN ATTENTE')
                        ->with(['lot.produit', 'lot.magasin'])
                        ->orderBy('id')
                        ->get();
                }
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Liste des bons de commande récupérée avec succès'
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
     * Créer un bon de commande
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'numero_commande' => 'nullable|string|max:50|unique:bon_commande,numero_commande|regex:/^[A-Z0-9 _-]+\/\d{1,3}\/\d{2}\/\d{4}(\/\d+)?$/i',
                'id_partenaire' => 'required|exists:partenaires,id',
                'id_magasin_destination' => 'required|exists:magasins,id',
                'date_commande' => 'required|date',
                'date_livraison_prevue' => 'nullable|date|after_or_equal:date_commande',
                'id_devise' => 'nullable|exists:devises,id',
                'commentaire' => 'nullable|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.id_produit' => 'required|exists:produits,id',
                'lignes.*.quantite_commandee' => 'required|integer|min:1',
                'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
                'lignes.*.id_devise' => 'required|exists:devises,id',
            ], [
                'numero_commande.regex' => 'Le numéro doit respecter le format FOURNISSEUR/SEMAINE/MM/YYYY (ex: AIRFRANCE/036/08/2026)',
            ]);

            DB::beginTransaction();

            try {
                // Auto-générer le numéro de commande si non fourni : FOURNISSEUR/SEMAINE/MM/YYYY
                if (empty($validated['numero_commande'])) {
                    $partenaire = Partenaire::find($validated['id_partenaire']);
                    $nomFournisseur = $partenaire ? $partenaire->nom : 'BON';
                    $validated['numero_commande'] = CodeGenerator::bonCommandeCode($nomFournisseur);
                }

                // Créer le bon de commande
                $bonCommande = BonCommande::create([
                    'numero_commande' => $validated['numero_commande'],
                    'id_partenaire' => $validated['id_partenaire'],
                    'id_magasin_destination' => $validated['id_magasin_destination'],
                    'date_commande' => $validated['date_commande'],
                    'date_livraison_prevue' => $validated['date_livraison_prevue'] ?? null,
                    'id_devise' => $validated['id_devise'] ?? null,
                    'id_utilisateur' => Auth::id(),
                    'commentaire' => $validated['commentaire'] ?? null,
                    'statut' => 'BROUILLON',
                    'statut_validation' => 'EN ATTENTE',
                ]);

                // Créer les lignes de commande
                $total = 0;
                foreach ($validated['lignes'] as $ligne) {
                    $ligneCommande = LigneCommande::create([
                        'id_bon_commande' => $bonCommande->id,
                        'id_produit' => $ligne['id_produit'],
                        'quantite_commandee' => $ligne['quantite_commandee'],
                        'prix_unitaire_ht' => $ligne['prix_unitaire_ht'],
                        'id_devise' => $ligne['id_devise'],
                    ]);

                    $total += $ligne['quantite_commandee'] * $ligne['prix_unitaire_ht'];
                }

                // Mettre à jour le montant total
                $bonCommande->update(['montant_total_ht' => $total]);

                // Comparer prix de chaque ligne vs dernier prix_commande
                $alertesPrix = [];
                foreach ($validated['lignes'] as $ligne) {
                    $dernierPrix = PrixCommande::dernierPrix($ligne['id_produit']);
                    $prixBc = (float) $ligne['prix_unitaire_ht'];

                    // Insérer le prix du bon de commande dans prix_commande
                    PrixCommande::create([
                        'id_produit' => $ligne['id_produit'],
                        'prix_commande' => $prixBc,
                        'id_devise' => $ligne['id_devise'],
                        'date' => $validated['date_commande'],
                        'origine' => 'bon_commande',
                        'commentaire' => 'Bon de commande #' . $validated['numero_commande'],
                    ]);

                    if ($dernierPrix && abs((float) $dernierPrix->prix_commande - $prixBc) > 0.001) {
                        $ecart = $prixBc - (float) $dernierPrix->prix_commande;
                        $pct = $dernierPrix->prix_commande > 0
                            ? round(($ecart / (float) $dernierPrix->prix_commande) * 100, 1)
                            : 0;
                        $signe = $ecart > 0 ? '+' : '';
                        $produit = \App\Models\Produit::find($ligne['id_produit']);
                        $alertesPrix[] = [
                            'type' => 'prix',
                            'produit' => $produit->nom ?? 'Produit #' . $ligne['id_produit'],
                            'ancien' => number_format((float) $dernierPrix->prix_commande, 2) . ' $',
                            'nouveau' => number_format($prixBc, 2) . ' $',
                            'difference' => $signe . number_format($ecart, 2) . ' $ (' . $signe . $pct . '%)',
                        ];
                    }
                }

                // Envoyer notifications + email si alertes
                if (!empty($alertesPrix)) {
                    $partenaire = Partenaire::find($validated['id_partenaire']);
                    $messageAlerte = count($alertesPrix) . ' prix différent(s) pour le bon #' . $validated['numero_commande'];
                    $users = Utilisateur::actif()->get();
                    foreach ($users as $user) {
                        Notification::create([
                            'type' => 'alerte_prix_commande',
                            'message' => $messageAlerte,
                            'id_utilisateur' => $user->id,
                            'reference_type' => BonCommande::class,
                            'reference_id' => $bonCommande->id,
                        ]);
                    }

                    $alertesPrixPayload = $alertesPrix;
                    $numeroCommande = $validated['numero_commande'];
                    $partenaireNom = $partenaire->nom ?? 'N/A';
                    $dateCommande = $validated['date_commande'];
                }

                DB::commit();

                // Dispatch job email APRÈS commit
                if (!empty($alertesPrixPayload ?? null)) {
                    \App\Jobs\EnvoyerAlertePrixBonCommande::dispatch(
                        $alertesPrixPayload,
                        $numeroCommande,
                        $partenaireNom,
                        $dateCommande
                    );
                }

                // Créer/mettre à jour une notification pour tous les utilisateurs actifs ayant la permission
                $count = BonCommande::where('statut_validation', 'EN ATTENTE')->count();
                $users = Utilisateur::actif()->get();
                foreach ($users as $user) {
                    if (!$user->hasPermission('config:bon_commande:view')) continue;
                    $existing = Notification::where('type', 'bon_commande_en_attente')
                        ->where('id_utilisateur', $user->id)
                        ->whereNull('read_at')
                        ->first();
                    if ($existing) {
                        $existing->update(['message' => "{$count} bon(s) de commande en attente de validation"]);
                    } else {
                        Notification::create([
                            'type' => 'bon_commande_en_attente',
                            'message' => "{$count} bon(s) de commande en attente de validation",
                            'id_utilisateur' => $user->id,
                            'reference_type' => BonCommande::class,
                            'reference_id' => null,
                        ]);
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => array_merge(
                        $bonCommande->load(['partenaire', 'magasinDestination', 'devise', 'lignes.produit'])->toArray(),
                        ['alertes_prix' => $alertesPrix]
                    ),
                    'message' => 'Bon de commande créé avec succès'
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
                'message' => 'Erreur lors de la création du bon de commande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un bon de commande
     */
    public function show($id)
    {
        try {
            $bonCommande = BonCommande::with([
                'partenaire',
                'magasinDestination',
                'devise',
                'utilisateur',
                'validePar',
                'lignes.produit',
                'lignes.devise'
            ])->findOrFail($id);

            // Montant reçu au prix de réception (somme lot × quantité × prix_achat du lot)
            // + détail de chaque réception (traçabilité) : date, lot, quantité, prix, montant
            $receptionsParReference = [];
            foreach ($bonCommande->lignes as $ligne) {
                $mouvements = MouvementStock::where('reference_document', $bonCommande->numero_commande)
                    ->whereHas('lot', function($q) use ($ligne) {
                        $q->where('id_produit', $ligne->id_produit);
                    })
                    ->with('lot')
                    ->orderBy('id', 'asc')
                    ->get();
                $montantRecu = 0;
                $receptions = [];
                foreach ($mouvements as $mouv) {
                    if (!$mouv->lot) continue;
                    $prix = $mouv->lot->prix_achat_ht_unitaire ?? $ligne->prix_unitaire_ht;
                    $montantRecu += $mouv->quantite * $prix;
                    $dateReception = $mouv->date_mouvement ? $mouv->date_mouvement->format('Y-m-d') : null;
                    $receptions[] = [
                        'id' => $mouv->id,
                        'reference_reception' => $mouv->reference_reception,
                        'date' => $dateReception,
                        'numero_lot' => $mouv->lot->numero_lot,
                        'quantite' => $mouv->quantite,
                        'prix_unitaire' => round((float) $prix, 2),
                        'montant' => round($mouv->quantite * $prix, 2),
                        'statut' => $mouv->statut_validation,
                    ];
                    $cle = $mouv->reference_reception
                        ?: ('LEGACY-' . ($mouv->date_mouvement ? $mouv->date_mouvement->format('Y-m-d H:i:s') : $mouv->id));
                    $receptionsParReference[$cle][] = [
                        'id' => $mouv->id,
                        'date' => $dateReception,
                        'id_ligne' => $ligne->id,
                        'produit' => $ligne->produit->nom ?? '',
                        'code_article' => $ligne->produit->code_article ?? '',
                        'numero_lot' => $mouv->lot->numero_lot,
                        'quantite' => $mouv->quantite,
                        'prix_unitaire' => round((float) $prix, 2),
                        'montant' => round($mouv->quantite * $prix, 2),
                        'statut' => $mouv->statut_validation,
                    ];
                }
                $ligne->montant_recu = round($montantRecu, 2);
                $ligne->receptions = $receptions;
            }
            $bonCommande->receptions_liste = collect($receptionsParReference)
                ->map(function ($items, $ref) {
                    $montant = collect($items)->sum('montant');
                    $quantite = collect($items)->sum('quantite');
                    return [
                        'reference_reception' => $ref,
                        'date' => $items[0]['date'] ?? null,
                        'quantite' => $quantite,
                        'montant' => round($montant, 2),
                        'lignes' => $items,
                    ];
                })
                ->sortByDesc(fn($r) => $r['date'])
                ->values();

            return response()->json([
                'success' => true,
                'data' => $bonCommande,
                'message' => 'Détail du bon de commande récupéré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bon de commande non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un bon de commande (seulement si BROUILLON)
     */
    public function update(Request $request, $id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            // Vérifier que le bon est en attente de validation (sauf ADMIN)
            if ($bonCommande->statut_validation !== 'EN ATTENTE' && !Auth::user()->hasRole('ADMIN')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un bon en attente de validation peut être modifié'
                ], 403);
            }

            $validated = $request->validate([
                'id_partenaire' => 'sometimes|required|exists:partenaires,id',
                'id_magasin_destination' => 'sometimes|required|exists:magasins,id',
                'date_commande' => 'sometimes|required|date',
                'date_livraison_prevue' => 'nullable|date|after_or_equal:date_commande',
                'id_devise' => 'nullable|exists:devises,id',
                'commentaire' => 'nullable|string',
            ]);

            $bonCommande->update($validated);

            return response()->json([
                'success' => true,
                'data' => $bonCommande->load(['partenaire', 'magasinDestination', 'devise']),
                'message' => 'Bon de commande mis à jour avec succès'
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
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un bon de commande (seulement si BROUILLON)
     */
    public function destroy($id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            if ($bonCommande->statut !== 'BROUILLON') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un bon en brouillon peut être supprimé'
                ], 403);
            }

            DB::beginTransaction();

            try {
                // Supprimer les prix_commande liés à ce bon (origine bon_commande + reception)
                PrixCommande::where('commentaire', 'LIKE', '%' . $bonCommande->numero_commande . '%')
                    ->whereIn('origine', ['bon_commande', 'reception'])
                    ->delete();

                // Supprimer les lignes et le bon
                $bonCommande->lignes()->delete();
                $bonCommande->delete();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Bon de commande supprimé avec succès'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Valider un bon de commande
     */
    public function validateBon($id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            if ($bonCommande->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce bon a déjà été validé ou rejeté'
                ], 403);
            }

            $bonCommande->update([
                'statut_validation' => 'VALIDÉ',
                'valide_par' => Auth::id(),
                'date_validation' => now(),
            ]);

            // Mettre à jour les notifications existantes
            $remaining = BonCommande::where('statut_validation', 'EN ATTENTE')->count();
            if ($remaining > 0) {
                Notification::where('type', 'bon_commande_en_attente')
                    ->whereNull('read_at')
                    ->update(['message' => "{$remaining} bon(s) de commande en attente de validation"]);
            } else {
                Notification::where('type', 'bon_commande_en_attente')
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            return response()->json([
                'success' => true,
                'data' => $bonCommande,
                'message' => 'Bon de commande validé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejeter un bon de commande
     */
    public function rejectBon($id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            if ($bonCommande->statut_validation !== 'EN ATTENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce bon a déjà été validé ou rejeté'
                ], 403);
            }

            $bonCommande->update([
                'statut_validation' => 'REJETÉ',
                'valide_par' => Auth::id(),
                'date_validation' => now(),
            ]);

            // Mettre à jour les notifications existantes
            $remaining = BonCommande::where('statut_validation', 'EN ATTENTE')->count();
            if ($remaining > 0) {
                Notification::where('type', 'bon_commande_en_attente')
                    ->whereNull('read_at')
                    ->update(['message' => "{$remaining} bon(s) de commande en attente de validation"]);
            } else {
                Notification::where('type', 'bon_commande_en_attente')
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            return response()->json([
                'success' => true,
                'data' => $bonCommande,
                'message' => 'Bon de commande rejeté avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Réceptionner un bon de commande (partielle ou totale)
     */
    public function receive(Request $request, $id)
    {
        try {
            $bonCommande = BonCommande::with('lignes')->findOrFail($id);

            $hasCorrections = $request->filled('corrections') && count($request->input('corrections', [])) > 0;

            if ($hasCorrections && !Auth::user()->hasRole('ADMIN')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un administrateur peut corriger une réception'
                ], 403);
            }

            if ($bonCommande->statut !== 'BROUILLON' && $bonCommande->statut !== 'EN ATTENTE' && $bonCommande->statut !== 'REÇU PARTIELLEMENT' && !($hasCorrections && $bonCommande->statut === 'REÇU')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce bon ne peut pas être réceptionné'
                ], 403);
            }

            // Un brouillon peut être réceptionné directement : la réception vaut
            // validation du bon. Le stock est pris en compte à la validation des
            // réceptions dans « Validation → Bon de commande ».

            $validated = $request->validate([
                'receptions' => 'nullable|array',
                'receptions.*.id_ligne_commande' => 'required|exists:ligne_commande,id',
                'receptions.*.quantite_recue' => 'required|integer|min:1',
                'receptions.*.numero_lot' => 'nullable|string|max:50',
                'receptions.*.date_peremption' => 'required|date|after_or_equal:today',
                'receptions.*.prix_achat_ht_unitaire' => 'nullable|numeric|min:0',
                'receptions.*.date_reception' => 'nullable|date',
                'receptions.*.reference_document' => 'nullable|string|max:100',
                'corrections' => 'nullable|array',
                'corrections.*.id_ligne_commande' => 'required|exists:ligne_commande,id',
                'corrections.*.nouvelle_quantite_recue' => 'required|integer|min:0',
            ]);

            if (empty($validated['receptions']) && empty($validated['corrections'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune réception ou correction à enregistrer'
                ], 422);
            }

            // Déterminer si le bon restera partiel (REÇU PARTIELLEMENT) après cette opération.
            // Chaque réception crée des lots en BROUILLON et des mouvements en EN ATTENTE :
            // ils doivent être validés dans la page « Validation → Bon de commande » pour que
            // le stock soit pris en charge (visible dans les lots).
            $quantitesApres = [];
            foreach ($bonCommande->lignes as $ligne) {
                $quantitesApres[$ligne->id] = $ligne->quantite_recue;
            }
            foreach ($validated['corrections'] ?? [] as $correction) {
                $quantitesApres[$correction['id_ligne_commande']] = (int) $correction['nouvelle_quantite_recue'];
            }
            foreach ($validated['receptions'] ?? [] as $reception) {
                $idLigne = $reception['id_ligne_commande'];
                $quantitesApres[$idLigne] = ($quantitesApres[$idLigne] ?? 0) + (int) $reception['quantite_recue'];
            }
            $restePartiel = false;
            foreach ($bonCommande->lignes as $ligne) {
                if (($quantitesApres[$ligne->id] ?? 0) < $ligne->quantite_commandee) {
                    $restePartiel = true;
                    break;
                }
            }

            DB::beginTransaction();

            try {
                // Référence unique de cette opération de réception (traçabilité PDF)
                $referenceReception = 'REC-' . date('ym') . '-' . str_pad((int) MouvementStock::where('reference_reception', 'LIKE', 'REC-' . date('ym') . '-%')->count() + 1, 4, '0', STR_PAD_LEFT);

                // 1. Appliquer les corrections (ADMIN) : ajuster la quantité reçue + rééquilibrer le stock
                foreach ($validated['corrections'] ?? [] as $correction) {
                    $ligne = LigneCommande::findOrFail($correction['id_ligne_commande']);

                    if ($ligne->id_bon_commande != $bonCommande->id) {
                        throw new \Exception('Ligne de commande invalide');
                    }

                    $nouveau = (int) $correction['nouvelle_quantite_recue'];
                    if ($nouveau > $ligne->quantite_commandee) {
                        throw new \Exception("Quantité corrigée (${nouveau}) dépasse la quantité commandée ({$ligne->quantite_commandee})");
                    }

                    $delta = $nouveau - $ligne->quantite_recue;
                    if ($delta == 0) {
                        continue;
                    }

                    $mouvements = $this->lotsDeReception($bonCommande, $ligne);

                    if ($delta > 0) {
                        // Augmentation : ajuster le lot le plus récent de la réception
                        if ($mouvements->isNotEmpty()) {
                            $mouv = $mouvements->first();
                            $lot = $mouv->lot;
                            $lot->quantite_recue += $delta;
                            $lot->quantite_disponible += $delta;
                            $lot->save();
                            $mouv->quantite += $delta;
                            $mouv->save();
                        } else {
                            $this->creerLotReception($bonCommande, $ligne, $delta, null, now()->toDateString(), null, null, null, true, $referenceReception);
                        }
                    } else {
                        // Diminution : retirer du stock des lots de réception (du plus récent au plus ancien)
                        $reduction = abs($delta);
                        foreach ($mouvements as $mouv) {
                            if ($reduction <= 0) {
                                break;
                            }
                            $lot = $mouv->lot;
                            if (!$lot) {
                                continue;
                            }
                            $take = min($lot->quantite_recue, $reduction);
                            if ($take <= 0) {
                                continue;
                            }
                            $lot->quantite_recue -= $take;
                            $lot->quantite_disponible = max(0, $lot->quantite_disponible - $take);
                            $lot->save();

                            $mouv->quantite -= $take;
                            if ($mouv->quantite <= 0) {
                                $mouv->delete();
                            } else {
                                $mouv->save();
                            }

                            $reduction -= $take;
                        }
                        if ($reduction > 0) {
                            throw new \Exception("Stock insuffisant pour réduire la quantité reçue");
                        }
                    }

                    $ligne->quantite_recue = $nouveau;
                    $ligne->save();
                }

                // 2. Ajouts de réception
                foreach ($validated['receptions'] ?? [] as $reception) {
                    $ligne = LigneCommande::findOrFail($reception['id_ligne_commande']);
                    
                    // Vérifier que la ligne appartient bien au bon
                    if ($ligne->id_bon_commande != $bonCommande->id) {
                        throw new \Exception('Ligne de commande invalide');
                    }

                    // Vérifier la quantité
                    $quantiteRestante = $ligne->quantite_commandee - $ligne->quantite_recue;
                    if ($reception['quantite_recue'] > $quantiteRestante) {
                        throw new \Exception("Quantité reçue (${reception['quantite_recue']}) dépasse la quantité restante (${quantiteRestante})");
                    }

                    // Créer le lot + le mouvement d'entrée
                    $this->creerLotReception(
                        $bonCommande,
                        $ligne,
                        $reception['quantite_recue'],
                        $reception['numero_lot'] ?? null,
                        $reception['date_peremption'],
                        $reception['prix_achat_ht_unitaire'] ?? null,
                        $reception['date_reception'] ?? null,
                        $reception['reference_document'] ?? null,
                        true,
                        $referenceReception
                    );

                    // Capturer l'ancienne quantité AVANT mise à jour
                    $qteAvant = (int) $ligne->quantite_recue;

                    // Mettre à jour la ligne de commande
                    $ligne->quantite_recue += $reception['quantite_recue'];
                    $ligne->save();
                }

                // 3. Comparer prix/quantité et créer alertes + inserer nouveau prix
                $alertes = [];
                foreach ($validated['receptions'] ?? [] as $reception) {
                    $ligne = LigneCommande::with('produit')->find($reception['id_ligne_commande']);
                    if (!$ligne) continue;

                    $prixRecu = (float) ($reception['prix_achat_ht_unitaire'] ?? $ligne->prix_unitaire_ht);
                    $qteRecue = (int) $reception['quantite_recue'];
                    $qteCommandee = (int) $ligne->quantite_commandee;
                    // quantite_recue sur la ligne = déjà mis à jour par la loop 2
                    $qteTotaleApres = (int) $ligne->quantite_recue;
                    $qteDejaRecue = $qteTotaleApres - $qteRecue;

                    // Comparer le prix de réception avec le dernier prix dans prix_commande
                    $dernierPrixCmd = PrixCommande::dernierPrix($ligne->id_produit);
                    if ($dernierPrixCmd && abs((float) $dernierPrixCmd->prix_commande - $prixRecu) > 0.001) {
                        $ecart = $prixRecu - (float) $dernierPrixCmd->prix_commande;
                        $pct = $dernierPrixCmd->prix_commande > 0
                            ? round(($ecart / (float) $dernierPrixCmd->prix_commande) * 100, 1)
                            : 0;
                        $signe = $ecart > 0 ? '+' : '';
                        $alertes[] = [
                            'type' => 'prix',
                            'produit' => $ligne->produit->nom ?? 'Produit #' . $ligne->id_produit,
                            'ancien' => number_format((float) $dernierPrixCmd->prix_commande, 2) . ' $',
                            'nouveau' => number_format($prixRecu, 2) . ' $',
                            'difference' => $signe . number_format($ecart, 2) . ' $ (' . $signe . $pct . '%)',
                        ];
                    }

                    // Comparer quantité totale reçue (cumul) vs quantité commandée
                    if ($qteTotaleApres !== $qteCommandee) {
                        $ecartQte = $qteTotaleApres - $qteCommandee;
                        $signeQte = $ecartQte > 0 ? '+' : '';
                        $alertes[] = [
                            'type' => 'quantite',
                            'produit' => $ligne->produit->nom ?? 'Produit #' . $ligne->id_produit,
                            'ancien' => $qteDejaRecue . ' unités',
                            'nouveau' => $qteTotaleApres . ' unités',
                            'difference' => $signeQte . $ecartQte . ' unité(s)',
                        ];
                    }

                    // Insérer le nouveau prix de réception dans prix_commande
                    PrixCommande::create([
                        'id_produit' => $ligne->id_produit,
                        'prix_commande' => $prixRecu,
                        'id_devise' => $ligne->id_devise,
                        'date' => $reception['date_reception'] ?? now()->toDateString(),
                        'origine' => 'reception',
                        'commentaire' => 'Réception du bon #' . $bonCommande->numero_commande,
                    ]);

                    // Insérer aussi dans historique_prix (dernier prix visible sur la fiche produit)
                    \App\Models\HistoriquePrix::create([
                        'id_produit' => $ligne->id_produit,
                        'prix_achat_ht' => $prixRecu,
                        'id_devise' => $ligne->id_devise,
                        'date_application' => $reception['date_reception'] ?? now()->toDateString(),
                        'commentaire' => 'Réception du bon #' . $bonCommande->numero_commande,
                        'id_utilisateur' => Auth::id(),
                    ]);
                }

                // Envoyer notification + email si alertes
                if (!empty($alertes)) {
                    $users = Utilisateur::where('actif', true)->get();
                    $messageAlerte = count($alertes) . ' alerte(s) pour la réception du bon #' . $bonCommande->numero_commande;
                    foreach ($users as $user) {
                        Notification::create([
                            'type' => 'alerte_reception',
                            'message' => $messageAlerte,
                            'id_utilisateur' => $user->id,
                            'reference_type' => BonCommande::class,
                            'reference_id' => $bonCommande->id,
                        ]);
                    }

                    $alertesPayload = $alertes;
                    $numeroCommandeReception = $bonCommande->numero_commande;
                    $partenaireNomReception = $bonCommande->partenaire->nom ?? 'N/A';
                }

                // Mettre à jour le statut du bon : la réception passe en attente de validation
                $bonCommande->refresh();
                $bonCommande->statut = 'EN ATTENTE';
                $bonCommande->save();

                DB::commit();

                // Dispatch job email APRÈS commit
                if (!empty($alertesPayload ?? null)) {
                    \App\Jobs\EnvoyerAlerteReception::dispatch(
                        $alertesPayload,
                        $numeroCommandeReception,
                        $partenaireNomReception,
                        now()->format('d/m/Y')
                    );
                }

                $data = $bonCommande->load(['partenaire', 'magasinDestination', 'lignes'])->toArray();
                $data['reference_reception'] = $referenceReception;
                $data['reception_complete'] = $bonCommande->isComplete();
                $data['alertes'] = $alertes;

                return response()->json([
                    'success' => true,
                    'data' => $data,
                    'message' => 'Réception effectuée avec succès'
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
                'message' => 'Erreur lors de la réception',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un lot de réception + son mouvement d'entrée.
     * Toute réception est créée en attente : elle doit être validée dans
     * Validation > Bon de commande avant d'être prise en compte dans le stock.
     */
    private function creerLotReception(BonCommande $bonCommande, LigneCommande $ligne, int $quantite, ?string $numeroLot, string $datePeremption, $prixAchat, $dateReception = null, $referenceDocument = null, bool $brouillon = false, $referenceReception = null)
    {
        $numeroLot = $numeroLot ?: CodeGenerator::lot();
        $dateReception = $dateReception ?: now()->toDateTimeString();
        $referenceDocument = $referenceDocument ?: $bonCommande->numero_commande;

        $lot = Lot::create([
            'id_produit' => $ligne->id_produit,
            'id_magasin' => $bonCommande->id_magasin_destination,
            'numero_lot' => $numeroLot,
            'code_qr' => 'QR-' . $numeroLot . '-' . uniqid(),
            'quantite_recue' => $quantite,
            'quantite_disponible' => $quantite,
            'date_peremption' => $datePeremption,
            'date_reception' => $dateReception,
            'id_partenaire' => $bonCommande->id_partenaire,
            'prix_achat_ht_unitaire' => $prixAchat ?? $ligne->prix_unitaire_ht,
            'id_devise' => $ligne->id_devise,
            'statut_validation' => $brouillon ? 'BROUILLON' : 'VALIDÉ',
            'valide_par' => $brouillon ? null : Auth::id(),
            'date_validation' => $brouillon ? null : now(),
        ]);

        MouvementStock::create([
            'id_lot' => $lot->id,
            'id_type_mouvement' => 1, // Entrée réception
            'quantite' => $quantite,
            'date_mouvement' => $dateReception,
            'id_utilisateur' => Auth::id(),
            'reference_document' => $referenceDocument,
            'reference_reception' => $referenceReception,
            'commentaire' => 'Réception du bon de commande #' . $bonCommande->numero_commande,
            'statut_validation' => $brouillon ? 'EN ATTENTE' : 'VALIDÉ',
            'valide_par' => $brouillon ? null : Auth::id(),
            'date_validation' => $brouillon ? null : now(),
        ]);

        // Enregistrer le prix reçu dans l'historique des prix du produit
        // (pour un brouillon, l'historique est enregistré à la validation dans « Entrée stock »)
        if (!$brouillon) {
            $lot->enregistrerHistoriquePrix('Réception du bon de commande #' . $bonCommande->numero_commande);
        }

        return $lot;
    }

    /**
     * Mouvements de réception d'une ligne (via référence du bon), du plus récent au plus ancien
     */
    private function lotsDeReception(BonCommande $bonCommande, LigneCommande $ligne)
    {
        return MouvementStock::where('reference_document', $bonCommande->numero_commande)
            ->whereHas('lot', function($q) use ($ligne) {
                $q->where('id_produit', $ligne->id_produit);
            })
            ->with('lot')
            ->orderBy('id', 'desc')
            ->get();
    }

    /**
     * Clôturer un bon de commande (uniquement s'il est reçu partiellement).
     */
    public function cloturer($id)
    {
        try {
            $bonCommande = BonCommande::findOrFail($id);

            if ($bonCommande->statut !== 'REÇU PARTIELLEMENT') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un bon reçu partiellement peut être clôturé'
                ], 403);
            }

            if ($bonCommande->statut_validation !== 'VALIDÉ') {
                return response()->json([
                    'success' => false,
                    'message' => 'Le bon de commande doit être validé avant sa clôture'
                ], 403);
            }

            $bonCommande->statut = 'CLOTURE';
            $bonCommande->save();

            return response()->json([
                'success' => true,
                'data' => $bonCommande,
                'message' => 'Bon de commande clôturé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la clôture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Valider une réception depuis le workflow des bons de commande.
     */
    public function validateReception($id, $mouvementId)
    {
        return $this->updateReceptionValidation($id, $mouvementId, 'VALIDÉ');
    }

    /**
     * Rejeter une réception depuis le workflow des bons de commande.
     */
    public function rejectReception($id, $mouvementId)
    {
        return $this->updateReceptionValidation($id, $mouvementId, 'REJETÉ');
    }

    private function updateReceptionValidation($id, $mouvementId, string $statut)
    {
        try {
            $bonCommande = BonCommande::with('lignes')->findOrFail($id);
            $mouvement = MouvementStock::with('lot')
                ->where('id', $mouvementId)
                ->where('reference_document', $bonCommande->numero_commande)
                ->where('id_type_mouvement', 1)
                ->where('statut_validation', 'EN ATTENTE')
                ->firstOrFail();

            DB::transaction(function () use ($mouvement, $statut, $bonCommande) {
                $mouvement->update([
                    'statut_validation' => $statut,
                    'valide_par' => Auth::id(),
                    'date_validation' => now(),
                ]);

                $lot = $mouvement->lot;
                if ($lot && $lot->statut_validation === 'BROUILLON') {
                    $lot->update([
                        'statut_validation' => $statut === 'VALIDÉ' ? 'VALIDÉ' : 'REJETÉ',
                        'valide_par' => Auth::id(),
                        'date_validation' => now(),
                    ]);

                    if ($statut === 'VALIDÉ') {
                        $lot->enregistrerHistoriquePrix('Validation de la réception du bon de commande');
                    }

                    // Si rejeté, supprimer le prix_commande inséré lors de cette réception
                    if ($statut === 'REJETÉ') {
                        PrixCommande::where('id_produit', $lot->id_produit)
                            ->where('origine', 'reception')
                            ->where('commentaire', 'LIKE', '%Réception du bon #' . $bonCommande->numero_commande . '%')
                            ->delete();
                    }
                }

                // Si le bon est EN ATTENTE, vérifier s'il reste des mouvements en attente
                if ($bonCommande->statut === 'EN ATTENTE') {
                    $resteEnAttente = MouvementStock::where('reference_document', $bonCommande->numero_commande)
                        ->where('id_type_mouvement', 1)
                        ->where('statut_validation', 'EN ATTENTE')
                        ->exists();

                    if (!$resteEnAttente) {
                        // Plus aucun mouvement en attente → calculer le statut final
                        $bonCommande->refresh();
                        $bonCommande->statut = $bonCommande->isComplete() ? 'REÇU' : 'REÇU PARTIELLEMENT';
                        $bonCommande->statut_validation = 'VALIDÉ';
                        $bonCommande->valide_par = Auth::id();
                        $bonCommande->date_validation = now();
                        $bonCommande->save();
                    }
                }
            });

            return response()->json([
                'success' => true,
                'data' => $mouvement->fresh(['lot.produit']),
                'message' => $statut === 'VALIDÉ'
                    ? 'Réception validée et prise en compte dans le stock'
                    : 'Réception rejetée'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Erreur lors du traitement de la réception',
            ], 422);
        }
    }

}
