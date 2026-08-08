export interface BonCommande {
  id: number;
  numero_commande: string;
  id_partenaire: number;
  partenaire?: { id: number; nom: string } | null;
  id_magasin_destination: number;
  magasin_destination?: { id: number; nom: string } | null;
  date_commande: string;
  date_livraison_prevue: string | null;
  statut: 'BROUILLON' | 'ENVOYÉ' | 'REÇU PARTIELLEMENT' | 'REÇU' | 'CLOTURE';
  montant_total_ht: number;
  id_devise: number | null;
  devise?: { id: number; code: string; nom: string; symbole: string } | null;
  id_utilisateur: number | null;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  commentaire: string | null;
  valide_par?: { id: number; nom: string; prenom: string } | null;
  date_validation: string | null;
  statut_validation: 'EN ATTENTE' | 'VALIDÉ' | 'REJETÉ';
  lignes?: LigneCommande[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  montant_actuel?: number;
  receptions_liste?: ReceptionListe[];
}

export interface LigneCommande {
  id: number;
  id_bon_commande: number;
  id_produit: number;
  produit?: { id: number; nom: string; code_article: string } | null;
  quantite_commandee: number;
  prix_unitaire_ht: number;
  id_devise: number;
  devise?: { id: number; code: string; nom: string; symbole: string } | null;
  quantite_recue: number;
  prix_actuel?: number;
  montant_recu?: number;
  receptions?: Array<{
    id: number;
    reference_reception: string | null;
    date: string | null;
    numero_lot: string;
    quantite: number;
    prix_unitaire: number;
    montant: number;
    statut: string;
  }>;
}

export interface ReceptionLigne {
  id: number;
  date: string | null;
  id_ligne: number;
  produit: string;
  code_article: string;
  numero_lot: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  statut: string;
}

export interface ReceptionListe {
  reference_reception: string;
  date: string | null;
  quantite: number;
  montant: number;
  lignes: ReceptionLigne[];
}

export interface BonCommandeFormData {
  numero_commande: string;
  id_partenaire: string;
  id_magasin_destination: string;
  date_commande: string;
  date_livraison_prevue: string;
  id_devise: string;
  commentaire: string;
  lignes: Array<{
    id_produit: string;
    quantite_commandee: string;
    prix_unitaire_ht: string;
    id_devise: string;
  }>;
}

export interface BonCommandeListResponse {
  success: boolean;
  data: {
    data: BonCommande[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface BonCommandeResponse {
  success: boolean;
  data: BonCommande;
  message: string;
}
