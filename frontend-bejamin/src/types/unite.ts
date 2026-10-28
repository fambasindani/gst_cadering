export interface Unite {
  id: number;
  nom: string;
  symbole: string;
  description: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface UniteFormData {
  nom: string;
  symbole: string;
  description: string;
  actif: boolean;
}

export interface UniteListResponse {
  success: boolean;
  data: {
    data: Unite[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface UniteResponse {
  success: boolean;
  data: Unite;
  message: string;
}
