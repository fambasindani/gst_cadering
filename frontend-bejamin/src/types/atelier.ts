export interface AtelierTracabilite {
  id: number;
  id_utilisateur: number;
  id_partenaire: number | null;
  id_lot: number | null;
  type_atelier: 'DRESSAGE' | 'MONTAGE';
  date_operation: string;
  temperature_atelier: number | null;
  code_prestation: string;
  quantite: string;
  produits_utilises: string;
  code_couleur_produit_dlc: string;
  cycle_classe: string;
  heure_debut: string;
  temperature_surface_debut: number | null;
  heure_fin: string;
  temperature_surface_fin: number | null;
  action_corrective: string;
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

export interface AtelierFormData {
  type_atelier: string;
  date_operation: string;
  id_partenaire: string;
  id_lot: string;
  temperature_atelier: string;
  code_prestation: string;
  quantite: string;
  produits_utilises: string;
  code_couleur_produit_dlc: string;
  cycle_classe: string;
  heure_debut: string;
  temperature_surface_debut: string;
  heure_fin: string;
  temperature_surface_fin: string;
  action_corrective: string;
}

export interface AtelierListResponse {
  success: boolean;
  data: {
    data: AtelierTracabilite[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface AtelierResponse {
  success: boolean;
  data: AtelierTracabilite;
  message: string;
}
