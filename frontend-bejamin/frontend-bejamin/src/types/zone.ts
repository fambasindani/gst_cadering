export interface Zone {
  id: number;
  nom: string;
  id_ville: number;
  ville?: { id: number; nom: string } | null;
  type_zone: 'production' | 'stockage' | 'service' | 'hygiene';
  description: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ZoneFormData {
  nom: string;
  id_ville: string;
  type_zone: string;
  description: string;
  actif: boolean;
}

export interface ZoneListResponse {
  success: boolean;
  data: {
    data: Zone[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface ZoneResponse {
  success: boolean;
  data: Zone;
  message: string;
}

export interface Ville {
  id: number;
  nom: string;
}
