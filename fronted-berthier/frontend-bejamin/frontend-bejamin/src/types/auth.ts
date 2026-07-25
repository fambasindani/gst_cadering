export interface Role {
  id: number;
  nom: string;
  description?: string;
  actif: boolean;
}

export interface Ville {
  id: number;
  nom: string;
}

export interface Departement {
  id: number;
  nom: string;
}

export interface Zone {
  id: number;
  nom: string;
}

export interface Emplacement {
  id: number;
  nom: string;
}

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  full_name: string;
  role: Role;
  ville: Ville;
  departement: Departement;
  zone: Zone | null;
  emplacement: Emplacement | null;
  permissions: string[];
  actif: boolean;
  derniere_connexion?: string | null;
}

export interface LoginRequest {
  email: string;
  mot_de_passe: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    utilisateur: Utilisateur;
    token: string;
    token_type: string;
  };
  message: string;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}

export interface Permission {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UtilisateurFormData {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe?: string;
  mot_de_passe_confirmation?: string;
  id_role: string;
  id_ville: string;
  id_departement: string;
  id_zone: string;
  id_emplacement: string;
  actif: boolean;
}

export interface RoleFormData {
  nom: string;
  description: string;
  actif: boolean;
  permissions: number[];
}

export interface PermissionFormData {
  nom: string;
  code: string;
  description: string;
  actif: boolean;
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
