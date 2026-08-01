export interface Magasin {
  id: number;
  nom: string;
  code: string | null;
  pays: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MagasinFormData {
  nom: string;
  code: string;
  pays: string;
  actif: boolean;
}

export interface MagasinListResponse {
  success: boolean;
  data: {
    data: Magasin[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface MagasinResponse {
  success: boolean;
  data: Magasin;
  message: string;
}
