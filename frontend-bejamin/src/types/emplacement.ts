export interface Emplacement {
  id: number;
  nom: string;
  id_zone: number;
  zone?: { id: number; nom: string; ville?: { id: number; nom: string } | null } | null;
  description: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface EmplacementFormData {
  nom: string;
  id_zone: string;
  description: string;
  actif: boolean;
}

export interface EmplacementListResponse {
  success: boolean;
  data: {
    data: Emplacement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface EmplacementResponse {
  success: boolean;
  data: Emplacement;
  message: string;
}
