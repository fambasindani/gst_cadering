import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BonCommande } from './pages/BonCommande';
import { BonCommandeForm } from './pages/BonCommandeForm';
import { BonCommandeDetails } from './pages/BonCommandeDetails';
import { ReceptionList } from './pages/ReceptionList';
import { ReceptionForm } from './pages/ReceptionForm';
import { Validation } from './pages/Validation';
import { ValidationBonCommande } from './pages/ValidationBonCommande';
import { EntrerStock } from './pages/EntrerStock';
import { PeriodeInventaire } from './pages/PeriodeInventaire';
import { Ajustement } from './pages/Ajustement';
import { AjustementProduit } from './pages/AjustementProduit';
import { SaisieInventaire } from './pages/SaisieInventaire';
import { Produits } from './pages/Produits';
import { ProduitForm } from './pages/ProduitForm';
import { ProduitDetails } from './pages/ProduitDetails';
import { StockLotSerie } from './pages/StockLotSerie';
import { StockLotSerieForm } from './pages/StockLotSerieForm';
import { EntreeStockForm } from './pages/EntreeStockForm';
import { SortieStockForm } from './pages/SortieStockForm';
import { RetourStock } from './pages/RetourStock';
import { RetourForm } from './pages/RetourForm';
import { RetourDetail } from './pages/RetourDetail';
import { Partenaires } from './pages/Partenaires';
import { PartenaireForm } from './pages/PartenaireForm';
import { PartenaireDetails } from './pages/PartenaireDetails';
import { ConfigurationZone } from './pages/ConfigurationZone';
import { ConfigurationVille } from './pages/ConfigurationVille';
import { ConfigurationDepartement } from './pages/ConfigurationDepartement';
import { ConfigurationDevise } from './pages/ConfigurationDevise';
import { ConfigurationUtilisateurs } from './pages/ConfigurationUtilisateurs';
import { ConfigurationUtilisateurForm } from './pages/ConfigurationUtilisateurForm';
import { ConfigurationRoles } from './pages/ConfigurationRoles';
import { ConfigurationRoleForm } from './pages/ConfigurationRoleForm';
import { ConfigurationPermissions } from './pages/ConfigurationPermissions';
import { ConfigurationPermissionForm } from './pages/ConfigurationPermissionForm';
import { AuditList } from './pages/AuditList';
import { AuditDetail } from './pages/AuditDetail';
import { MonProfil } from './pages/MonProfil';
import { FicheTechniqueList } from './pages/FicheTechniqueList';
import { FicheTechniqueForm } from './pages/FicheTechniqueForm';
import { EntreeRecette } from './pages/EntreeRecette';
import { RapportRecette } from './pages/RapportRecette';
import { BonCommandeRapport } from './pages/rapports/BonCommandeRapport';
import { BonLivraisonRapport } from './pages/rapports/BonLivraisonRapport';
import { RapportStock } from './pages/rapports/RapportStock';
import { VariationStock } from './pages/rapports/VariationStock';
import { RapportClient } from './pages/rapports/RapportClient';
import { RapportSortie } from './pages/rapports/RapportSortie';
import { RapportAchat } from './pages/rapports/RapportAchat';
import { RapportFournisseur } from './pages/rapports/RapportFournisseur';
import { InventaireTheorique } from './pages/rapports/InventaireTheorique';
import { ConsommationsClients } from './pages/rapports/ConsommationsClients';
import { RuptureStock } from './pages/rapports/RuptureStock';
import { StockBas } from './pages/rapports/StockBas';
import { DevisList } from './pages/facturation/DevisList';
import { DevisForm } from './pages/facturation/DevisForm';
import { DevisDetails } from './pages/facturation/DevisDetails';
import { FactureList } from './pages/facturation/FactureList';
import { FactureForm } from './pages/facturation/FactureForm';
import { FactureDetails } from './pages/facturation/FactureDetails';
import { PaiementList } from './pages/facturation/PaiementList';
import { PaiementForm } from './pages/facturation/PaiementForm';
import { AvoirList } from './pages/facturation/AvoirList';
import { AvoirForm } from './pages/facturation/AvoirForm';
import { AvoirDetails } from './pages/facturation/AvoirDetails';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastProvider } from './hooks/useToast';

