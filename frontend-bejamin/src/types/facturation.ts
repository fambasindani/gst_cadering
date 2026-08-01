export interface Avoir {
  id: number;
  numero_avoir: string;
  date_avoir: string;
  id_partenaire_client: number;
  client?: PartenaireInfo | null;
  id_retour: number;
  retour?: { id: number; numero_retour: string } | null;
  id_devise: number;
  devise?: { id: number; code: string; nom: string; symbole: string } | null;
  montant_ht: number;
  id_utilisateur: number | null;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  commentaire: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PartenaireInfo {
  id: number;
  nom: string;
  code_partenaire?: string;
}

export interface AvoirFormData {
  numero_avoir: string;
  date_avoir: string;
  id_partenaire_client: string;
  id_retour: string;
  id_devise: string;
  montant_ht: string;
  commentaire: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
