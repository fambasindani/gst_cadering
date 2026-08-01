export interface Produit {
  id: number;
  code_article: string;
  code_barre: string | null;
  nom: string;
  description: string | null;
  id_categorie: number | null;
  categorie?: { id: number; nom: string } | null;
  id_partenaire_principal: number | null;
  partenairePrincipal?: { id: number; nom: string } | null;
  partenaire_principal?: { id: number; nom: string } | null;
  id_unite: number;
  unite?: { id: number; nom: string; symbole: string } | null;
  seuil_alerte: number;
  actif: boolean;
  historiquePrix?: HistoriquePrix[];
  historique_prix?: HistoriquePrix[];
  stock_total?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface HistoriquePrix {
  id: number;
  id_produit: number;
  prix_achat_ht: number;
  id_devise: number;
  devise?: { id: number; code: string; nom: string; symbole: string } | null;
  date_application: string;
  commentaire: string | null;
  id_utilisateur: number | null;
}

export interface ProduitFormData {
  code_article: string;
  code_barre: string;
  nom: string;
  description: string;
  id_categorie: string;
  id_partenaire_principal: string;
  id_unite: string;
  seuil_alerte: string;
  actif: boolean;
  prix_achat_ht: string;
  id_devise: string;
  date_application: string;
  commentaire_prix: string;
}

export interface ProduitListResponse {
  success: boolean;
  data: {
    data: Produit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface ProduitResponse {
  success: boolean;
  data: Produit;
  message: string;
}

export interface StockParMagasin {
  magasin: string;
  magasin_id: number;
  stock: number;
}

export interface StockResponse {
  success: boolean;
  data: {
    produit: {
      id: number;
      nom: string;
      code_article: string;
      code_barre: string | null;
      unite: string;
    };
    stock_total: number;
    stock_par_magasin: StockParMagasin[];
    seuil_alerte: number;
    statut: string;
  };
  message: string;
}
