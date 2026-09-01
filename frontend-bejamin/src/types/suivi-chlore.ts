export interface SuiviChlore {
  id: number;
  id_utilisateur: number;
  id_partenaire: number | null;
  id_lot: number | null;
  date_operation: string;
  concentration_ppm: number | null;
  temps_trempage_minutes: number | null;
  commentaire_action_corrective: string;
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

export interface SuiviChloreFormData {
  date_operation: string;
  id_partenaire: string;
  id_lot: string;
  concentration_ppm: string;
  temps_trempage_minutes: string;
  commentaire_action_corrective: string;
}

export interface SuiviChloreListResponse {
  success: boolean;
  data: {
    data: SuiviChlore[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface SuiviChloreResponse {
  success: boolean;
  data: SuiviChlore;
  message: string;
}
