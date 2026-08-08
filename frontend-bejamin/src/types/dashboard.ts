export interface DashboardStats {
  total_produits: number;
  produits_en_stock: number;
  produits_rupture: number;
  produits_stock_bas: number;
  commandes_validees: number;
  commandes_en_attente: number;
  clients_aeriens: number;
  clients_non_aeriens: number;
  total_clients: number;
  total_fournisseurs: number;
  stock_total: number;
  valeur_stock: number;
  retours_en_attente: number;
  lots_peremption_proche: number;
}

export interface EvolutionCommande {
  mois: string;
  total: number;
}

export interface TopProduit {
  id: number;
  nom: string;
  total_vendu: number;
}

export interface TopFournisseur {
  id: number;
  nom: string;
  total_commandes: number;
  total_montant: number;
}

export interface VariationPrix {
  id: number;
  nom: string;
  ancien_prix: number;
  nouveau_prix: number;
  variation: number;
  pourcentage: number;
  type: 'hausse' | 'baisse';
  date: string;
}

export interface RepartitionCategorie {
  categorie: string;
  total: number;
}

export interface AlerteStockBas {
  id: number;
  nom: string;
  stock_actuel: number;
  seuil_alerte: number;
  categorie: string;
  unite: string;
}

export interface AlertePeremption {
  id: number;
  produit: string;
  numero_lot: string;
  quantite: number;
  date_peremption: string;
  jours_restants: number;
  magasin: string;
}

export interface ActiviteRecente {
  type: string;
  libelle: string;
  produit: string;
  quantite: number;
  date: string;
  utilisateur: string;
}

export interface DashboardData {
  statistiques: DashboardStats;
  evolution_commandes: EvolutionCommande[];
  top_produits: TopProduit[];
  top_fournisseurs: TopFournisseur[];
  repartition_categorie: RepartitionCategorie[];
  alertes: {
    stock_bas: AlerteStockBas[];
    peremption_proche: AlertePeremption[];
    variations_prix: VariationPrix[];
  };
  activites_recentes: ActiviteRecente[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message: string;
}
