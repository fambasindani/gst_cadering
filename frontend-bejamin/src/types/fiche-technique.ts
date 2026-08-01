export interface LigneFicheTechnique {
  id: number;
  id_fiche_technique: number;
  id_produit_ingredient: number;
  ingredient?: { id: number; nom: string; code_article: string } | null;
  id_unite: number;
  unite?: { id: number; nom: string; symbole: string } | null;
  rendement: number;
  prix_unitaire: number;
  poids_net: number;
  poids_brut: number;
  cout_total: number;
  rendement_apres_cuisson: boolean;
  commentaire: string | null;
}

export interface FicheTechnique {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  id_produit_fini: number | null;
  produitFini?: { id: number; nom: string; code_article: string } | null;
  rendement: number;
  poids_portion: number;
  unite_poids_portion: string;
  id_magasin: number;
  magasin?: { id: number; nom: string } | null;
  cout_total: number;
  cout_unitaire: number;
  prix_kg: number;
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
  rendement: string;
  poids_portion: string;
  unite_poids_portion: string;
  id_magasin: string;
  lignes: Array<{
    id_produit_ingredient: string;
    id_unite: string;
    rendement: string;
    poids_net: string;
    poids_brut: string;
    rendement_apres_cuisson: boolean;
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
  id_partenaire: number;
  nombre_passages: number;
  date_production: string;
  commentaire?: string;
}

export interface EntreeRecette {
  id: number;
  id_fiche_technique: number;
  id_partenaire: number;
  nombre_passages: number;
  date_production: string;
  commentaire: string | null;
  id_utilisateur: number | null;
  fiche_technique?: FicheTechnique | null;
  partenaire?: { id: number; nom: string } | null;
  created_at?: string;
}

export interface EntreeRecetteResponse {
  success: boolean;
  data: {
    recette: EntreeRecette;
    fiche_technique: FicheTechnique;
    nombre_passages: number;
    cout_total: number;
    cout_unitaire: number;
  };
  message: string;
}

export interface EntreeRecetteListResponse {
  success: boolean;
  data: {
    data: EntreeRecette[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}
