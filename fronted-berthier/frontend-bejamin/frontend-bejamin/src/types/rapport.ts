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

export interface StockParProduit {
  produit: Produit;
  quantite_totale: number;
  lots: Lot[];
}

export interface RapportStockData {
  stock_par_produit: StockParProduit[];
  statistiques: {
    total_produits: number;
    total_lots: number;
    total_quantite: number;
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

export interface SortieParProduit {
  produit: Produit;
  quantite_totale: number;
  sorties: MouvementStock[];
}

export interface RapportSortieData {
  sorties_par_produit: SortieParProduit[];
  statistiques: {
    total_sorties: number;
    total_quantite: number;
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
