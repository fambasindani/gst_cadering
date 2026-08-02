export interface MouvementStock {
  id: number;
  id_lot: number;
  lot?: { id: number; numero_lot: string; quantite_disponible: number; prix_achat_ht_unitaire?: number | null; date_peremption?: string | null; produit?: { id: number; nom: string; code_article: string } | null; magasin?: { id: number; nom: string } | null } | null;
  id_type_mouvement: number;
  type_mouvement?: { id: number; libelle: string; sens: number } | null;
  id_partenaire: number | null;
  partenaire?: { id: number; nom: string } | null;
  id_magasin: number | null;
  magasin?: { id: number; nom: string } | null;
  id_departement: number | null;
  departement?: { id: number; nom: string } | null;
  quantite: number;
  date_mouvement: string;
  id_utilisateur: number;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  reference_document: string | null;
  commentaire: string | null;
  id_periode_inventaire: number | null;
  periode_inventaire?: { id: number; libelle: string } | null;
  valide_par: { id: number; nom: string; prenom: string } | null;
  date_validation: string | null;
  statut_validation: string;
}

export interface PeriodeInventaire {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: 'PREVU' | 'EN_COURS' | 'CLOTURE' | 'ANNULE';
  id_magasin: number;
  magasin?: { id: number; nom: string } | null;
  description: string | null;
  inventaires?: Inventaire[];
}

export interface Inventaire {
  id: number;
  id_periode_inventaire: number;
  periode_inventaire?: { id: number; libelle: string } | null;
  id_produit: number;
  produit?: { id: number; nom: string; code_article: string } | null;
  id_magasin: number;
  magasin?: { id: number; nom: string } | null;
  stock_theorique: number;
  stock_physique_compte: number;
  ecart: number;
  ecart_saisie?: number;
  date_saisie: string;
  id_utilisateur: number;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  commentaire: string | null;
}

export interface Ajustement {
  produit: string;
  stock_theorique: number;
  stock_physique: number;
  ecart: number;
}

export interface InventaireResume {
  periode: PeriodeInventaire;
  total_theorique: number;
  total_physique: number;
  total_ecart: number;
  ecarts_positifs: number;
  ecarts_negatifs: number;
  sans_ecart: number;
  stock_mis_a_jour: boolean;
}

export interface MouvementStockListResponse {
  success: boolean;
  data: {
    data: MouvementStock[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface MouvementStockResponse {
  success: boolean;
  data: MouvementStock;
  message: string;
}

export interface PeriodeInventaireListResponse {
  success: boolean;
  data: {
    data: PeriodeInventaire[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface PeriodeInventaireResponse {
  success: boolean;
  data: PeriodeInventaire;
  message: string;
}

export interface InventaireListResponse {
  success: boolean;
  data: {
    data: Inventaire[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface InventaireResponse {
  success: boolean;
  data: Inventaire;
  message: string;
}

export interface InventaireCreateMultipleResponse {
  success: boolean;
  data: {
    cree: number;
    ignores: number[];
    inventaires: Inventaire[];
  };
  message: string;
}

export interface InventaireResumeResponse {
  success: boolean;
  data: InventaireResume;
  message: string;
}

export interface AjustementResponse {
  success: boolean;
  data: {
    ajustements: Ajustement[];
    total_ecart: number;
  };
  message: string;
}

export interface MiseAJourStockResponse {
  success: boolean;
  data: {
    periode: string;
    produits_ajustes: number;
    total_ajoute: number;
    total_retire: number;
  };
  message: string;
}
