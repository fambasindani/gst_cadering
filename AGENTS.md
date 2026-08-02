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
