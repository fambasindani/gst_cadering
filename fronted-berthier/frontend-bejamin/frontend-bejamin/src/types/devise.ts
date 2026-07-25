export interface Devise {
  id: number;
  code: string;
  nom: string;
  symbole: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DeviseFormData {
  code: string;
  nom: string;
  symbole: string;
  actif: boolean;
}

export interface DeviseListResponse {
  success: boolean;
  data: {
    data: Devise[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface DeviseResponse {
  success: boolean;
  data: Devise;
  message: string;
}
