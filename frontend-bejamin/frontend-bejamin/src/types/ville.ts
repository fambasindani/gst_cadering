export interface Ville {
  id: number;
  nom: string;
  code: string | null;
  pays: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface VilleFormData {
  nom: string;
  code: string;
  pays: string;
  actif: boolean;
}

export interface VilleListResponse {
  success: boolean;
  data: {
    data: Ville[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface VilleResponse {
  success: boolean;
  data: Ville;
  message: string;
}
