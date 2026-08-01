export interface Lot {
  id: number;
  id_produit: number;
  produit?: { id: number; nom: string; code_article: string } | null;
  id_magasin: number;
  magasin?: { id: number; nom: string } | null;
  numero_lot: string;
  code_qr: string | null;
  quantite_recue: number;
  quantite_disponible: number;
  date_fabrication: string | null;
  date_peremption: string;
  date_reception: string;
  id_partenaire: number | null;
  partenaire?: { id: number; nom: string } | null;
  prix_achat_ht_unitaire: number | null;
  id_devise: number | null;
  devise?: { id: number; code: string; nom: string; symbole: string } | null;
  valide_par: number | null;
  date_validation: string | null;
  statut_validation: 'EN ATTENTE' | 'VALIDÉ' | 'REJETÉ';
  commentaire: string | null;
}

export interface LotListResponse {
  success: boolean;
  data: {
    data: Lot[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface LotResponse {
  success: boolean;
  data: Lot;
  message: string;
}
