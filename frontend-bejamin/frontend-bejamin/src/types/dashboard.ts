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
  factures_impayees: number;
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

export interface TopClient {
  id: number;
  nom: string;
  total_commandes: number;
  total_montant: number;
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
  ville: string;
  zone: string;
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
  top_clients: TopClient[];
  repartition_categorie: RepartitionCategorie[];
  alertes: {
    stock_bas: AlerteStockBas[];
    peremption_proche: AlertePeremption[];
  };
  activites_recentes: ActiviteRecente[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message: string;
}
