export interface Tracabilite {
  id: number;
  numero_tracabilite: string;
  id_lot: number;
  id_utilisateur: number;
  id_departement: number | null;
  id_partenaire: number | null;
  quantite: number;
  commentaire: string | null;
  date_tracabilite: string;
  created_at: string;
  updated_at: string;
  lot?: {
    id: number;
    numero_lot: string;
    quantite_disponible: number;
    produit?: { id: number; nom: string; code_article: string } | null;
    magasin?: { id: number; nom: string } | null;
    partenaire?: { id: number; nom: string } | null;
  } | null;
  utilisateur?: { id: number; full_name: string } | null;
  departement?: { id: number; nom: string } | null;
  partenaire?: { id: number; nom: string } | null;
}

export interface TracabiliteFormData {
  id_lot: string;
  id_departement: string;
  id_partenaire: string;
  quantite: string;
  commentaire: string;
  date_tracabilite: string;
}

export interface TracabiliteListResponse {
  success: boolean;
  data: {
    data: Tracabilite[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface TracabiliteResponse {
  success: boolean;
  data: Tracabilite;
  message: string;
}
