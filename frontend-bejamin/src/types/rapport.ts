import type { BonCommande } from './bon-commande';
import type { Produit } from './produit';
import type { Lot } from './lot';
import type { Partenaire } from './partenaire';
import type { MouvementStock } from './validation';

export interface RapportResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface BonCommandeRapport {
  bons_commande: BonCommande[];
  statistiques: {
    total_bons: number;
    total_lignes: number;
    total_montant_ht: number;
  };
}

export interface BonLivraisonRapport {
  bons_livraison: BonCommande[];
  statistiques: {
    total_bons: number;
    total_quantite_recue: number;
  };
}

export interface RapportStockLigne {
  numero: number;
  designation: string;
  code_article: string;
  unite: string;
  prix_unitaire: number;
  devise: string;
  qte_initiale: number;
  valeur_initiale: number;
  qte_entree: number;
  valeur_entree: number;
  qte_sortie: number;
  valeur_sortie: number;
  qte_finale: number;
  valeur_finale: number;
}

export interface RapportStockPhysiqueLogiqueLigne {
  numero: number;
  designation: string;
  code_article: string;
  unite: string;
  prix_unitaire: number;
  devise: string;
  qte_logique: number;
  valeur_logique: number;
  qte_physique: number;
  valeur_physique: number;
  ecart: number;
  valeur_ecart: number;
}

export interface RapportStockPhysiqueLogiqueData {
  lignes: RapportStockPhysiqueLogiqueLigne[];
  statistiques: {
    total_produits: number;
    total_qte_logique: number;
    total_valeur_logique: number;
    total_qte_physique: number;
    total_valeur_physique: number;
    total_ecart: number;
    total_valeur_ecart: number;
  };
}

export interface RapportStockData {
  lignes: RapportStockLigne[];
  periode: {
    debut: string;
    fin: string;
  };
  statistiques: {
    total_produits: number;
    total_qte_initiale: number;
    total_qte_entree: number;
    total_qte_sortie: number;
    total_qte_finale: number;
    total_valeur_initiale: number;
    total_valeur_entree: number;
    total_valeur_sortie: number;
    total_valeur_finale: number;
  };
}

export interface VariationStockData {
  mouvements: MouvementStock[];
  statistiques: {
    total_mouvements: number;
    total_entrees: number;
    total_sorties: number;
    variation: number;
    periode: {
      debut: string;
      fin: string;
    };
  };
}

export interface ClientRapport {
  client: Partenaire;
  statistiques: {
    total_commandes: number;
    total_montant: number;
    total_produits: number;
    moyenne_par_commande: number;
  };
}

export interface RapportClientLigne {
  numero: number;
  id_client: number;
  client: string;
  numero_commande: string;
  date_commande: string;
  designation: string;
  article: string;
  unite: string;
  prix_unitaire: number;
  devise: string;
  quantite: number;
  valeur: number;
}

export interface RapportClientData {
  lignes: RapportClientLigne[];
  statistiques: {
    total_lignes: number;
    total_quantite: number;
    total_valeur: number;
  };
}

export interface SortieParProduit {
  produit: Produit;
  quantite_totale: number;
  sorties: MouvementStock[];
}

export interface RapportSortieLigne {
  numero: number;
  date: string;
  article: string;
  code_article: string;
  unite: string;
  prix_unitaire: number;
  devise: string;
  quantite: number;
  valeur: number;
  local: string;
  numero_lot: string;
}

export interface RapportSortieData {
  lignes: RapportSortieLigne[];
  statistiques: {
    total_lignes: number;
    total_quantite: number;
    total_valeur: number;
  };
}

export interface FournisseurStat {
  fournisseur: Partenaire;
  total_commandes: number;
  total_montant: number;
  total_produits: number;
}

export interface AchatFullData {
  achats: BonCommande[];
  statistiques: {
    total_achats: number;
    total_montant: number;
    par_fournisseur: FournisseurStat[];
  };
}

export interface FournisseurRapport {
  fournisseur: Partenaire;
  statistiques: {
    total_commandes: number;
    total_montant: number;
    total_produits: number;
    moyenne_par_commande: number;
  };
}

export interface InventaireItem {
  produit: Produit;
  stock_theorique: number;
  unite: string;
  valeur: number;
}

export interface InventaireValoriseItem {
  produit: Produit;
  stock_theorique: number;
  prix_unitaire: number;
  devise: string;
  valeur_totale: number;
  categorie: string;
}

export interface InventaireRapportData {
  inventaire: InventaireItem[];
  statistiques: {
    total_produits: number;
    total_stock: number;
    total_valeur: number;
  };
}

export interface InventaireValoriseRapportData {
  inventaire: InventaireValoriseItem[];
  statistiques: {
    total_produits: number;
    total_stock: number;
    total_valeur: number;
    devise: string;
  };
}

export interface ConsommationDetailProduit {
  produit: { id: number; nom: string; code_article: string };
  quantite_totale: number;
}

export interface ConsommationClient {
  client: Partenaire;
  total_commandes: number;
  total_produits: number;
  moyenne_par_commande: number;
  details_produits: ConsommationDetailProduit[];
}

export interface ConsommationsClientsData {
  consommations: ConsommationClient[];
  statistiques: {
    total_clients: number;
    total_commandes: number;
    total_produits: number;
  };
}

export interface RuptureProduit {
  produit: Produit;
  quantite_totale: number;
  seuil_alerte: number;
  lots: Lot[];
}

export interface RuptureStockData {
  ruptures: RuptureProduit[];
  statistiques: {
    total_ruptures: number;
    total_produits_epuises: number;
    quantite_manquante: number;
  };
}

export interface StockBasProduit {
  produit: Produit;
  quantite_totale: number;
  seuil_alerte: number;
  lots: Lot[];
}

export interface StockBasData {
  stocks_bas: StockBasProduit[];
  statistiques: {
    total_stocks_bas: number;
    quantite_manquante: number;
  };
}