function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="produits" element={<Produits />} />
          <Route path="produits/creer" element={<ProduitForm />} />
          <Route path="produits/:id/modifier" element={<ProduitForm />} />
          <Route path="produits/:id" element={<ProduitDetails />} />
          <Route path="bon-commande" element={<BonCommande />} />
          <Route path="bon-commande/creer" element={<BonCommandeForm />} />
          <Route path="bon-commande/:id/modifier" element={<BonCommandeForm />} />
          <Route path="bon-commande/:id" element={<BonCommandeDetails />} />
          <Route path="reception" element={<ReceptionList />} />
          <Route path="reception/:id" element={<ReceptionForm />} />
          <Route path="validation" element={<Validation />} />
          <Route path="validation/bon-commande" element={<ValidationBonCommande />} />
          <Route path="validation/entrer-stock" element={<EntrerStock />} />
          <Route path="validation/periode-inventaire" element={<PeriodeInventaire />} />
          <Route path="validation/saisie-inventaire" element={<SaisieInventaire />} />
          <Route path="validation/ajustement" element={<Ajustement />} />
          <Route path="validation/ajustement-produit" element={<AjustementProduit />} />
          <Route path="configuration/zone" element={<ConfigurationZone />} />
          <Route path="configuration/ville" element={<ConfigurationVille />} />
          <Route path="configuration/departement" element={<ConfigurationDepartement />} />
          <Route path="configuration/devise" element={<ConfigurationDevise />} />
          <Route path="partenaire" element={<Partenaires />} />
          <Route path="partenaire/creer" element={<PartenaireForm />} />
          <Route path="partenaire/:id/modifier" element={<PartenaireForm />} />
          <Route path="partenaire/:id" element={<PartenaireDetails />} />
          <Route path="stock/lot-serie" element={<StockLotSerie />} />
          <Route path="stock/lot-serie/creer" element={<StockLotSerieForm />} />
          <Route path="stock/lot-serie/:id/modifier" element={<StockLotSerieForm />} />
          <Route path="stock/entree" element={<EntreeStockForm />} />
          <Route path="stock/sortie" element={<SortieStockForm />} />
          <Route path="stock/retour" element={<RetourStock />} />
          <Route path="stock/retour/creer" element={<RetourForm />} />
          <Route path="stock/retour/:id/modifier" element={<RetourForm />} />
          <Route path="stock/retour/:id" element={<RetourDetail />} />
          <Route path="recettes/creation" element={<FicheTechniqueList />} />
          <Route path="recettes/creation/nouveau" element={<FicheTechniqueForm />} />
          <Route path="recettes/creation/:id" element={<FicheTechniqueForm />} />
          <Route path="recettes/creation/:id/modifier" element={<FicheTechniqueForm />} />
          <Route path="recettes/entree" element={<EntreeRecette />} />
          <Route path="recettes/rapport" element={<RapportRecette />} />
          <Route path="facturation/devis" element={<DevisList />} />
          <Route path="facturation/devis/creer" element={<DevisForm />} />
          <Route path="facturation/devis/:id/modifier" element={<DevisForm />} />
          <Route path="facturation/devis/:id" element={<DevisDetails />} />
          <Route path="facturation/factures" element={<FactureList />} />
          <Route path="facturation/factures/creer" element={<FactureForm />} />
          <Route path="facturation/factures/:id/modifier" element={<FactureForm />} />
          <Route path="facturation/factures/:id" element={<FactureDetails />} />
          <Route path="facturation/paiements" element={<PaiementList />} />
          <Route path="facturation/paiements/creer" element={<PaiementForm />} />
          <Route path="facturation/avoirs" element={<AvoirList />} />
          <Route path="facturation/avoirs/creer" element={<AvoirForm />} />
          <Route path="facturation/avoirs/:id" element={<AvoirDetails />} />
          <Route path="rapports/bon-commande" element={<BonCommandeRapport />} />
          <Route path="rapports/bon-livraison" element={<BonLivraisonRapport />} />
          <Route path="rapports/stock" element={<RapportStock />} />
          <Route path="rapports/variation-stock" element={<VariationStock />} />
          <Route path="rapports/client" element={<RapportClient />} />
          <Route path="rapports/sortie" element={<RapportSortie />} />
          <Route path="rapports/achat" element={<RapportAchat />} />
          <Route path="rapports/fournisseur" element={<RapportFournisseur />} />
          <Route path="rapports/inventaire-theorique" element={<InventaireTheorique />} />
          <Route path="rapports/consommations" element={<ConsommationsClients />} />
          <Route path="rapports/rupture-stock" element={<RuptureStock />} />
          <Route path="rapports/stock-bas" element={<StockBas />} />
          <Route path="configuration/utilisateurs" element={<ConfigurationUtilisateurs />} />
          <Route path="configuration/utilisateurs/nouveau" element={<ConfigurationUtilisateurForm />} />
          <Route path="configuration/utilisateurs/:id/modifier" element={<ConfigurationUtilisateurForm />} />
          <Route path="configuration/roles" element={<ConfigurationRoles />} />
          <Route path="configuration/roles/nouveau" element={<ConfigurationRoleForm />} />
          <Route path="configuration/roles/:id/modifier" element={<ConfigurationRoleForm />} />
          <Route path="configuration/permissions" element={<ConfigurationPermissions />} />
          <Route path="configuration/permissions/nouveau" element={<ConfigurationPermissionForm />} />
          <Route path="configuration/permissions/:id/modifier" element={<ConfigurationPermissionForm />} />
          <Route path="audit" element={<AuditList />} />
          <Route path="audit/:id" element={<AuditDetail />} />
          <Route path="profil" element={<MonProfil />} />
        </Route>


      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
