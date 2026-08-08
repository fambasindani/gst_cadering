## Résumé des sessions

### Session 1 – Rapports, Dashboard, Lots, Entrées/Sorties stock
- **Rapport Rupture stock** : `RapportController::ruptureStock()`, route, page frontend
- **Rapport Stock bas** : `RapportController::stockBas()` (basé sur `getStockTotal()`), route, page frontend
- **Dashboard** : stat card orange "Stock bas" + champ `produits_stock_bas`
- **Blocage modification lot validé** : backend retourne 403, frontend bannière ambre + submit désactivé
- **Masquage icônes lots validés** : `Edit3`/`Trash2` cachés si `statut_validation !== 'EN ATTENTE'`
- **Modification quantité lot** : `quantite_recue`/`date_fabrication` ajoutés, `quantite_disponible` synchronisé
- **Icônes Modifier/Supprimer masquées** pour entrées stock validées (`EntreeStockForm.tsx`), sorties stock validées (`SortieStockForm.tsx`), retours validés (`RetourStock.tsx`)

### Session 2 – Relation Facture ↔ Sortie stock
- **Migration** : ajout de `id_facture` (nullable FK) dans `mouvement_stock`
- **Modèles** : `MouvementStock.facture()`, `Facture.mouvements()`
- **FactureController::genererSortieStock()** : crée des mouvements **auto-validés** avec déduction directe du stock. Si `id_lot` manquant sur une ligne, cherche automatiquement un lot validé par produit
- **Frontend FactureDetails** : bouton "Sortie stock" (orange) pour factures EMISE/PAYEE, désactivé si déjà généré, tableau des sorties liées
- **Frontend SortieStockForm** : champ "Facture liée" (SearchableSelect), colonne facture dans la liste
- **FactureForm** : colonne "Lot" ajoutée dans le tableau des lignes (SearchableSelect filtré par produit)
- **FactureController::update()** : accepte et traite les lignes (supprime/recrée), recalcule le montant
- **Erreurs validation** : messages d'erreur réels maintenant affichés (vs "Erreur lors de la validation" générique)

### Session 3 – Sidebar : Emplacement et Catégorie
- **Types** : `emplacement.ts`, `categorie.ts`
- **Services** : `emplacement.ts`, `categorie.ts`
- **Pages CRUD** : `ConfigurationEmplacement.tsx`, `ConfigurationCategorie.tsx` (SlidePanel, pagination, recherche, toggle actif)
- **Routes** : `/configuration/emplacement`, `/configuration/categorie`
- **Menu** : ajoutés sous Configuration dans `mockData.ts`

### Session 4 – Refonte Ville→Magasin (résumé en cours)
- Tables renommées : `villes`→`magasins`, `id_ville`→`id_magasin` ; `zones`/`emplacements` supprimées (migration `2026_08_01_120000_magasin_restructuration.php`)
- `MagasinSeeder` : Kinshasa (KIN) + Lubumbashi (LUB) uniquement
- Frontend : fichiers `magasin.ts` (types/services), `ConfigurationMagasin.tsx`, suppression zone/emplacement, `byMagasin`/`getStockParMagasin`

### Session 5 – Suppression Devis + prix d'achat partout + départements réduits
- **Devis supprimé entièrement** : tables `devis`/`ligne_devis` (migration `2026_08_02_000000_drop_devis_tables.php`), modèles `Devis`/`LigneDevis`, `DevisController`, routes `facturation/devis`, `DevisList/Form/Details.tsx`, `services/devis.ts`, `DevisPDF.tsx`, types `LigneDevis`/`Devis`/`DevisFormData`, menu sidebar, permissions `facturation:devis:*` (seeder + base), `CodeGenerator::devis()`, entrées AuditMiddleware
- **`CodeGenerator::devis()` supprimé** (générateur `DEV-...`)
- **Prix d'achat partout** : `prix_vente_ht` retiré des formulaires/affichages produit (`ProduitForm`, `ProduitDetails`), types `ProduitFormData`/`HistoriquePrix`, `services/produit.ts` (addPrix/updatePrix), `HistoriquePrixController` (store/update/dernierPrix), `ProduitController::store`, `Produit::getDernierPrixVente()` supprimé
- **`FactureController`** : le prix des lignes vient désormais du **prix d'achat** via `getPrixAchatLigne()` (lot → `prix_achat_ht_unitaire`, sinon `getDernierPrixAchat()`), `prix_unitaire_ht` devient optionnel dans la validation ; `FactureForm.tsx` auto-remplit `prix_unitaire_ht` depuis `prix_achat_ht` (au lieu de `prix_vente_ht`)
- **Départements réduits à 4** (`DepartementSeeder`) : Cuisine chaude (CUIS-CH), Cuisine froide (CUIS-FR), Laverie (LAV), Pâtisserie (PAT) — supprimés les anciens (Kinshasa Centre/Est/Ouest/Sud, Boulangerie, Cave, Plonge) ; utilisateurs liés réaffectés à "Cuisine chaude" de leur magasin
- Vérifs : `php -l` OK (0 erreur), `route:list` sans devis, migration drop OK, `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK

### Session 6 – Suppression Factures/Paiements, Avoir relocalisé sous Stock
- **Factures/Paiements supprimés** : tables `facture`/`ligne_facture`/`paiement` (migration `2026_08_02_100000_drop_facture_paiement_tables.php` : drop FK+colonne `id_facture` de `mouvement_stock`, FK+colonne `id_facture_origine` de `avoir`, drop des tables), modèles `Facture`/`LigneFacture`/`Paiement`, `FactureController`/`PaiementController`, routes, `FactureList/Form/Details.tsx`, `PaiementList/Form.tsx`, `services/facture.ts`/`services/paiement.ts`, `FacturePDF.tsx`, types `Facture`/`LigneFacture`/`Paiement`/`FactureFormData`/`PaiementFormData`, champ "Facture liée" + colonne dans `SortieStockForm.tsx`, badge "Factures impayées" dashboard, `CodeGenerator::facture()`, entrées AuditMiddleware, permissions `facturation:facture:*`/`facturation:paiement:*` (seeder + base : 7 permissions + 21 liens supprimés)
- **Avoir conservé et relocalisé** sous le menu **Stock** : routes `/stock/avoir`, `stock/avoir/creer`, `stock/avoir/:id` dans `App.tsx`, sous-menu "Avoirs" dans `mockData.ts`, colonne "Retour" (au lieu de "Facture origine") dans `AvoirList`, "Retour lié" requis dans `AvoirForm` (services partenaire/produit/retour au lieu de facture), "Retour lié" dans `AvoirDetails`
- **AvoirController** : `id_retour` devient **requis**, suppression de la règle "facture OU retour", plus de `factureOrigine` ; `Avoir.php` sans `id_facture_origine` ni relation `factureOrigine()` ; `MouvementStock.php` sans `id_facture` ni relation `facture()`
- **MouvementStockController** : `id_facture` retiré des validations, création et chargements ; `DashboardController` : `factures_impayees` et `use Facture` retirés
- Vérifs : `php -l` OK, migration drop exécutée, `route:list` sans facture/paiement/devis, `tsc -b` OK, `oxlint` 0 erreur (38 warnings préexistants), `npm run build` OK

### Session 7 – Refonte Sortie stock en page complète
- **Migration** `2026_08_03_100000_add_destinataire_to_mouvement_stock.php` : ajout de `id_partenaire`, `id_magasin`, `id_departement` (nullable FK, `onDelete set null`) à `mouvement_stock`
- **Modèle `MouvementStock`** : `id_partenaire`/`id_magasin`/`id_departement` ajoutés au fillable + relations `partenaire()`, `magasin()`, `departement()`
- **`MouvementStockController`** : `store()`/`update()` acceptent et enregistrent `id_partenaire`/`id_magasin`/`id_departement` ; `index()`/`show()` chargent ces relations
- **Nouvelle page `SortieForm.tsx`** (`/stock/sortie/creer`, `/stock/sortie/:id/modifier` dans `App.tsx`) : remplace le slide panel. Champ **Type de sortie** et **Référence** retirés (`id_type_mouvement` = premier type sortie auto-sélectionné). Dropdowns **Client** (`partenaires/clients`), **Magasin**, **Département** (cascade via `departements/by-magasin/{id}`, désactivé sans magasin). Table **multi-produits** (lot + quantité, boucle de création d'un `MouvementStock` par ligne), affichage **date de péremption** + dispo + prix unitaire du lot sélectionné, **totaux quantité + prix** dans un récapitulatif. Édition = page pré-remplie pour un mouvement
- **`SortieStockForm.tsx`** (liste) : slide panel supprimé, bouton "Nouvelle sortie" → `/stock/sortie/creer`, icône Modifier → `/stock/sortie/:id/modifier`, colonne **Client** ajoutée
- **`departementService`** : ajout de `getByMagasin()` ; type `MouvementStock` enrichi (`id_partenaire`/`id_magasin`/`id_departement` + relations)
- Vérifs : `php -l` OK, migration exécutée, `route:list` OK, `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK

### Session 8 – ADMIN peut modifier/supprimer ce qui est validé
- **Backend (bypass ADMIN)** : dans `MouvementStockController::update()/destroy()`, `LotController::update()`, `RetourController::update()/destroy()`, `BonCommandeController::update()/destroy()`, les blocages sur `statut_validation !== 'EN ATTENTE'` / `statut === 'VALIDÉ'` / `statut !== 'BROUILLON'` sont contournés si `Auth::user()->hasRole('ADMIN')`
- **Rééquilibrage stock** :
  - `MouvementStockController::update()` si mouvement `VALIDÉ` (modif ADMIN) : annule l'ancien impact + applique le nouveau (même lot → delta ; lot différent → annule/redéduit), en transaction
  - `MouvementStockController::destroy()` si `VALIDÉ` : restaure la quantité (sortie +, entrée −) en transaction
  - `LotController::update()` : `quantite_disponible = max(0, ancien_disponible + (nouvelle_recue − ancienne_recue))` au lieu de l'écrasement direct (préserve les sorties d'un lot validé)
  - `RetourController::destroy()` si `VALIDÉ`/`TRAITÉ` : annule l'impact stock des lignes avant suppression
