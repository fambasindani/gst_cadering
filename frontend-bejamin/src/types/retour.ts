export interface LigneRetour {
  id: number;
  id_retour: number;
  id_lot: number;
  lot?: { id: number; numero_lot: string; quantite_disponible: number; produit?: { id: number; nom: string; code_article: string } | null } | null;
  quantite_retournee: number;
  motif: string | null;
}

export interface Retour {
  id: number;
  numero_retour: string;
  date_retour: string;
  id_partenaire_client: number | null;
  partenaire_client?: { id: number; nom: string } | null;
  id_partenaire_dest: number | null;
  partenaire_dest?: { id: number; nom: string } | null;
  id_magasin: number;
  magasin?: { id: number; nom: string } | null;
  id_utilisateur: number;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  commentaire: string | null;
  valide_par?: { id: number; nom: string; prenom: string } | null;
  date_validation: string | null;
  statut_validation: 'EN ATTENTE' | 'VALIDÉ' | 'REJETÉ';
  lignes?: LigneRetour[];
}

export interface RetourFormData {
  numero_retour: string;
  date_retour: string;
  id_partenaire_client: string;
  id_partenaire_dest: string;
  id_magasin: string;
  commentaire: string;
  lignes: Array<{
    id_lot: string;
    quantite_retournee: string;
    motif: string;
  }>;
}

export interface RetourListResponse {
  success: boolean;
  data: {
    data: Retour[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface RetourResponse {
  success: boolean;
  data: Retour;
  message: string;
}
