export interface Parametre {
  id: number;
  cle: string;
  valeur: string | null;
  description: string | null;
  type: string;
  est_modifiable: boolean;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ParametreFormData {
  cle: string;
  valeur: string;
  description: string;
  type: string;
  est_modifiable: boolean;
  actif: boolean;
}

export interface ParametreListResponse {
  success: boolean;
  data: {
    data: Parametre[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface ParametreResponse {
  success: boolean;
  data: Parametre;
  message: string;
}