- **Frontend** : nouveau hook `useIsAdmin()` (`src/hooks/useIsAdmin.ts`, basé sur `user.role.nom === 'ADMIN'`). Icônes Modifier/Supprimer réaffichées pour l'ADMIN sur éléments validés : `SortieStockForm`, `EntreeStockForm`, `StockLotSerie` (Edit/Delete), `RetourStock` (Edit/Delete hors EN ATTENTE), `RetourDetail` (bouton Modifier), `BonCommande` (Modifier/Supprimer hors BROUILLON), `BonCommandeDetails` (bouton Modifier) ; `StockLotSerieForm` : `estVerrouille` désactivé pour l'ADMIN (plus de bannière + submit actif)
- **Confirmation avant Rejeter** : chaque action « Rejeter » passe désormais par un `ConfirmModal` (comme Valider) : `SortieStockForm`, `EntreeStockForm`, `EntrerStock`, `StockLotSerie`, `RetourStock`, `BonCommandeDetails` (état `rejectTarget`/`confirmReject` + `handleConfirmReject`) ; `ValidationBonCommande` l'avait déjà (modal commun valider/rejeter)
- **Validation bon → réception automatique** : dans `BonCommandeDetails`, le bouton « Réceptionner » est supprimé ; après confirmation de validation, redirection automatique vers `/reception/:id` (le formulaire de réception s'affiche). `doAction()` renvoie désormais un booléen de succès pour piloter la navigation
- Vérifs : `php -l` OK (4 contrôleurs), `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK

### Session 9 – Réception partielle : le reste s'ajoute plus tard
- **Problème** : après une réception partielle (`REÇU PARTIELLEMENT`), le bon disparaissait de la liste « Bon de réception » (`ReceptionList` filtrait uniquement `statut: 'ENVOYÉ'`), impossible de revenir ajouter le reste via l'UI (seul un lien direct `/reception/:id` marchait).
- **Correctif** : `ReceptionList.tsx` filtre désormais `statut: 'ENVOYÉ,REÇU PARTIELLEMENT'` (le scope `BonCommande::scopeByStatut` gère déjà les statuts séparés par virgule). Le backend et le formulaire supportaient déjà le cas : `receive()` accepte `REÇU PARTIELLEMENT`, `initReceptionData` pré-remplit `reste = quantite_commandee − quantite_recue` et exclut les lignes déjà complètes.
- **Flux** : recevoir 5/10 → statut `REÇU PARTIELLEMENT` → rouvrir la réception dans la liste → le formulaire pré-remplit le reste (5) → valider → nouveau lot + entrée stock pour le reste.
- **Bouton « Réceptionner » ré-ajouté** dans `BonCommandeDetails` (Actions) pour les statuts `ENVOYÉ` et `REÇU PARTIELLEMENT` → `navigate(/reception/:id)` (il avait été retiré en Session 8 ; on le garde car c'est le point d'entrée pour compléter une réception partielle).
- Vérifs : `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK

### Session 10 – Sous-menu « Mouvement produit » (entrées/sorties par produit)
- **Nouveau sous-menu** dans le menu Stock : « Mouvement produit » (`/stock/mouvement-produit`, permission `config:mouvements:view`)
- **`StockMouvementProduit.tsx`** (liste) : recherche par **nom de produit** + **plage de dates** (date début/fin) + bouton **Détails** par ligne → `/stock/mouvement-produit/:id?date_debut=..&date_fin=..` (les dates sont transmises en query params)
- **`StockMouvementProduitDetails.tsx`** (détail) : infos produit (code, catégorie, unité, fournisseur, stock total), **tableau des entrées/sorties** du produit filtré sur la plage de dates (date, type, lot, magasin, partenaire, quantité +/- colorée, statut), **totaux entrées/sorties**, et **historique des prix** (date, prix achat HT, devise). Plage de dates modifiable sur place (bouton « Appliquer la période »)
- **Backend** : `MouvementStockController::index()` accepte désormais le filtre `produit_id` (via `whereHas('lot', id_produit)`) — réutilise les filtres `date_debut`/`date_fin`/`search` existants
- Routes ajoutées dans `App.tsx` (`/stock/mouvement-produit` et `/stock/mouvement-produit/:id`), titres dans `Header.tsx`
- Vérifs : `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK

### Session 11 – ADMIN corrige une réception déjà faite
- **Besoin** : si on a reçu 5 mais écrit 4, l'ADMIN doit pouvoir corriger la quantité réceptionnée (ex. ré-ouvrir la réception et ajuster).
- **Backend `BonCommandeController::receive()`** : accepte un tableau optionnel `corrections` (`id_ligne_commande` + `nouvelle_quantite_recue` = nouveau TOTAL reçu). Réservé à l'ADMIN (`hasRole('ADMIN')`). Traité **avant** les `receptions` (ajouts). Logique :
  - `delta = nouveau − quantite_recue` : si `delta > 0` → augmente le lot de réception le plus récent (ou crée un lot si aucun) ; si `delta < 0` → retire du stock des lots de réception liés au bon (`mouvement_stock.reference_document = numero_commande`, du plus récent au plus ancien), supprime le mouvement si quantité = 0.
  - Statut `REÇU` accepté uniquement si correction présente + ADMIN.
  - `receptions` devient nullable (peut être vide si correction seule).
- **Helpers** : `creerLotReception()` (lot + mouvement d'entrée, réutilisé par les ajouts) et `lotsDeReception()` (mouvements de réception d'une ligne).
- **Frontend `ReceptionForm.tsx`** : champ **« Qté déjà reçue (correction) »** (ambre) affiché uniquement pour l'ADMIN sur chaque ligne (y compris lignes déjà complètement reçues). `statutNonReceptionnable` assoupli pour l'ADMIN sur un bon `REÇU`. `handleSubmit` envoie `receptions` (ajouts > 0) + `corrections` (changement de la quantité déjà reçue). Récap total masqué si aucun ajout.
- **`BonCommandeDetails.tsx`** : bouton « Corriger la réception » affiché pour l'ADMIN sur un bon `REÇU` (en plus du « Réceptionner » ENVOYÉ/REÇU PARTIELLEMENT).
- **Service** `bon-commande.ts` : type `CorrectionItem` + payload `{ receptions, corrections }`.
- Vérifs : `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK

### Session 12 – Mise à jour stock depuis l'inventaire + renommage sous-menu
- **Sous-menu renommé** : « Ajustement produit » → **« Ajustement inventaire »** (`mockData.ts`), titre page `AjustementProduit.tsx` → « Ajustement inventaire ». (Note : l'utilisateur disait « menu recette », mais le sous-menu est sous **Validation**.)
- **Nouveau bouton « Mise à jour stock »** dans `AjustementProduit.tsx`, à côté de « Générer ajustements » : passe par un `ConfirmModal` (variante warning) puis appelle le nouvel endpoint. Visible uniquement quand une période clôturée est sélectionnée.
- **Backend `InventaireController::mettreAJourStock($periodeId)`** (route `POST config/inventaires/periodes/{periodeId}/mettre-a-jour-stock`, permission `config:inventaire:update`) :
  - Réservé aux périodes `CLOTURE`. **Garde anti-double-application** : refuse si un `MouvementStock` type 3/4 existe déjà avec `id_periode_inventaire = $periodeId`.
  - Recalcule le **disponible actuel** (somme des lots VALIDÉ avec quantité > 0, produit+magasin) et `delta = stock_physique_compte − disponible_actuel` (le stock théorique figé à la saisie peut être obsolète).
  - `delta > 0` (excédent) : crée un **lot d'ajustement** (`CodeGenerator::lot()`, `quantite_recue = quantite_disponible = delta`, `statut_validation = VALIDÉ`) + `MouvementStock` type **3 « Ajustement positif »** validé, `reference_document = INV-{période}-{produit}`, `id_periode_inventaire` renseigné.
  - `delta < 0` (manquant) : **retrait FIFO** des lots (du plus ancien au plus récent), `decrement('quantite_disponible')` par lot + un `MouvementStock` type **4 « Ajustement négatif »** validé par lot retiré.
  - Toute l'opération est en `DB::transaction`, retourne `produits_ajustes` / `total_ajoute` / `total_retire`.
- **Frontend** : type `MiseAJourStockResponse` (`types/validation.ts`), méthode `mettreAJourStock` (`services/inventaire.ts`), état `updating`/`confirmUpdateOpen` + `handleMettreAJourStock` (toast succès/erreur puis `fetchData()`).
- **Bouton masqué après application** : `resume()` renvoie désormais `stock_mis_a_jour` (existence d'un `MouvementStock` type 3/4 lié à la période) ; `AjustementProduit.tsx` masque le bouton « Mise à jour stock » et affiche un badge « Stock déjà mis à jour » (état vérifié au changement de période, à la réussite et si erreur « déjà appliquée »).
- Vérifs : `php -l` OK, `route:list` OK (nouvelle route présente), `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK

### Session 13 – Saisie d'inventaire : insertion multiple de produits
- **Besoin** : dans `SaisieInventaire.tsx` (Validation → Saisie inventaire), pouvoir saisir plusieurs produits en une fois au lieu d'un formulaire mono-produit.
- **Backend `InventaireController::storeMultiple()`** (route `POST config/inventaires/bulk`, permission `config:inventaire:create`) :
  - Accepte `id_periode_inventaire`, `id_magasin` et `lignes[]` (`id_produit` distinct, `stock_physique_compte >= 0`, `commentaire` optionnel).
  - Vérifie la période `EN_COURS`, **ignore les produits déjà saisis** pour la période+magasin (retournés dans `ignores`), calcule `stock_theorique` par ligne, tout en `DB::transaction`.
  - Retourne `cree` / `ignores` / `inventaires` + message avec le nombre d'ignorés.
- **Frontend** : type `InventaireCreateMultipleResponse` (`types/validation.ts`), méthode `createMultiple` (`services/inventaire.ts`), `SaisieInventaire.tsx` converti en **tableau multi-lignes** (produit + stock physique + commentaire + suppression), magasin commun au-dessus, boutons « Ajouter un produit » et « Enregistrer tout ». Édition mono-enregistrement conservée (une seule ligne pré-remplie, champ produit/magasin verrouillés). Validation par ligne : produit requis, produit en doublon refusé, stock ≥ 0.
- Vérifs : `php -l` OK, `route:list` OK (route bulk présente), `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK

### Session 14 – Stock théorique recalculé en direct (cohérence rapport ↔ ajustement)
- **Problème** : incohérence entre « Rapport stock logique/physique » (Qté logique 48, calculée en direct) et « Ajustement inventaire » (Stock théorique 50, **figé à la saisie**) pour un même produit. Si des mouvements surviennent après la saisie, les deux divergent (50/48 vs 48/48).
- **Fix `InventaireController`** : nouveau helper `getStockTheoriqueActuel($idProduit, $idMagasin)` = somme des lots `VALIDÉ` avec `quantite_disponible > 0`. Utilisé partout pour que théorique et écart reflètent le stock réel :
  - `index()` : surcharge `stock_theorique` et `ecart` (physique − théorique live) par ligne de la page paginée.
  - `resume()` : totaux + stats (écarts positifs/négatifs/sans écart) recalculés en direct (plus de `sum('stock_theorique')` / `sum('ecart')`).
  - `genererAjustements()` : filtre et valeurs (produit/écart/théorique/physique) calculés en direct, `total_ecart` recalculé (plus de `getTotalEcart()` basé sur les valeurs stockées).
  - `mettreAJourStock()` : filtre `where('ecart', '!=', 0)` retiré (le delta est déjà recalculé en direct ; message « Aucun écart à appliquer » si `produitsAjustes == 0`).
- **Frontend** : aucun changement nécessaire (`AjustementProduit.tsx` et `SaisieInventaire.tsx` lisent `inv.stock_theorique` / `inv.ecart` directement dans la réponse API).
- Vérifs : `php -l` OK, test rapide `index`/`resume`/`genererAjustements` sur période 8 OK (viande de boeuf 48/48 écart 0, Fromage 43/43 écart 0), scripts temporaires supprimés

### Session 15 – Purge du stock (entrées/sorties) depuis le frontend
- **Besoin** : vider toutes les entrées/sorties et tout ce qui est lié au stock (sauf les produits), opération à refaire périodiquement (ex. tous les 5 ans), accessible depuis le frontend.
- **Backend** : nouveau `PurgeController::purgeStock()` (route `POST config/purge-stock`, permission **`config:purge:stock`**) :
  - Réservé à l'ADMIN (`hasRole('ADMIN')`, 403 sinon) + **confirmation obligatoire** : le body doit contenir `confirmation` = `PURGER` (sinon 422).
  - Suppression en `DB::transaction`, **ordre respectant les FK** : `mouvement_stock`, `ligne_retour`, `ligne_commande`, `avoir`, `retour`, `bon_commande`, `entree_recette`, `inventaire`, `lots`, `periode_inventaire` (via `Model::query()->delete()` = hard delete). Retourne les compteurs `supprime` par table.
  - **Conservé** : produits, catégories, unités, devises, partenaires, magasins, départements, utilisateurs, rôles, permissions, fiches techniques (+ lignes), notifications, audits, **historique des prix**.
  - Migration `2026_08_03_120000_add_purge_stock_permission.php` : crée la permission + lien vers le rôle ADMIN (base + seeders `PermissionSeeder`/`ConfigPermissionSeeder`).
- **Frontend** : page `PurgeStock.tsx` (`/configuration/purge-stock`, sous-menu Configuration), type `PurgeStockResponse` (`types/purge.ts`), service `purgeService.purgeStock` (`services/purge.ts`). UI : deux cartes « Sera supprimé / Sera conservé », champ « Tapez PURGER » qui active le bouton rouge, résultat avec le nombre d'enregistrements supprimés par table.
- Vérifs : `php -l` OK, migration exécutée, `route:list` OK (route présente), test garde-fou 422 OK (confirmation requise, données intactes), `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK

### Session 16 – Fiche technique : coût ingrédient non automatique
- **Bug** : dans « Nouvelle fiche technique » (`/recettes/creation`), sélectionner un ingrédient laissait le coût à 0. Cause : `getDernierPrix()` lisait `res.data.historiquePrix` alors que l'API renvoie la relation en **snake_case `historique_prix`** → jamais trouvé → prix 0.
- **Fix** : utilisation de l'endpoint dédié `produits/{produitId}/dernier-prix` (`HistoriquePrixController::dernierPrix`, qui utilise `getDernierPrixAchat()` — même logique que le backend `FicheTechniqueController`). Ajout de `produitService.getDernierPrix()` (`services/produit.ts`) et lecture de `res.data.dernier_prix_achat.prix` dans `FicheTechniqueForm.tsx`.
- Vérifs : endpoint testé (Carotte 0.80, viande de boeuf 20.00), `tsc -b` OK, `oxlint` 0 erreur (1 warning préexistant toast useEffect)

### Session 17 – Historique des écarts conservé après mise à jour du stock
- **Besoin** : dans « Ajustement inventaire », après avoir cliqué « Mise à jour stock », l'écart passait à 0 (théorique live = physique) et l'historique de l'écart constaté disparaissait. On veut garder la trace de l'écart de saisie.
- **Migration** `2026_08_03_130000_add_ecart_saisie_to_inventaire.php` : colonne `ecart_saisie` (int) figée à la saisie + backfill `stock_physique_compte − stock_theorique` (le `ecart` en base est une colonne virtuelle, non persistable).
- **Backend** : `InventaireController::store()`/`storeMultiple()`/`update()` enregistrent `ecart_saisie = stock_physique_compte − stock_theorique` (du moment). `index()` continue de renvoyer `ecart` live + `ecart_saisie`.
- **Frontend** : type `Inventaire` (`ecart_saisie?`), colonne **« Écart (saisie) »** ajoutée dans `AjustementProduit.tsx` (badge coloré réutilisé). L'écart de saisie reste visible même après la mise à jour du stock.
- Vérifs : migration exécutée, backfill OK, test index période 9 (`stock_mis_a_jour: true` : Carotte écart live 0, écart_saisie −3), `tsc -b` OK, `oxlint` 0 erreur (1 warning préexistant)

### Session 18 – Page « Ajustements » : total écart 0 corrigé (historique conservé)
- **Problème** : le modal « Ajustements - {période} » (page `Ajustement.tsx`, Validation → Ajustements) affichait « Total écart : 0 » et « Aucun ajustement à générer » pour « Inventaire du mois d'aout 2026 » (période 9) après « Mise à jour stock ». Cause : `genererAjustements()` recalculait l'écart **live** (0 après mise à jour) et filtrait les lignes à 0.
- **Fix backend `InventaireController::genererAjustements()`** : l'écart utilisé est désormais `ecart_saisie` (figé à la saisie, comme la colonne « Écart (saisie) »), avec `stock_theorique`/`stock_physique` stockés → l'historique reste visible après mise à jour. (La mise à jour réelle du stock via `mettreAJourStock()` reste basée sur le delta live.)
- **Fix colonne « Total écart » du tableau des périodes** : `PeriodeInventaireController::index()` charge désormais `inventaires.produit` (avant : jamais chargés → `-`) ; `Ajustement.tsx` somme `inv.ecart_saisie ?? inv.ecart`.
- Vérifs : test API période 9 → `total_ecart: -3` (Carotte 89/86), total colonne = −3 ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur, `npm run build` OK

### Session 19 – Export Excel des audits corrigé (404)
- **Problème** : le bouton « Exporter » de la page Audit (`AuditList.tsx` → `GET /api/audits/export`) renvoyait **404**. Deux causes :
  1. **Ordre des routes** (`routes/api.php`) : `Route::get('{id}')` était enregistré **avant** `statistiques`/`export` → Laravel matchait `/audits/export` et `/audits/statistiques` sur `{id}` → `show('export')` → 404 (confirmé par test route : `{id}` capturait les deux). Les stats de la page Audit étaient donc aussi silencieusement cassées (`.catch(() => {})` masquait l'erreur).
  2. **Méthode `export()` inexistante** dans `AuditController` (et `clean()` aussi).
- **Fix routes** : `{id}` déplacé en **dernier** du groupe + contrainte `->where('id', '[0-9]+')` (donne uniquement sur id numérique). `statistiques`/`export`/`table/{table}`/etc. matchent désormais correctement.
- **`AuditController`** : ajout de `export()` → CSV `audits_AAAA-MM-JJ.csv` (BOM UTF-8 + séparateur `;` pour Excel français), colonnes ID/Date/Utilisateur/Action/Table/ID enregistrement/Adresse IP/Route/User-Agent/Anciennes valeurs/Nouvelles valeurs, respecte les filtres (search, table_cible, action, date_debut, date_fin). Nouveau helper privé `buildQuery()` appliqué aussi à `index()` (les filtres du frontend étaient ignorés auparavant).
- Vérifs : test route (export/statistiques/tables/liste → bonnes méthodes, `{id}` numérique) ; test CSV sans filtre 819 lignes, action=INSERT 264, table_cible=produit 22, dates 1-2 août 182 ; permission `audit:export` présente et liée à ADMIN ; `php -l` OK.

### Session 20 – Purge stock : les audits sont supprimés aussi
- **Besoin** : la purge du stock doit également vider le journal d'audit (jusqu'ici conservé).
- **Backend `PurgeController::purgeStock()`** : `Audit::class` ajouté à la liste des tables supprimées (label `audits`), même transaction, compteur renvoyé dans `supprime`.
- **Frontend `PurgeStock.tsx`** : « Audit (journal des activités) » ajouté à la liste « Sera supprimé » ; texte de la carte et du modal de confirmation mis à jour.
- Note : le log d'audit généré par le middleware pour la purge elle-même est lui aussi supprimé → audit vide après purge.
- Vérifs : test dans transaction externe rollback (aucune donnée perdue) → `audits: 819` supprimés, restaurés après rollback ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur.

### Session 21 – Tableau de bord amélioré + graphiques (recharts)
- **`StatCard.tsx` refondu** : carte blanche avec liseré supérieur en dégradé, badge icône en dégradé lumineux (ombre colorée), effet hover (élévation + icône agrandie). Nouveau coloris `cyan`.
- **`Dashboard.tsx` refondu** :
  - Cartes : Produits (blue), En stock (green), Stock bas (orange), À valider (purple), Clients (indigo), Rupture (red) — grille `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`.
  - **Bandeau récapitulatif** (4 items) : Stock total, Valeur du stock (`formatCurrency`), Commandes validées, Péremption ≤ 7 j.
  - **Graphique en barres** « Évolution des commandes » (6 derniers mois, `evolution_commandes`) via recharts — dernière barre en `royal-700`, tooltip stylé.
  - **Graphique en anneau** « Répartition par catégorie » (`repartition_categorie`) via recharts — palette 10 couleurs, legend.
  - **Top produits** (rang 1/2/3 coloré + barre de progression proportionnelle) et **Top clients** (rang, commandes, montant formaté).
  - Alertes enrichies (4 badges), Accès rapide en cartes arrondies, en-têtes de cartes avec pastille icône colorée.
  - Données déjà fournies par `DashboardController` (aucun changement backend).
- Vérifs : test API dashboard → `evolution_commandes` (Août 2026: 2), `repartition_categorie` (Dessert 1, Entrée 6), `top_produits` (Carotte 20), `top_clients` (Air France 2 cmd) ; `tsc -b` OK, `oxlint` 0 erreur, `npm run build` OK.

### Session 22 – Filtre par mois/année sur le tableau de bord
- **Besoin** : pouvoir filtrer le dashboard par mois/année.
- **Backend `DashboardController::index()`** : les params `date_debut`/`date_fin` (déjà acceptés mais ignorés) sont désormais appliqués à `evolution_commandes`, `top_produits`, `top_clients` et `activites_recentes` (`whereBetween` au lieu de `now()->subMonths(6)`). Défaut : 6 derniers mois. Les cartes de stock (produits, stock, alertes) restent l'état actuel.
- **Frontend `Dashboard.tsx`** : barre « Période » dans l'en-tête avec deux Selects (Mois + Année) + bouton reset. `buildParams()` calcule `date_debut`/`date_fin` (mois précis = 1er..dernier jour, année seule = 01-01..12-31, tout = défaut 6 mois). `dashboardService.get(params)` enrichi. Rechargement via `useCallback` + `useEffect`.
- Vérifs : test API (défaut 6 mois = données août, Août 2026 = mêmes données, Janvier 2025 = vide, 2025 = vide) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur, `npm run build` OK.

### Session 23 – Le filtre mois/année affecte TOUT le tableau de bord + défaut mois courant
- **Besoin** : le filtre de mois/année doit impacter tout le dashboard (cartes, bandeau récapitulatif, alertes inclus) et pas seulement les graphiques/classements/activités. Par défaut, on sélectionne le **mois et l'année en cours**.
- **Backend `DashboardController::index()`** :
  - **Stock reconstruit à la fin de la période** via `stockParLotAu($dateFin)` : pour chaque lot VALIDÉ (Eloquent, donc SoftDeletes respecté), `disponible = quantite_disponible + sorties après date_fin − entrées après date_fin` (annulation des mouvements survenus après la période). Les lots créés après `date_fin` sont exclus. Helper `lotsPerimesProches()` : lots à péremption ≤ 7 j (fenêtre depuis aujourd'hui) encore en stock à `date_fin`.
  - Toutes les stats de cartes désormais filtrées par la période : `produits_en_stock`, `produits_rupture`, `stock_total`, `valeur_stock`, `produits_stock_bas` (basés sur le stock à date_fin) ; `commandes_validees`/`commandes_en_attente` (`whereBetween date_commande`), `retours_en_attente` (`whereBetween created_at`), alertes stock bas + péremption.
  - Restent l'état courant (non filtrées, catalogue) : `total_produits`, clients, fournisseurs, `repartition_categorie`.
  - `date_debut`/`date_fin` normalisés (`startOfDay`/`endOfDay`), défaut backend inchangé (6 derniers mois).
- **Frontend `Dashboard.tsx`** : état initial du filtre = **mois + année en cours** (au lieu de `all`/`all`). Bouton reset → revient au mois courant. Libellé « Période : Août 2026 » affiché sous l'en-tête (helper `periodLabel()`). Texte vide du graphique → « Aucune donnée sur la période sélectionnée ».
- **Note données** : dans la base actuelle, la majorité des lots/bons de commande VALIDÉ sont `soft-deleted` (artefacts de test) → le stock réel (246 unités, 3 produits en stock) et les commandes (2) ne concernent que les enregistrements actifs. Juillet 2026 renvoie donc 0 partout (toutes les données juillet sont soft-deleted). Comportement cohérent avec le reste de l'app (Eloquent + SoftDeletes).
- Vérifs : test script (défaut = Août 2026 : stock 246 / 3 en stock / 2 cmd validées ; Juin/Juillet 2026 vides) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK.

### Session 24 – Export audit CSV corrigé (404 : proxy vite sur le mauvais port)
- **Symptôme** : « Exporter » sur la page Audit renvoyait une page d'erreur **IIS 404** (`C:\inetpub\wwwroot\api\audits\export`, handler StaticFile, code 0x80070002) alors que l'endpoint backend fonctionne (`route:list` OK, `AuditController::export()` présent depuis Session 19).
- **Cause** : tout le frontend appelle l'API via `VITE_API_URL=http://localhost:8000` (client `api.ts`), **sauf** le bouton d'export qui utilisait un `fetch('/api/audits/export?...')` **relatif** → passait par le proxy vite `target: http://localhost` (port 80) occupé par **IIS** (et non par le backend PHP artisan serve sur le port 8000) → 404 statique.
- **Fix `AuditList.tsx`** : l'URL d'export utilise désormais la même base que le client API : `const base = import.meta.env.VITE_API_URL ? \`${VITE_API_URL}/api\` : '/api'`.
- **Fix `vite.config.ts`** : proxy `'/api'` → `target: 'http://localhost:8000'` (le backend réel), pour que le fallback relatif `/api` fonctionne aussi sans `VITE_API_URL`.
- **Vérifs** : export testé via HTTP sur le port 8000 (admin, token Bearer) → HTTP 200, `text/csv`, 322 Ko, BOM + `;`, lignes `ID;Date;Utilisateur;Action;Table;...` ; seul `fetch(` brut du frontend corrigé (recherche `fetch(` dans `src` = 1 seul résultat, le bon) ; `tsc -b` OK, `oxlint` 0 erreur (39 warnings préexistants), `npm run build` OK.
- **Note** : les erreurs console « `yearOptions is not defined` / `periodLabel is not defined` » sur le Dashboard étaient transitoires (stale HMR) — le code compile (`tsc -b` OK) ; un simple refresh navigateur les fait disparaître.

### Session 25 – Rapport « Inventaire théorique » affiché comme « Ajustement inventaire »
- **Besoin** : le rapport menu Rapport → Inventaire théorique (`/rapports/inventaire-theorique`) doit afficher les données comme la page « Ajustement inventaire » (Validation → Ajustement inventaire), au lieu de l'ancien « Rapport stock logique/physique » (colonnes prix/valeurs, PDF).
- **`InventaireTheorique.tsx` réécrit** : miroir de `AjustementProduit.tsx` — sélecteur de **période clôturée** (`periodeInventaireService.list` filtré `statut === 'CLOTURE'`), recherche produit, tableau **Produit / Code article / Magasin / Stock théorique / Stock physique / Écart / Écart (saisie) / Commentaire**, badges d'écart colorés (vert `+excédent`, rouge `-manquant`, gris `0`), pagination `DataTablePagination`. Données via `inventaireService.list({ periode_id })`. Pas de boutons d'action (lecture seule).
- **PDF** : bouton « PDF » (RapportTablePDF, paysage) à côté d'Actualiser — colonnes Produit / Code article / Magasin / Stock théorique / Stock physique / Écart / Écart (saisie) / Commentaire, stats totaux (théorique, physique, écart, écart saisie). Le PDF est généré depuis un **fetch complet** (`per_page: '5000'`, applique la recherche) stocké dans `allData` (la table reste paginée) → le PDF contient toutes les lignes.
- **`Header.tsx`** : titre de route `/rapports/inventaire-theorique` → « Inventaire théorique ».
- Vérifs : `tsc -b` OK, `oxlint` 0 erreur (38 warnings préexistants), `npm run build` OK.

### Session 26 – Partenaire « Type client » invalide (SearchableSelect envoyait l'id)
- **Bug** : « Partenaire → Nouveau partenaire → Aérien » échouait avec « The selected type client is invalid. ». Cause : `SearchableSelect` (composant partagé) appelait `onValueChange(String(opt.id))` → sélectionner « Aérien » (id 1) envoyait `type_client='1'`, rejeté par la validation backend `PartenaireController` (`'type_client' => 'nullable|in:aerien,non_aerien,both'`).
- **Fix `SearchableSelect.tsx`** : option `value?: string` ajoutée + helper `getOptionValue(opt)` (`opt.value` si présent, sinon `String(opt.id)`) utilisé pour le rendu (sélection/check) et le clic → rétro-compatible avec tous les usages existants (sélecteurs d'entités).
- **Fix `PartenaireForm.tsx`** : options « Type client » avec les codes → `{ value: 'aerien' }`, `{ value: 'non_aerien' }`, `{ value: 'both' }`.
- Vérifs : `tsc -b` OK, `oxlint` 0 erreur (38 warnings préexistants), `npm run build` OK.

### Session 27 – « 1 portion = 1 passager » dans l'entrée recette
- **Besoin** : l'entrée recette se saisissait en « nombre de passages » (batchs entiers par client). On veut saisir le **nombre de portions (= passagers)** et que le coût soit **proportionnel au nombre de portions** (coût unitaire × portions), pas « toute la recette pour un seul client ».
- **Migration** `2026_08_03_140000_add_nombre_portions_to_entree_recette.php` : colonne `nombre_portions` (int, nullable) dans `entree_recette` + backfill `fiche_technique.rendement × nombre_passages` pour les enregistrements existants.
- **`EntreeRecette` model** : `nombre_portions` ajouté au fillable + cast integer.
- **`EntreeRecetteController::produire()`** : validation `nombre_portions` (required|integer|min:1) à la place de `nombre_passages` ; `nombre_passages = max(1, ceil(portions / rendement))` calculé et stocké (nb de batchs de production) ; **`cout_total = cout_unitaire × nombre_portions`** (proportionnel aux passagers). Réponse enrichie (`nombre_portions`, `nombre_passages`, `cout_total`, `cout_unitaire`).
- **Frontend `EntreeRecette.tsx`** : champ **« Nombre de portions (passagers) »** ; aide « = X passages de Y portion(s) » sous le champ ; résumé (Portions / Passages nécessaires / Coût unitaire par portion / Coût total estimé) ; carte résultat + historique avec colonnes **Portions / Passages / Coût total** (coût = `cout_unitaire × portions`).
- **PDF `EntreeRecettePDF.tsx`** : carte « Portions » + « Passages », ligne info « Nombre de portions », total « Coût total (X portions) » = `cout_unitaire × portions`.
- **Rapport `RapportRecette.tsx` + `RapportEntreeRecettePDF.tsx`** : carte + colonne **Portions (passagers)**, totaux `cout_unitaire × portions` (plus de `cout_total × passages`).
- Vérifs : migration exécutée, backfill OK (id 2 : rendement 10 × 5 passages = 50), test API produire (150 portions / rendement 10 → 15 passages, coût 0.99 × 150 = 148.5, enregistrement de test supprimé ensuite), `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (38 warnings préexistants), `npm run build` OK.

### Session 28 – « Fiche technique » (menu) : fiches recettes en 6 parties + rapport par passagers
- **Besoin** : distinguer « Fiche recette » (recette actuelle) de « Fiche technique » = **menu** composé de fiches recettes en parties (Entrée, Plat, Pain & beurre, Fromage, Dessert, Extra — libres, réutilisables), chaque item ayant un **pourcentage de passagers**. Le rapport se génère en sélectionnant date + compagnie + fiche technique + nombre de passagers → coût total + total de chaque article consommé (poids total, prix unitaire, prix total).
- **Migration** `2026_08_04_100000_create_fiche_technique_menu_tables.php` (exécutée) : `fiche_technique_menu` (code unique auto `FM-YYMM-XXXX`, nom, description, cycle, periodicite, validite, `id_partenaire` prestataire nullable, `id_magasin`, actif), `fiche_technique_menu_partie` (nom, ordre, FK cascade), `fiche_technique_menu_item` (FK partie cascade, `id_fiche_technique` → recette restrict, designation nullable, `pourcentage`, ordre), `entree_fiche_technique` (rapport : menu, compagnie, `nombre_passagers`, `date_rapport`, commentaire, `id_utilisateur`).
- **Modèles** : `FicheTechniqueMenu` (+ relations `parties`, `partenaire`, `magasin`, scope search/byMagasin), `FicheTechniqueMenuPartie` (`items`), `FicheTechniqueMenuItem` (`ficheTechnique`), `EntreeFicheTechnique`.
- **`CodeGenerator::ficheTechniqueMenu()`** (préfixe `FM`).
- **Permissions** : `config:fiche_technique_menu:view/create/update/delete` ajoutées (`PermissionSeeder`) et liées à RESP_STOCK (view+create+update), MAGASINIER (view), CONSULTATION (view) dans `RolePermissionSeeder`.
- **`FicheTechniqueMenuController`** (CRUD complet sous `api/config/fiches-technique-menu`) : `parties[]` imbriquées (items avec `id_fiche_technique`/`designation`/`pourcentage`), transaction, `synchroniserParties()` (supprime/recrée), `toggleActif`.
- **`EntreeFicheTechniqueController`** (`api/config/entree-fiche-technique`) : `index`, `apercu` (calcul sans enregistrement, POST, avant `generer`), `generer` (valide + enregistre + calcule), `show` (recalcul en direct), `destroy`. Logique de calcul : par item, `coutParPassager = recette.cout_unitaire × pourcentage/100`, `coutItem = × passagers` ; par ligne recette, `quantiteParPortion = poids_net / max(rendement,1)`, `quantiteTotale = × passagers × pct`, coût = qté × prix_unitaire ; **récapitulatif articles** agrégé par produit (quantité + coût, prix unitaire pondéré), tri par coût décroissant.
- **Frontend** :
  - Types `types/fiche-technique-menu.ts` (menu, parties, items, rapport complet), services `services/fiche-technique-menu.ts` + `services/entree-fiche-technique.ts` (avec `apercu`).
  - Pages : `FicheTechniqueMenuList` (`/recettes/fiche-technique`, recherche, toggle, parties count), `FicheTechniqueMenuForm` (en-tête cycle/périodicité/validité/prestataire/magasin + **parties dynamiques** avec items = fiches recette via SearchableSelect, badge somme des pourcentages vert/ambre si ≠ 100 %, suggestions Entrée/Plat/Pain et beurre/Fromage/Dessert/Extra), `FicheTechniqueMenuDetails` (vue lecture + bouton « Générer un rapport »), `RapportFicheTechnique` (`/recettes/rapport-ft` : date + compagnie (clients) + fiche technique + passagers → **Aperçu** → **PDF** → **Valider le rapport** + historique paginé avec suppression), `RapportFicheTechniqueDetails` (`/recettes/rapport-ft/:id` : rapport recalculé + bouton PDF).
  - `RapportFicheTechniqueView` (composant partagé : en-tête Code/Cycle/Périodicité/Validité/Prestataire/Compagnie/Date/Magasin/Passagers, tableau par partie avec composants Qté/portion · Qté totale · PU · Coût, récapitulatif articles + TOTAL, cartes Passagers / Coût par passager / Coût total) et `FicheTechniqueRapportPDF` (paysage, modèle FONDEG).
- **Renommages interface** : menu Recettes → **« Fiche recette »** (`/recettes/creation`, pages/Header retitrés « fiche recette »), **« Fiche technique »** (menu CRUD) et **« Rapport fiche technique »** ; « Entrée Recette » (`/recettes/entree`) et « Rapport Recette » conservés mais retirés du menu. Routes App.tsx + titres Header ajoutés.
- Vérifs : migration exécutée, seeder (103 permissions), `route:list` OK (6 routes menu + 4 routes rapport), test API complet (menu 2 parties 60/40 % + dessert 100 % → 200 passagers : Plat 60 % 748.8, 40 % 499.2, Tiramisu 14, total 1262 = 6.31/pass. ; show recalculé OK ; suppressions OK), `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (41 warnings : 38 préexistants + 3 du même pattern `toast` non inclus dans les deps), `npm run build` OK.

### Session 28b – Fiche technique : le client est une compagnie, pas un prestataire
- **Besoin (retour utilisateur)** : la fiche technique doit sélectionner les **clients** (compagnies), pas les partenaires/prestataires. Chaque item de partie est lié à une **fiche recette** et affiche le nom de la recette (pas de « désignation » libre).
- **Frontend `FicheTechniqueMenuForm.tsx`** : libellé « Client * » au lieu de « Partenaire / Prestataire », options via `partenaireService.getClients({ per_page: '500' })` (compagnies `aerien`) ; champ `designation` supprimé → nom affiché = nom de la fiche recette (recherche par nom de recette) ; en-tête table des items « Fiche recette * » ; validation : client requis avant envoi.
- **Backend `FicheTechniqueMenuController`** : `id_partenaire` devient **requis** (store) / `sometimes|required` (update).
- **Labels partout** : « Prestataire » → « Client » (liste, détails, `RapportFicheTechniqueView`, `FicheTechniqueRapportPDF`).
- **`RapportFicheTechnique.tsx`** : quand une fiche technique est sélectionnée et la compagnie vide, la compagnie est **pré-remplie** avec le client de la fiche (sinon sélection libre indépendante).
- Vérifs : `php -l` OK (contrôleur), `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK.

### Session 28c – Terminologie « Fiche recette » vs « Fiche technique » + suppression des fiches recette
- **Besoin (retour utilisateur)** : « Fiche technique » désigne uniquement le **menu** (avec client, parties, etc.). La fiche de recette s'appelle **« Fiche recette »** partout. Sur la page Entrée Recette et dans les PDF, le libellé « Fiche technique » désignait la recette → corrigé.
- **Renommages (recette)** : `FicheTechniquePDF.tsx` titre → « Fiche de recette » ; `RapportRecettePDF.tsx` sous-titre « X fiche(s) de recette » + « Détail des fiches de recette » ; `EntreeRecettePDF.tsx` « Fiche technique: » → « Fiche recette: » ; `EntreeRecette.tsx` libellé + vide « Sélectionnez une fiche recette ». Backend `FicheTechniqueController` : tous les messages « Fiche technique » → « Fiche recette » (créée/récupérée/non trouvée/mise à jour/supprimée/dupliquée + blocage « déjà utilisée dans une production (Entrée recette) »).
- **Suppression des fiches recette** : vérifié fonctionnel via HTTP (token admin, `DELETE /api/config/fiches-technique/{id}` → 200 « Fiche recette supprimée avec succès », soft delete via SoftDeletes ; les fiches utilisées dans `entree_recette` se suppriment quand même, le blocage 23000 n'est plus atteint en pratique). Frontend `FicheTechniqueList.tsx` : le message d'erreur réel du backend est maintenant affiché (au lieu du toast générique « Erreur lors de la suppression »).
- **Sécurité menu** : `EntreeFicheTechniqueController::calculerRapport()` ignore déjà les items dont la recette est supprimée (`if (!$recette) continue;`) → pas de crash si une recette liée à un menu est soft-deleted.
- Vérifs : test HTTP delete OK (fiche 22 supprimée puis restaurée) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK.

### Session 28d – Une fiche recette crée automatiquement un produit fini avec prix unitaire
- **Besoin (retour utilisateur)** : « un nouveau recette sera considéré comme produit avec le prix unitaire » — chaque fiche recette doit créer un **produit fini** (liste Produits) avec son **prix unitaire**, pour pouvoir être stocké/utilisé ensuite.
- **Backend `FicheTechniqueController`** :
  - `store()` : après `updateCouts()`, appel à `creerProduitFini($fiche)` → crée un `Produit` (`code_article` = `CodeGenerator::produit()`, nom = nom de la recette, description « Produit fini de la fiche recette {code} », `id_unite` = pièce `pc` — 1 portion = 1 pièce) + un `HistoriquePrix` (`prix_achat_ht` = `cout_unitaire`, devise par défaut). Puis `id_produit_fini` de la recette lié au produit.
  - `update()` : `synchroniserProduitFini()` met à jour le nom/description du produit et ajoute une entrée `HistoriquePrix` si le coût unitaire a changé (dérive de `> 0.001`). Si la recette n'a pas encore de produit (créée avant), il est créé.
  - `index()`/`show()` chargent désormais la relation `produitFini`.
  - Helpers privés : `resolveUniteProduitFini()` (unité `pc`), `creerProduitFini()`, `synchroniserProduitFini()`.
- **Frontend** : `FicheTechniqueDetails.tsx` → item « Produit fini (créé automatiquement) » cliquable vers `/produits/{id}` ; `FicheTechniqueList.tsx` → colonne **« Produit fini »** (code article, lien) ; `FicheTechniqueForm.tsx` → note dans la carte Coûts « À l'enregistrement, la recette crée automatiquement un produit fini dans le stock, avec un prix unitaire égal au coût unitaire ».
- Vérifs : test HTTP create (fiche 24 → produit fini PROD-2608-0008, prix 45.00, unité pc), update (nom + coût 36.00 → nouvelle entrée HistoriquePrix), nettoyage des données de test ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK.

### Session 28e – Liste Produits : onglets « Produits » / « Recettes »
- **Besoin** : dans la liste des produits, distinguer les produits finis (issus d'une fiche recette) des produits ordinaires, comme la liste Partenaire avec ses onglets.
- **Backend `ProduitController::index()`** : paramètre `type` (`produit` | `recette`) filtré via `whereRaw('EXISTS (SELECT 1 FROM fiche_technique WHERE fiche_technique.id_produit_fini = produits.id)')` / `NOT EXISTS` (classifie par le lien `id_produit_fini`, stable même si la fiche est soft-deleted). Chaque produit renvoie désormais `est_recette` (booléen, sous-requête `COUNT(*) > 0` via `addSelect`) — cast en bool après pagination.
- **Frontend** : type `Produit.est_recette?` ; `Produits.tsx` → onglets **Tous / Produits / Recettes** (même style que Partenaires), reset de la page à chaque changement, paramètre `type` envoyé, bouton Actualiser remet l'onglet sur Tous ; badge orange **« Recette »** (ChefHat) à côté du nom des produits finis.
- Vérifs : script test (13 produits actifs : 2 recettes #12 Fromage, #13 Sardine, 11 simples, cohérence `est_recette` 100 %) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK.

### Session 29 – Fiche technique (menu) : items = fiche recette OU produit + PDF composition
- **Besoin** : dans « Nouvelle fiche technique », le dropdown « Fiche recette * » (renommé **« Recette ou produit * »**) doit permettre de sélectionner un **produit** ou une **fiche recette**. Dans le PDF du rapport, en haut, afficher la **composition du menu** (tout ce qui a été sélectionné via les dropdowns) ; le bas (détail par item) reste tel quel.
- **Migration** `2026_08_04_150000_add_id_produit_to_fiche_technique_menu_item.php` : `id_fiche_technique` rendu nullable (SQL brut, doctrine/dbal absent) + colonne `id_produit` nullable FK `produits` (`nullOnDelete`) + index.
- **Modèle `FicheTechniqueMenuItem`** : `id_produit` ajouté au fillable + relation `produit()`.
- **`FicheTechniqueMenuController`** : validation `id_fiche_technique`/`id_produit` devient `nullable|exists` avec **contrôle custom** « chaque item doit référencer une recette OU un produit » (store + update) ; `synchroniserParties()` écrit `id_fiche_technique ?? null` / `id_produit ?? null` ; chargements incluent `parties.items.produit.unite` ; `show()` attache `produit->prix_unitaire` (dernier prix d'achat) pour l'affichage.
- **`EntreeFicheTechniqueController`** : `chargerMenu()` + `parties.items.produit.unite` ; `calculerRapport()` gère les items produit (prix = `getDernierPrixAchat()`, quantité totale = passagers × pct, agregé au récapitulatif, `type: 'produit'` vs `'recette'`) ; `agregerArticle()` robuste si unité nulle.
- **Frontend** : types (`FicheTechniqueMenuItemData.id_produit/produit`, `FicheTechniqueMenuFormData` items `id_fiche_technique`/`id_produit` nullable, `RapportItem.type`) ; `FicheTechniqueMenuForm.tsx` : ItemRow `selection` (`recette:X` / `produit:X`, dropdown unique mélangé via `Option.value`), charge `produitService.list` ; `FicheTechniqueMenuDetails.tsx` : affiche produit (prix, badge orange « Produit ») ; **PDF `FicheTechniqueRapportPDF.tsx`** : section « Composition du menu » en haut (Partie / Désignation / Code / Type / % passagers), le détail par item reste en dessous.
- Vérifs : migration exécutée, test script (menu avec recette + produit, prix OK, nettoyé), `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK.

### Session 30 – Revert produit fini automatique + « Nom de la partie » par ligne (items plats)
- **Besoin (retour utilisateur)** : (1) une fiche recette ne doit plus créer automatiquement de produit fini ; (2) dans la fiche technique (menu), le « Nom de la partie » doit être une colonne du tableau des items (chaque ligne porte son propre en-tête, ex. « DESSERT » pour le produit Pomme), à côté de « Recette ou produit » et « Pourcentage ».
- **Revert produit fini (28d/28e)** : `FicheTechniqueController` — imports Unite/Devise/HistoriquePrix/Auth retirés, `produitFini` retiré des chargements, plus d'appels à `creerProduitFini()`/`synchroniserProduitFini()`, helpers `resolveUniteProduitFini`/`creerProduitFini`/`synchroniserProduitFini` supprimés ; `ProduitController::index()` simple (plus de `type`/`est_recette`/`use DB`) ; frontend : onglets Produits/Recettes retirés (`Produits.tsx`), colonne « Produit fini » retirée (`FicheTechniqueList.tsx`, `RapportRecettePDF.tsx`), bloc produit fini retiré (`FicheTechniqueDetails.tsx`), note retirée (`FicheTechniqueForm.tsx`), types nettoyés (`produit.ts` `est_recette`, `fiche-technique.ts` `id_produit_fini`/`produitFini`). Colonne DB `id_produit_fini` de `fiche_technique` conservée mais non utilisée.
- **Restauration « recette OU produit » (Session 29)** : migration `2026_08_04_150000` réactivée (une migration inverse temporaire avait été créée, puis rollbackée et supprimée), modèle `FicheTechniqueMenuItem` (`id_produit` + `produit()`), `FicheTechniqueMenuController`, `EntreeFicheTechniqueController::calculerRapport` (bloc produit), types frontend, `FicheTechniqueMenuDetails.tsx`, PDF avec colonne Type. L'item doublon de test (id 13, Carotte sous menu 7) supprimé lors du rollback.
- **Items plats avec « Nom de la partie »** :
  - Backend `FicheTechniqueMenuController` : validation accepte `parties` (imbriquées) **ou** `items` plats (`items.*.nom_partie` required, `id_fiche_technique`/`id_produit` nullable, `pourcentage` required). Nouveau helper privé `grouperParties(array $items)` : groupe les items par `nom_partie` (ordre conservé, `Autres` si vide) → tableau de parties `['nom' => ..., 'items' => [...]]` ; appelé dans `store()` ET `update()` si `$request->has('items')`. Contrôle custom « recette OU produit » par item conservé. `update()` recrée les parties/items si `parties` OU `items` présent (corrigé : avant, `items` ne déclenchait pas la resynchronisation).
  - Frontend `FicheTechniqueMenuForm.tsx` réécrit : tableau d'items **plats** avec colonnes « Nom de la partie * | Recette ou produit * | Pourcentage (%) | (suppr) », `<datalist>` de suggestions (Entrée, Plat, Pain et beurre, Fromage, Dessert, Extra), dropdown combiné recette/produit (`Option.value` `recette:X`/`produit:X`, sous-titre « Recette · Coût unit. X » / « Produit »), badge total des pourcentages (vert si 100 %, ambre sinon). Édition : parties aplaties en lignes (nom répété par item). Payload = `items: [{nom_partie, id_fiche_technique, id_produit, pourcentage}]`.
  - Types `fiche-technique-menu.ts` : `FicheTechniqueMenuFormData` passe en structure plate (`items` avec `nom_partie`).
- Vérifs : `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK, test API complet (store plat → 2 parties ENTREE/DESSERT ; update avec 3 items → DESSERT regroupé avec 2 items 60/40 % ; aperçu 200 passagers → recette + produit OK, Pomme 120 × 3 = 360 ; item sans recette/produit → 422 ; cleanup OK).

### Session 31 � Correction fiche technique (menu) : �dition et affichage recette
- **Bug page D�tails (recette non affich�e)** : FicheTechniqueMenuDetails.tsx lisait i.ficheTechnique (camelCase) alors que l'API s�rialise la relation en **iche_technique** (snake_case) ? nom/code/co�t de la recette manquants (le produit, lui, s'affichait). Fix : type FicheTechniqueMenuItemData.ficheTechnique ? iche_technique et les 4 lectures du composant align�es.
- **Bug page Modifier (rien ne s'affiche)** : route ecettes/fiche-technique/:id/modifier dans App.tsx avec modifier en **segment statique** ? useParams() ne renvoyait que { id }, ction = undefined, donc isEdit = action === 'modifier' = alse ? formulaire � nouveau � vide. Fix : route chang�e en ecettes/fiche-technique/:id/:action (comme ecettes/creation/:id/:action), modifier devient un param dynamique captur�.
- V�rifs : backend GET/PUT v�rifi�s OK sur toute la pile HTTP (token admin, menu 10 FM-2608-0009 ? 200), 	sc -b OK, oxlint 0 erreur (41 warnings pr�existants), 
pm run build OK, scripts de diagnostic temporaires supprim�s.

### Session 32 – Statut bon de commande : « Annulé » remplacé par « Clôturé »
- **Besoin** : le statut `ANNULE` d'un bon de commande ne doit plus exister ; le rejet/clôture d'un bon passe par le statut **`CLOTURE`** (« Clôturé ») partout (listes, filtres, badges, PDF, détails, réceptions, rapports).
- **Migration** `2026_08_06_130317_rename_bon_commande_annule_to_cloture.php` : `ALTER TABLE bon_commande MODIFY statut ENUM('BROUILLON','ENVOYÉ','REÇU PARTIELLEMENT','REÇU','CLOTURE')` (SQL brut, sans dbal) + `UPDATE bon_commande SET statut='CLOTURE' WHERE statut='ANNULE'`. down() rétablit l'ancien enum + reconvertit `CLOTURE`→`ANNULE`. Exécutée : colonne `enum(...,'CLOTURE')`, 0 `ANNULE`, 4 `CLOTURE`.
- **Backend `BonCommandeController`** : `rejectBon()` écrit `statut => 'CLOTURE'` (au lieu d'`ANNULE`) ; méthode `annuler()` → renommée `cloturer()` (route PATCH `{id}/cloturer`, remplace `{id}/annuler`), garde `ENVOYÉ`/`REÇU PARTIELLEMENT`. **`RapportController`** : les 2 filtres `statut != 'ANNULE'` (bons commandés/réceptionnés) → `!= 'CLOTURE'`. `getStatutLibelle()` : `ANNULE` → `CLOTURE`.
- **Frontend** : type `statut` `'ANNULE'` → `'CLOTURE'` (`types/bon-commande.ts`) ; service `cancel()` → `cloturer()` (`PATCH {id}/cloturer`) ; `BonCommandeDetails` (badge « Clôturé », bouton « Clôturer », modal « Clôturer le bon »), `BonCommande.tsx` (badge + filtre « Clôturé »), `BonCommandePDF.tsx` (couleur `#ef4444` + libellé « Clôturé »), `ValidationBonCommande.tsx` + `ReceptionList.tsx` (badge « Clôturé »). `periode_inventaire` conserve son `ANNULE` (autre feature).
- Vérifs : `php -l` OK (contrôleur + rapport + modèle + migration), migration exécutée (colonne enum CLOTURE, data 4 CLOTURE / 0 ANNULE), `route:list` OK (`cloturer` présente, plus d'`annuler`), `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK.

### Session 33 – Dashboard : Top fournisseurs + Variations de prix, retrait Top clients
- **Besoin (retour utilisateur)** : (1) afficher un « Top 5 fournisseurs » = les fournisseurs ayant le plus de **bons de commande** (≈ produits les plus consommés) ; (2) dans les Alertes, le **top 5 des produits ayant subi une hausse ou une baisse de prix** ; (3) retirer le « Top clients ».
- **Backend `DashboardController`** :
  - `top_clients` supprimé → `top_fournisseurs` : `Partenaire` (`type` in `fournisseur`/`both`) leftJoin `bon_commande` (`statut='REÇU'`, `date_commande` dans la période), groupé par partenaire, tri par `COUNT(bon_commande.id)` desc puis montant, limit 5.
  - `alertes.variations_prix` : depuis `historique_prix` (jointure `produits` actifs, `deleted_at` null, `date_application <= dateFin`), chaque produit groupé, comparaison des **deux dernières entrées** (id/date desc) → `variation = nouveau − ancien` ; produits à variation non nulle, triés par `|variation|` desc, limit 5. Chaque item : `nom`, `ancien_prix`, `nouveau_prix`, `variation`, `pourcentage`, `type` (`hausse`/`baisse`), `date`.
- **Frontend** : types `TopFournisseur`/`VariationPrix` + `DashboardData` mis à jour (`top_fournisseurs`, `alertes.variations_prix`, plus de `top_clients`/`TopClient`). `Dashboard.tsx` : carte **« Top fournisseurs »** (rang, nom, X bons de commande, montant `formatCurrency`) à la place de « Top clients » ; sous-bloc **« Variations de prix »** dans la carte Alertes (icône TrendingUp, badge rangé hausse/baisse avec flèche `ArrowUpRight`/`ArrowDownRight`, `ancien → nouveau`, `+X%`/`−X%`, vide si aucune variation).
- Vérifs : test API (top_fournisseurs : FraisVol SARL 11 cmd / Congo Futur 2 cmd ; variations_prix : Pomme 3 → 2.8 baisse −6.7 % ; `top_clients` absent) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (41 warnings préexistants), `npm run build` OK, build synchro vers `Fondeg/`.

### Session 34 – « Retours en attente » du dashboard : le clic affichait tous les retours
- **Symptôme (retour utilisateur)** : dans le tableau de bord, cliquer sur l'alerte « Retours en attente » affichait un enregistrement, alors que tous les retours sont déjà validés/traités.
- **Diagnostic** : le compteur était correct (backend renvoie `retours_en_attente = 0`, vérifié en local ET sur le site en ligne `concept-innovation.org/archives/api/dashboard` et `/dashboard/mini` ; cloche `unread-count` = 0 ; base `notifications` sans `retour_en_attente` non lue ; retours `EN ATTENTE` tous soft-deleted). Le problème était **le lien** : le clic naviguait vers `/stock/retour` qui affiche **tous** les retours (dont VALIDÉ/TRAITÉ) → l'utilisateur voyait « un enregistrement » qui n'était pas en attente.
- **Fix `Dashboard.tsx`** : `onClick` de l'alerte « Retours en attente » → `/stock/retour?statut=EN%20ATTENTE`.
- **Fix `RetourStock.tsx`** : lecture de `useSearchParams` (pattern identique à `StockLotSerie`/péremption). Si `statut=EN ATTENTE` → paramètre `statut` envoyé au service (`RetourController::index()` gère déjà `statut` via `byStatut`). Bannière ambre « Retours en attente de validation » + lien « Afficher tous les retours » (reset `setSearchParams({})`), titre page/carte adaptés (« Retours en attente » + « X retour(s) en attente »), bouton Actualiser réinitialise aussi les query params.
- Vérifs : `tsc -b` OK, `oxlint` 0 erreur (0 warning sur les 2 fichiers), `npm run build` OK, synchro `dist/*` → `Fondeg/` (anciens bundles `index-CBuT3wHx.js`/`index-hM2zF41U.css` nettoyés, seul `index--n04Zrma.js` + `index-BgPZ5W_1.css` restent).

### Session 35 – Entrées stock de réception auto-validées (plus de Valider/Rejeter)
- **Besoin (retour utilisateur)** : dans la page « Entrée stock », les boutons **Valider/Rejeter** ne doivent plus exister pour les entrées issues d'une réception de bon de commande déjà validé puis reçu.
- **Backend `BonCommandeController::creerLotReception()`** : le lot ET le mouvement d'entrée (type 1 « Entrée réception », référence = numéro du bon) sont désormais créés directement en `statut_validation = 'VALIDÉ'` avec `valide_par`/`date_validation` renseignés (au lieu d'`EN ATTENTE`). La réception d'un bon déjà validé/reçu ne requiert donc plus une validation séparée dans « Entrée stock ».
- **Frontend** : aucun changement nécessaire — `EntreeStockForm.tsx` n'affiche Valider/Rejeter que pour `statut_validation === 'EN ATTENTE'` (ligne 236) ; les entrées de réception n'y sont plus éligibles.
- **Nettoyage données** : mvt 120 (BC-2608-0008, lot 53) encore `EN ATTENTE` après une réception faite avant le correctif → auto-validé (`valide_par=1`) pour cohérence (bon REÇU/VALIDÉ, lot déjà VALIDÉ). Aucune autre entrée de réception `EN ATTENTE` restante (vérifié : 0).
- Vérifs : test API complet (bon 27 REÇU PARTIELLEMENT → réception du reste 5/5 → lot `TEST-AUTO-VALID` + mvt 123 créés en `VALIDÉ` avec `valide_par` ; données de test supprimées et bon/statuts restaurés), `php -l` OK.

### Session 36 – Sortie produit : prix moyen pondéré affiché
- **Besoin (retour utilisateur)** : dans la page « Sortie stock » (`SortieForm.tsx`), sélectionner un produit + quantité doit afficher le **prix moyen pondéré** du produit, pas le prix du lot. Formule : `Σ(prix_unitaire_lot × quantite_disponible)` / `Σ quantite_disponible` (équivalent au regroupement par quantités ayant le même prix). Ex. 10 kg à 3 $ + 5 kg à 4 $ → (30+20)/(10+5) = 3,33 $/kg.
- **Frontend `SortieForm.tsx`** : `useMemo` `prixPondereParProduit` (Map par `id_produit`) + helper `prixPondere()`. Colonne « Prix unit. » → **« Prix moy. pond. »**, info sous le lot « Prix moy. pond. », montant ligne et total récapitulatif utilisent ce prix pondéré. Import `useMemo` ajouté.
- **Backend inchangé** : la sortie reste liée au lot choisi ; le prix n'est pas figé dans `mouvement_stock` (la valorisation en rapports reste celle du lot). Le prix pondéré est un affichage calculé côté frontend sur les lots chargés (`quantite_disponible > 0`).
- Vérifs : `tsc -b` OK, `oxlint` 0 erreur (0 warning), `npm run build` OK, synchro vers `Fondeg/`.

### Session 37 – Réception : date de réception + référence bon (générable)
- **Besoin (retour utilisateur)** : sur la page Réception (`/reception/:id`), ajouter un champ **Date de réception** et un champ **Référence bon** (pré-rempli avec le n° du bon, éditable ou générable via bouton).
- **Backend `BonCommandeController::receive()`** : validation de `date_reception` (nullable|date) et `reference_document` (nullable|string|max:100). `creerLotReception()` accepte `$dateReception`/`$referenceDocument` (défauts : now / `numero_commande`) → renseigne `lots.date_reception` + `mouvement_stock.date_mouvement` et `reference_document`.
- **Frontend `ReceptionForm.tsx`** : états `dateReception` (défaut aujourd'hui) + `referenceDocument` (initialisé au `numero_commande` du bon via `initReceptionData`). Carte en-tête : bloc « Date de réception * » (Input date) + « Référence bon » (Input + bouton Générer `RefreshCw` → `generateReference()` format `REC-YYMM-XXXX`). Payload `receive()` enrichi (`date_reception`/`reference_document`).
- **Service `bon-commande.ts`** : type `receive()` accepte `date_reception?`/`reference_document?`.
- **Refactor par ligne (retour utilisateur)** : « Date de réception » + « Référence bon » déplacés de l'en-tête global vers **chaque carte ligne produit**. Backend : validations `receptions.*.date_reception` / `receptions.*.reference_document` (niveau ligne), `creerLotReception()` appelé avec `$reception['date_reception']`/`$reception['reference_document']` ; l'appel de correction (delta) reste sans paramètres. Frontend `ReceptionForm.tsx` : états globaux supprimés, `receptionData` contient `date_reception` (défaut aujourd'hui) + `reference_document` (défaut `numero_commande`), init et champs par ligne (input date + bouton Générer `RefreshCw` → `generateReference()`), `handleSubmit` envoie les deux champs dans chaque objet `receptions`. Service : `ReceptionItem` étendu (`date_reception?`/`reference_document?`), signature `receive()` sans champs racine.
- Vérifs : test API (bon 27 ligne 41 → lot 56 `TEST-PER-LIGNE` + mvt 125 `REC-LIGNE-0001`, `date_reception`/`date_mouvement=2026-08-08`, auto-VALIDÉ ; données de test supprimées et bon/ligne restaurés), `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (1 warning préexistant toast), `npm run build` OK, synchro vers `Fondeg/`.

### Session 38 – Prix de réception enregistré dans l'historique des prix
- **Bug (retour utilisateur)** : en réception, un prix saisi (ex. Poulet 1.00 $) apparaissait sur le lot mais pas dans l'historique des prix du produit → la fiche produit affichait toujours l'ancien prix. Cause : `creerLotReception()` n'écrivait jamais dans `historique_prix`.
- **`Lot::enregistrerHistoriquePrix(?commentaire)`** (nouvelle méthode modèle) : crée une entrée `HistoriquePrix` (produit, prix, devise, `date_application` = `date_reception` du lot, user courant via `auth()->id()`) si le lot a prix + devise. Réutilisée partout.
- **`BonCommandeController::creerLotReception()`** : appelle désormais `$lot->enregistrerHistoriquePrix('Réception du bon de commande #...')` après création du lot + mouvement.
- **`LotController::store()`** : enregistre l'historique à la création d'un lot avec prix (`enregistrerHistoriquePrix('Réception de lot')`).
- **`LotController::update()`** : si le prix OU la devise change (`!=` sur float), `refresh()` + `enregistrerHistoriquePrix('Modification du lot ...')`.
- **Backfill** : script tinker sur les lots existants avec prix+devise → une entrée historique par (produit, prix, devise) manquante, commentaire « Backfill lot {numero} », date = date de réception. 24 créées, puis **22 supprimées** car provenant de lots soft-deleted (artefacts de test) → 2 conservées (Film alimentaire 5.00 = lot 52, produit 29 = 2.00).
- **Exemple validé** : « Film alimentaire » (produit 26) → historique = 5.00 (lot LOT-2608-2062, réception BC-2608-0008) + 0.50 (prix initial produit). La sortie stock affiche le prix moyen pondéré des lots (5.00), la fiche produit le dernier prix historique — cohérents maintenant.
- **Dashboard** : `variations_prix` recalculé correctement (Poulet 3.5→1 −71.4 %, Pomme 3.1→2 −35.5 %, Film alimentaire 0.5→5 +900 %).
- Vérifs : test helper en transaction rollback OK (rollback remet le compte), test API réception (lot 58 + mvt 127 + historique 45 auto-créés puis nettoyés, bon 27 restauré REÇU PARTIELLEMENT / ligne 41 = 57), `php -l` OK (Lot, LotController, BonCommandeController), `tsc -b` OK, `npm run build` OK.

### Session 39 – Pas de doublon dans l'historique des prix (prix identique)
- **Besoin (retour utilisateur)** : sur `/bon-commande/32` (BC-2608-0009), si le dernier prix en historique et le « Prix unit. HT » saisi sont **identiques**, aucune nouvelle entrée ne doit être insérée dans `historique_prix`.
- **`Lot::enregistrerHistoriquePrix()`** : ajout d'une **garde anti-doublon** — si le dernier prix en historique (même produit, même prix ET même devise) est identique, retourne `null` sans créer d'entrée. Comparaison sur `(float)` pour éviter les faux positifs. Le prix initial en historique est conservé ; une variation réelle (prix différent) continue d'être enregistrée.
- **Nettoyage données** : suppression des 2 doublons créés par la Session 38 (réception réelle de BC-2608-0009) : produit 23 id 71 (15.00 = doublon de id 34) et produit 25 id 72 (1.60 = doublon de id 36). Garde la première entrée par (produit, prix, devise).
- Vérifs : test helper en rollback (prix identique → NON CRÉÉ ; prix différent → créé), test API réception à 8.00 (dernier = 8.00) sur bon 32 → réception OK **sans** nouvel historique (vérifié, puis lot/mvt/bon restaurés), `php -l` OK, `tsc -b` OK, `npm run build` OK.

### Session 40 – Réception partielle : lots « BROUILLON » à valider dans Entrée stock
- **Besoin (retour utilisateur)** : dans une réception partielle, quand on réceptionne la partie manquante, ça doit être **validé dans la page « Entrée stock »** ; dans la liste des lots, le lot doit afficher **« Brouillon »** et changer de statut quand il est validé dans Entrée stock. Choix de portée (réponse à question) : **« Toutes les réceptions partielles »** — dès qu'une réception laisse le bon en `REÇU PARTIELLEMENT`, les lots créés sont BROUILLON (1ère réception comprise).
- **Migration** `2026_08_08_120000_add_brouillon_to_lots_statut.php` : ajout de `BROUILLON` à l'enum `lots.statut_validation` (SQL brut, sans dbal). Exécutée.
- **Backend `BonCommandeController`** :
  - `receive()` : calcule en amont `$restePartiel` en **simulant** les quantités après corrections + réceptions (`quantitesApres[ligne] < quantite_commandee` sur une ligne → le bon reste partiel).
  - `creerLotReception(..., bool $brouillon = false)` : si `$brouillon` → lot créé en `statut_validation = 'BROUILLON'` (sans `valide_par`/`date_validation`) + mouvement d'entrée en `EN ATTENTE` (sans `valide_par`/`date_validation`). Sinon comportement Session 35 (auto-VALIDÉ). L'historique prix n'est **pas** enregistré pour un brouillon (fait à la validation).
- **Backend `MouvementStockController`** :
  - `validateMouvement()` : après validation du mouvement, si le lot lié est `BROUILLON` → lot passé à `VALIDÉ` (+ `valide_par`/`date_validation`) et `enregistrerHistoriquePrix('Validation en entrée stock du lot ...')`.
  - `rejectMouvement()` : si le lot lié est `BROUILLON` → lot passé à `REJETÉ` (ne compte plus dans le stock).
- **Cohérence stock** : `Produit::getStockTotal()`/`getStockParMagasin()` et `RapportController::stockBas()` filtrent désormais `statut_validation = 'VALIDÉ'` (comme `ruptureStock`/dashboard déjà) → un lot BROUILLON n'apparaît plus dans le stock disponible avant validation. `SortieForm`/`EntreeStockForm` chargent déjà les lots `VALIDÉ`.
- **Frontend** : `StockLotSerie.tsx` ajout du badge **« Brouillon »** (gris) dans `validationConfig` ; `types/lot.ts` union `statut_validation` étendue avec `'BROUILLON'`.
- Vérifs : test API complet — réception complétant le bon (REÇU) → lot auto-VALIDÉ ; réception laissant le bon `REÇU PARTIELLEMENT` → lot 65 `BROUILLON` + mvt 134 `EN ATTENTE` (pas d'historique prix) ; validation du mvt 134 → lot 65 `VALIDÉ` (garde anti-doublon : pas de nouvel historique car 15.00 = dernier) ; données de test supprimées et bon 32/ligne 48 (13/15) restaurés ; `php -l` OK (4 fichiers), migration exécutée, `tsc -b` OK, `oxlint` 0 erreur (40 warnings préexistants), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-eGrohpnZ.js + index-DTTQuOTJ.css, ancien index-CF4GuX3m.js supprimé).

### Session 41 – Entrée stock : « En attente » en haut + libellé lot « En attente »
- **Besoin (retour utilisateur)** : (1) dans la page « Entrée stock », les entrées **non validées** doivent apparaître **en haut** ; (2) dans « Lots/séries », le statut `BROUILLON` doit s'afficher **« En attente »** (pas « Brouillon »).
- **Backend `MouvementStockController::index()`** : nouveau param `en_attente_premier` (booléen) → `orderByRaw("CASE WHEN statut_validation = 'EN ATTENTE' THEN 0 ELSE 1 END")` appliqué **avant** le tri `sort_by`/`sort_order` (les EN ATTENTE passent en tête, puis tri par date).
- **Frontend `EntreeStockForm.tsx`** : param `en_attente_premier: '1'` ajouté à la requête de liste.
- **Frontend `StockLotSerie.tsx`** : libellé du badge `BROUILLON` → « En attente » (couleur grise conservée, distincte du `EN ATTENTE` ambre).
- Vérifs : test API (mvt temp 136 `EN ATTENTE` daté du 01/07 → position 1, au-dessus des VALIDÉ du 08/08 ; nettoyé), `php -l` OK (contrôleur), `tsc -b` OK, `oxlint` 0 erreur (40 warnings préexistants), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-BVy30RRp.js + index-DTTQuOTJ.css, ancien index-eGrohpnZ.js supprimé).

### Session 42 – Bons de commande : montant recalculé au prix actuel
- **Besoin (retour utilisateur)** : dans la liste des Bons de commande, le montant doit tenir compte du **prix actuel** (dernier prix d'achat de l'historique des prix) multiplié par la quantité, et afficher la somme.
- **Backend `BonCommandeController::index()`** : eager load ajouté `lignes.produit.historiquePrix`. Après pagination, pour chaque bon : chaque ligne reçoit `prix_actuel` (dernier `prix_achat_ht` non nul de l'historique, tri par `date_application` desc ; sinon repli sur `prix_unitaire_ht` saisi) et le bon reçoit `montant_actuel` = Σ `quantite_commandee × prix_actuel`.
- **Frontend `BonCommande.tsx`** : deux colonnes montant — **« Montant (saisi) »** (prix du bon, barré `line-through` gris) et **« Montant (prix actuel) »** (en `royal-700`, bold, avec sous-ligne ambre indiquant l'écart `+/-` si différent). Type `LigneCommande.prix_actuel?` + `BonCommande.montant_actuel?` ajoutés dans `types/bon-commande.ts`.
- Vérifs : test API (BC-2608-0009 : Beurre 15 @8 au lieu de 15 → montant_actuel 136 vs saisi 241 ; BC-2608-0008 : Pomme 10 @2.8 → 53 vs 45), `php -l` OK (contrôleur), `tsc -b` OK, `oxlint` 0 erreur (40 warnings préexistants), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-BuHCKUfX.js + index-DvWtaz5N.css, anciens bundles supprimés).

### Session 43 – PDF Bon de commande : montant reçu affiché (pas de « reste »)
- **Besoin (retour utilisateur)** : sur `/bon-commande/32` (REÇU PARTIELLEMENT), le PDF doit afficher le **montant reçu via la réception** (quantité reçue × prix) et **pas** de « reste ».
- **`BonCommandePDF.tsx`** : colonnes **Qté / Reçu / Prix unit. / Montant total** (montant = `quantite_recue × prix` par ligne) ; total en bas = **« Montant total »** (Σ reçu × prix). Aucune colonne « Total HT » ni « reste », aucun total « Montant total HT ». (Retours itératifs : la colonne « Total HT » et les lignes « Montant total HT »/« Reste à recevoir » ont été retirées ; libellé « Montant reçu » → « Montant total ».)
- Vérifs : `tsc -b` OK, `oxlint` 0 erreur (40 warnings préexistants), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-DXWeFrkw.js + index-DvWtaz5N.css, anciens bundles supprimés).

### Session 44 – Détails bon : sous-texte « Reçu : X sur Y » par ligne (réception partielle)
- **Besoin (retour utilisateur)** : dans la page Détails du bon de commande (`BonCommandeDetails`), pour les réceptions partielles, chaque ligne doit indiquer « Reçu : X sur Y ».
- **`BonCommandeDetails.tsx`** : dans la cellule « Total HT » de chaque ligne, sous-texte ambre **« Reçu : {quantite_recue} sur {quantite_commandee} »** affiché uniquement si `0 < quantite_recue < quantite_commandee`.
- Vérifs : `tsc -b` OK, `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-B9cxYhzZ.js + index-DvWtaz5N.css, anciens bundles supprimés).

### Session 45 – Détails bon : prix de réception signalé (variation vs prix du bon)
- **Besoin (retour utilisateur)** : sur `/bon-commande/32` (Beurre), les réceptions sont venues à des **prix différents** du prix du bon (10×15, 2×8, 1×7, 1×7 alors que le bon est à 15) et **rien ne le signalait** dans les détails (ni le PDF). Le montant reçu était calculé au prix du bon (14×15 = 210) au lieu du prix réel de réception (180).
- **Backend `BonCommandeController::show()`** : par ligne, agrège les mouvements de réception du bon (`mouvement_stock.reference_document = numero_commande` + lot du même produit) et calcule **`montant_recu`** = Σ `quantite × prix_achat_ht_unitaire` (repli sur `prix_unitaire_ht` du bon si lot sans prix). La ligne porte désormais `montant_recu` dans la réponse API.
- **Frontend `BonCommandeDetails.tsx`** : nouvelle colonne **« Prix reçu »** (moyenne = `montant_recu / quantite_recue`) — verte si supérieur au prix du bon, **ambre si inférieur** avec sous-texte « −X vs bon » (variation signalée si |écart| > 0.005) ; « − » si aucune réception. Le total du pied **« Reçu (prix réception) »** utilise désormais `montant_recu` (fallback `quantite_recue × prix_unitaire_ht`).
- **`BonCommandePDF.tsx`** : le PDF n'imprime désormais que les **lignes réceptionnées** (`filter quantite_recue > 0`), avec prix unit. = prix moyen de réception (`montant_recu / recu`) et montant = `montant_recu` (repli `recu × prix_unitaire_ht`), total = Σ `montant_recu`. Cohérent avec les détails (plus de 210 vs 180).
- **Type** `LigneCommande.montant_recu?` ajouté (`types/bon-commande.ts`).
- Vérifs : test API bon 32 → Beurre `montant_recu=180` (prix moyen reçu 12.86 vs bon 15.00), Mais doux `16` (1.60 identique, aucune variation) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (0 sur les 2 fichiers), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-CwhRjS_4.js + index-DvWtaz5N.css, anciens bundles supprimés).

### Session 46 – PDF bon : uniquement les lignes réceptionnées + détail des réceptions par ligne
- **Besoin (retour utilisateur)** : (1) le PDF du bon doit imprimer **seulement ce qui a été réceptionné** (lignes `quantite_recue > 0`), pour la traçabilité d'une réception partielle ; (2) dans la page Détails, afficher sous chaque ligne le **détail de chaque réception** (date, lot, quantité, prix unit., montant) pour retracer les réceptions à des prix différents.
- **`BonCommandePDF.tsx`** : `const lignes = (bon.lignes || []).filter((l) => (Number(l.quantite_recue) || 0) > 0);` — seules les lignes réceptionnées sont imprimées.
- **Backend `BonCommandeController::show()`** : en plus de `montant_recu`, chaque ligne reçoit `receptions[]` (tri `id asc`) : `{ id, date (date_mouvement Y-m-d), numero_lot, quantite, prix_unitaire, montant, statut }`, un élément par mouvement de réception (chaque réception partielle = un lot + un mouvement distinct).
- **Frontend `BonCommandeDetails.tsx`** : sous chaque ligne du tableau « Lignes de commande », sous-tableau **« Détail des réceptions (N) »** (fond royal-50/40) — colonnes Date / Lot / Quantité / Prix unit. / Montant. Le `map` renvoie désormais deux éléments frères enveloppés dans un fragment `<>...</>`.
- **Type** `LigneCommande.receptions?` ajouté (`types/bon-commande.ts`).
- Vérifs : API bon 32 → Beurre 4 réceptions (lot LOT-2608-4172 10×15=150, 1066 2×8=16, 0868 1×7=7, 1193 1×7=7), Mais doux 1 (lot 2600 10×1.6=16) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (0 sur les 2 fichiers), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-Cn6gJLGL.js + index-DAFgav-A.css, anciens bundles supprimés).

### Session 47 – Traçabilité : une réception = un PDF (référence de réception)
- **Besoin (retour utilisateur)** : « une réception = un PDF » — après une réception partielle, le PDF doit n'imprimer que ce qui a été réceptionné à ce moment-là (ex. Beurre 40 + Mais 20 : réception de 40 Beurre + 15 Mais → PDF avec les deux ; 5 jours après 3 Mais → PDF seulement Mais 3 ; 8 jours après les 2 restants → PDF seulement Mais 2). Pour la traçabilité.
- **Migration** `2026_08_08_130000_add_reference_reception_to_mouvement_stock.php` : colonne `reference_reception` (string nullable) sur `mouvement_stock`. Exécutée.
- **Backend `BonCommandeController::receive()`** : génère une référence unique par opération `REC-YYMM-NNNN` (compteur sur `reference_reception`), transmise à `creerLotReception(..., $referenceReception)` qui la renseigne sur chaque mouvement créé. `creerLotReception()` accepte le nouveau paramètre (default null).
- **Backend `BonCommandeController::show()`** : en plus de `receptions[]` par ligne, renvoie `receptions_liste[]` (groupé par référence de réception, tri date desc) : `{ reference_reception, date, quantite, montant, lignes[] (produit, code_article, numero_lot, quantite, prix_unitaire, montant, statut) }`. Les mouvements existants sans référence sont groupés par datetime (`LEGACY-...`).
- **Nouveau composant `ReceptionPDF.tsx`** : « Bon de Réception » — en-tête FONDEG, n° = `reference_reception`, date, bon de commande lié, fournisseur/destination, tableau des **produits reçus** (Code / Produit / Lot / Qté / Prix unit.), totaux quantité + montant. Une réception = un PDF.
- **Frontend `BonCommandeDetails.tsx`** : nouvelle carte **« Réceptions »** sous « Lignes de commande » — tableau Référence / Date / Quantité / Montant / bouton **PDF** par réception (`ReceptionPDF`, nom de fichier `Reception-{ref}.pdf`). Icônes `Package` ajoutées aux imports.
- **Types** (`types/bon-commande.ts`) : `BonCommande.receptions_liste?`, `ReceptionListe`, `ReceptionLigne`, et `receptions[].reference_reception?` sur `LigneCommande`.
- Vérifs : migration exécutée, test API réception 1 Poulet sur bon 27 → `reference_reception=REC-2608-0001` créée + présente dans `receptions_liste` (legacy groupés par datetime) ; données de test nettoyées (mouvement + lot supprimés, ligne 41 restaurée à 57) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (0 sur les 3 fichiers), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-DRT2lJtc.js + index-DAFgav-A.css, anciens bundles supprimés).

### Session 48 – PDF de réception au moment de l'insertion (correction du placement)
- **Correction (retour utilisateur)** : « le PDF c'est par rapport à l'insertion » — le bon de réception doit être imprimé **juste après la saisie de la réception** (ce que l'utilisateur vient de réceptionner), pas dans la liste des réceptions des détails. Surtout pour une **réception partielle**.
- **Backend `BonCommandeController::receive()`** : la réponse renvoie désormais `data.reference_reception` (la référence générée `REC-YYMM-NNNN`), pour que le frontend affiche le PDF immédiatement après l'insertion.
- **Frontend `ReceptionForm.tsx`** : après `receive()` réussi, au lieu de naviguer directement, affiche un **écran de succès** avec : référence de réception, tableau des produits reçus (Produit / Lot / Qté / Prix unit. / Montant), total quantité + montant, et bouton **« Imprimer le bon de réception »** (`ReceptionPDF`, fichier `Reception-{ref}.pdf`) + bouton « Terminer » (→ `/bon-commande` si REÇU, sinon `/reception`). Construction des lignes du PDF depuis les `receptions` soumises + `bon.lignes` (prix = `prix_achat_ht_unitaire` saisi, sinon `prix_unitaire_ht`).
- La carte « Réceptions » dans `BonCommandeDetails` (Session 47) reste pour la **traçabilité** (un PDF par réception historique), mais l'impression principale se fait à l'insertion.
- Vérifs : test API réception bon 27 → réponse `reference_reception=REC-2608-0001` + statut ; données test nettoyées (ligne 41 restaurée à 57) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (1 warning préexistant toast), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-CA_vEmab.js + index-DAFgav-A.css, anciens bundles supprimés).

### Session 49 – Réception détaillée accessible plus tard (même écran qu'à l'insertion)
- **Besoin (retour utilisateur)** : pouvoir retrouver **le même écran** qu'à l'insertion (référence de réception + tableau Produit/Lot/Qté/Prix/Montant + totaux + bouton « Imprimer le bon de réception ») **même après plusieurs jours**.
- **`BonCommandeDetails.tsx`** : la carte « Réceptions » gagne une colonne **Actions** avec deux boutons par réception : œil **Détails** (ouvre un `Modal` `maxWidth="2xl"` reproduisant exactement l'écran de succès de l'insertion — référence, tableau des produits, totaux, bouton « Imprimer le bon de réception » via `ReceptionPDF`) et **PDF** (téléchargement direct). Import `Modal` + icône `Eye` ajoutés, état `receptionDetail`.
- Vérifs : `tsc -b` OK, `oxlint` 0 erreur (0 sur le fichier), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-cWeGXvCa.js + index-DAFgav-A.css, anciens bundles supprimés).

### Session 50 – Détails produit : prix moyen pondéré (au lieu du dernier historique)
- **Besoin (retour utilisateur)** : dans les détails produit (`ProduitDetails.tsx`), « Dernier prix / Prix d'achat HT » doit afficher le **prix moyen pondéré** (même logique que la sortie stock, Session 36) : Σ(prix_achat × quantite_disponible) / Σ(quantite_disponible) sur les lots en stock.
- **Backend `ProduitController::getStock()`** : calcule `prix_pondere` (round 4) et `devise_ponderee` (devise du premier lot en stock) sur les lots `statut_validation = 'VALIDÉ'` avec `quantite_disponible > 0` (soft-deletes respectés via relation Eloquent). `null` si aucun lot en stock. Ajout import `Devise`.
- **Frontend `types/produit.ts`** : `StockResponse.data` étendu (`prix_pondere: number | null`, `devise_ponderee?`).
- **Frontend `ProduitDetails.tsx`** : nouvelles dérivées `prixPondere`/`devisePonderee` depuis `stock`. Carte « Dernier prix » → **« Prix moyen pondéré »** (sous-texte « Calculé sur les lots disponibles », repli « Aucun lot en stock — dernier prix historique ») ; libellé « Prix d'achat HT » des Informations générales → **« Prix moy. pondéré »**. Affiche `prix_pondere` si non null, sinon `latestPrice` (historique).
- Vérifs : test API → Pomme (produit 29) prix_pondere 2.7826 USD, Film alimentaire 5 USD, Mais doux 1.6 USD ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (0 sur les 2 fichiers), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-epNL3rhQ.js dans `assets/` + index-DAFgav-A.css, `index.html` mis à jour, anciens bundles supprimés).

