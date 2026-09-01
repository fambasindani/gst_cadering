export interface ControleLivraison {
  id: number;
  id_utilisateur: number;
  id_partenaire: number | null;
  id_lot: number | null;
  date_operation: string;
  cie_numero_vol: string;
  camion_propre: boolean | null;
  heure_debut: string;
  heure_fin: string;
  code_prestation_classe: string;
  code_couleur: string;
  final_holding_temperature: number | null;
  reception_client_temperature: number | null;
  commentaires: string;
  nom_signature_superviseur: string;
  nom_signature_responsable_client: string;
  remarque_generale: string;
  created_at: string;
  updated_at: string;
  utilisateur?: { id: number; full_name: string } | null;
  partenaire?: { id: number; nom: string; code_iata?: string } | null;
  lot?: {
    id: number;
    numero_lot: string;
    produit?: { id: number; nom: string; code_article: string } | null;
  } | null;
}

export interface ControleLivraisonFormData {
  date_operation: string;
  id_partenaire: string;
  id_lot: string;
  cie_numero_vol: string;
  camion_propre: string;
  heure_debut: string;
  heure_fin: string;
  code_prestation_classe: string;
  code_couleur: string;
  final_holding_temperature: string;
  reception_client_temperature: string;
  commentaires: string;
  nom_signature_superviseur: string;
  nom_signature_responsable_client: string;
  remarque_generale: string;
}

export interface ControleLivraisonListResponse {
  success: boolean;
  data: {
    data: ControleLivraison[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface ControleLivraisonResponse {
  success: boolean;
  data: ControleLivraison;
  message: string;
}
