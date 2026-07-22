export interface Departement {
  id: number;
  nom: string;
  code: string | null;
  id_ville: number;
  ville?: { id: number; nom: string } | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DepartementFormData {
  nom: string;
  code: string;
  id_ville: string;
  actif: boolean;
}

export interface DepartementListResponse {
  success: boolean;
  data: {
    data: Departement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface DepartementResponse {
  success: boolean;
  data: Departement;
  message: string;
}
