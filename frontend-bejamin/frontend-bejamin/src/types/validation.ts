export interface MouvementStock {
  id: number;
  id_lot: number;
  lot?: { id: number; numero_lot: string; quantite_disponible: number; produit?: { id: number; nom: string; code_article: string } | null; ville?: { id: number; nom: string } | null } | null;
  id_type_mouvement: number;
  type_mouvement?: { id: number; libelle: string; sens: number } | null;
  quantite: number;
  date_mouvement: string;
  id_utilisateur: number;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  reference_document: string | null;
  commentaire: string | null;
  id_periode_inventaire: number | null;
  periode_inventaire?: { id: number; libelle: string } | null;
  valide_par: number | null;
  valide_par?: { id: number; nom: string; prenom: string } | null;
  date_validation: string | null;
  statut_validation: string;
}

export interface PeriodeInventaire {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: 'PREVU' | 'EN_COURS' | 'CLOTURE' | 'ANNULE';
  id_ville: number;
  ville?: { id: number; nom: string } | null;
  description: string | null;
  inventaires?: Inventaire[];
}

export interface Inventaire {
  id: number;
  id_periode_inventaire: number;
  periode_inventaire?: { id: number; libelle: string } | null;
  id_produit: number;
  produit?: { id: number; nom: string; code_article: string } | null;
  id_ville: number;
  ville?: { id: number; nom: string } | null;
  stock_theorique: number;
  stock_physique_compte: number;
  ecart: number;
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
