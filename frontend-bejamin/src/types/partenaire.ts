export interface Partenaire {
  id: number;
  type: 'fournisseur' | 'client' | 'both';
  type_client: 'aerien' | 'non_aerien' | 'both' | null;
  code_iata: string | null;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  identifiant_fiscal: string | null;
  id_magasin: number | null;
  magasin?: { id: number; nom: string } | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PartenaireFormData {
  type: string;
  type_client: string;
  code_iata: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  identifiant_fiscal: string;
  id_magasin: string;
  actif: boolean;
}

export interface PartenaireResponse {
  success: boolean;
  data: Partenaire;
  message: string;
}

export interface PartenaireListResponse {
  success: boolean;
  data: Partenaire[];
  message: string;
}

export interface PartenairePaginatedResponse {
  success: boolean;
  data: {
    data: Partenaire[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface Magasin {
  id: number;
  nom: string;
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
