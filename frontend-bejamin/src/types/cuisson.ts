export interface CuissonTracabilite {
  id: number;
  id_utilisateur: number;
  id_partenaire: number | null;
  id_lot: number | null;
  date_operation: string;
  mise_en_decongelation: string;
  code_couleur: string;
  quantite_avant_cuisson: string;
  quantite_apres_cuisson: string;
  dlc_dluo: string;
  numero_lot_cree: string;
  mode_cuisson: string;
  heure_fin_cuisson: string;
  temperature_coeur_cuisson: number | null;
  heure_debut_refroidissement: string;
  heure_fin_refroidissement: string;
  temperature_coeur_refroidissement: number | null;
  created_at: string;
  updated_at: string;
  utilisateur?: { id: number; full_name: string } | null;
  partenaire?: { id: number; nom: string; code_iata?: string } | null;
  lot?: {
    id: number;
    numero_lot: string;
    produit?: { id: number; nom: string; code_article: string } | null;
  } | null;
}

export interface CuissonFormData {
  date_operation: string;
  id_partenaire: string;
  id_lot: string;
  mise_en_decongelation: string;
  code_couleur: string;
  quantite_avant_cuisson: string;
  quantite_apres_cuisson: string;
  dlc_dluo: string;
  numero_lot_cree: string;
  mode_cuisson: string;
  heure_fin_cuisson: string;
  temperature_coeur_cuisson: string;
  heure_debut_refroidissement: string;
  heure_fin_refroidissement: string;
  temperature_coeur_refroidissement: string;
}

export interface CuissonListResponse {
  success: boolean;
  data: {
    data: CuissonTracabilite[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface CuissonResponse {
  success: boolean;
  data: CuissonTracabilite;
  message: string;
}