### Session 51 – Taux de conversion monnaie locale (CDF) vs USD
- **Besoin (retour utilisateur)** : un menu pour saisir le **taux de change** de la monnaie locale (ex. au Congo 1 USD = 2300 CDF), avec une table de conversion. Le périmètre des listes/PDFs concernés reste à définir ; le premier usage est la colonne **CDF** dans la liste des Bons de commande.
- **Migration** `2026_08_08_140000_create_taux_conversion_table.php` (exécutée) : table `taux_conversion` — `code_devise` (default CDF), `nom`, `taux` (decimal 18,2), `date_application`, `actif`, timestamps + SoftDeletes.
- **Modèle `TauxConversion`** : scope `actif`/`search` ; helpers statiques `tauxPourDate(?date, code='CDF')` (taux actif le plus récent ≤ date) et `convertirEnCdf(montantUsd, ?date)` (montant × taux, round 2, null si aucun taux).
- **`TauxConversionController`** (étend BaseController) : CRUD complet + `tauxActuel()` (GET `taux-conversion/taux-actuel` → taux actif le plus récent, 404 si aucun). Validation : `code_devise` unique, `taux` required numeric > 0, `date_application` required date.
- **Routes** `api/config/taux-conversion` (7 routes, `taux-actuel` avant `{id}`) + **permissions** `config:taux_conversion:view/create/update/delete` (PermissionSeeder, ConfigPermissionSeeder, migration `2026_08_08_140100_add_taux_conversion_permissions.php` liée au rôle ADMIN).
- **Frontend** : types `taux-conversion.ts`, service `taux-conversion.ts` (list/get/getActuel/create/update/delete/toggle), page `ConfigurationTauxConversion.tsx` (`/configuration/taux-change`) — carte gradient « 1 USD = X CDF » (taux actuel), CRUD avec date d'application, pagination/recherche, toggle actif ; sous-menu « Taux de change » dans `mockData.ts` (sous Configuration, après Devise) ; route App.tsx + titre Header.
- **Colonne CDF liste Bons de commande** (`BonCommande.tsx`) : chargement du taux actuel via `tauxConversionService.getActuel()` dans `fetchData` ; colonne « Montant (CDF) » (hidden md) = `montant_actuel × taux`, « — » si aucun taux ; dépendance `pageSize` ajoutée au useCallback (warning oxlint corrigé).
- Vérifs : migration exécutée, route:list OK (7 routes), API testée (création id 1 taux 2300, taux-actuel 2300, update OK), seeders relancés (107 permissions) ; `php -l` OK, `tsc -b` OK, `oxlint` 0 erreur (0 sur fichiers modifiés), `npm run build` OK, synchro `dist/*` → `Fondeg/` (index-DKELO2fT.js + index-DsGeMPVn.css dans `assets/`, `index.html` mis à jour, anciens bundles supprimés).
