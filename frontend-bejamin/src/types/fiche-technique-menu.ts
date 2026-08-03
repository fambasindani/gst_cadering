export interface FicheTechniqueMenuItemData {
  id: number;
  id_partie: number;
  id_fiche_technique: number | null;
  fiche_technique?: { id: number; code: string; nom: string; cout_unitaire: number; rendement: number } | null;
  id_produit: number | null;
  produit?: { id: number; code_article: string; nom: string; prix_unitaire?: number; unite?: { id: number; nom: string; symbole: string } | null } | null;
  designation: string | null;
  pourcentage: number;
  ordre: number;
}

export interface FicheTechniqueMenuPartieData {
  id: number;
  id_fiche_technique_menu: number;
  nom: string;
  ordre: number;
  items?: FicheTechniqueMenuItemData[];
}

export interface FicheTechniqueMenu {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  cycle: string | null;
  periodicite: string | null;
  validite: string | null;
  id_partenaire: number | null;
  partenaire?: { id: number; nom: string } | null;
  id_magasin: number;
  magasin?: { id: number; nom: string } | null;
  actif: boolean;
  nombre_parties?: number;
  parties?: FicheTechniqueMenuPartieData[];
  created_at?: string;
  updated_at?: string;
}

export interface FicheTechniqueMenuFormData {
  code: string;
  nom: string;
  description: string;
  cycle: string;
  periodicite: string;
  validite: string;
  id_partenaire: string;
  id_magasin: string;
  actif: boolean;
  items: Array<{
    nom_partie: string;
    id_fiche_technique: number | null;
    id_produit: number | null;
    pourcentage: number;
  }>;
}

export interface FicheTechniqueMenuListResponse {
  success: boolean;
  data: {
    data: FicheTechniqueMenu[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface FicheTechniqueMenuResponse {
  success: boolean;
  data: FicheTechniqueMenu;
  message: string;
}

export interface RapportComposant {
  id_produit: number | null;
  code_article: string | null;
  nom: string;
  unite: string;
  rendement: number;
  quantiteParPortion: number;
  quantiteTotale: number;
  prixUnitaire: number;
  coutTotal: number;
}

export interface RapportItem {
  id: number;
  designation: string;
  code: string;
  type?: 'recette' | 'produit';
  pourcentage: number;
  coutParPassager: number;
  coutTotal: number;
  composants: RapportComposant[];
}

export interface RapportPartie {
  id: number;
  nom: string;
  ordre: number;
  items: RapportItem[];
}

export interface RapportArticle {
  id_produit: number;
  code_article: string | null;
  nom: string;
  unite: string;
  quantiteTotale: number;
  prixUnitaire: number;
  coutTotal: number;
}

export interface EntreeFicheTechnique {
  id: number;
  id_fiche_technique_menu: number;
  id_partenaire: number;
  nombre_passagers: number;
  date_rapport: string;
  commentaire: string | null;
  id_utilisateur: number | null;
  menu?: FicheTechniqueMenu | null;
  partenaire?: { id: number; nom: string } | null;
  utilisateur?: { id: number; nom: string } | null;
  created_at?: string;
}

export interface RapportFicheTechniqueData {
  rapport: EntreeFicheTechnique;
  menu: FicheTechniqueMenu;
  parties: RapportPartie[];
  totalArticles: RapportArticle[];
  coutTotalFiche: number;
  coutParPassagerTotal: number;
}

export interface RapportFicheTechniqueResponse {
  success: boolean;
  data: RapportFicheTechniqueData;
  message: string;
}

export interface EntreeFicheTechniqueListResponse {
  success: boolean;
  data: {
    data: EntreeFicheTechnique[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface RapportPayload {
  id_fiche_technique_menu: number;
  id_partenaire: number;
  nombre_passagers: number;
  date_rapport: string;
  commentaire?: string;
}
