export interface LigneFicheTechnique {
  id: number;
  id_fiche_technique: number;
  id_produit_ingredient: number;
  ingredient?: { id: number; nom: string; code_article: string } | null;
  quantite_ingredient: number;
  id_unite: number;
  unite?: { id: number; nom: string; symbole: string } | null;
  prix_unitaire: number;
  cout_total: number;
  commentaire: string | null;
}

export interface FicheTechnique {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  id_produit_fini: number;
  produitFini?: { id: number; nom: string; code_article: string } | null;
  rendement: number;
  id_ville: number;
  ville?: { id: number; nom: string } | null;
  cout_total: number;
  cout_unitaire: number;
  actif: boolean;
  lignes?: LigneFicheTechnique[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FicheTechniqueFormData {
  code: string;
  nom: string;
  description: string;
  id_produit_fini: string;
  rendement: string;
  id_ville: string;
  lignes: Array<{
    id_produit_ingredient: string;
    quantite_ingredient: string;
    id_unite: string;
    commentaire: string;
  }>;
}

export interface FicheTechniqueListResponse {
  success: boolean;
  data: {
    data: FicheTechnique[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface FicheTechniqueResponse {
  success: boolean;
  data: FicheTechnique;
  message: string;
}

export interface EntreeRecettePayload {
  id_fiche_technique: number;
  quantite_produite: number;
  id_ville: number;
  id_zone: number;
  id_emplacement?: number;
  date_production: string;
  commentaire?: string;
}

export interface EntreeRecetteResponse {
  success: boolean;
  data: {
    fiche_technique: FicheTechnique;
    lot: { id: number; numero_lot: string; quantite_disponible: number };
    cout_total: number;
    cout_unitaire: number;
  };
  message: string;
}
