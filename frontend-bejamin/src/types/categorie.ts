export interface Categorie {
  id: number;
  nom: string;
  description: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CategorieFormData {
  nom: string;
  description: string;
  actif: boolean;
}

export interface CategorieListResponse {
  success: boolean;
  data: {
    data: Categorie[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface CategorieResponse {
  success: boolean;
  data: Categorie;
  message: string;
}
