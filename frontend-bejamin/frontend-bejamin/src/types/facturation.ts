export interface LigneDevis {
  id: number;
  id_devis: number;
  id_produit: number;
  produit?: { id: number; nom: string; code_article: string } | null;
  quantite: number;
  prix_unitaire_ht: number;
  remise: number;
  montant_ht?: number;
}

export interface Devis {
  id: number;
  numero_devis: string;
  date_devis: string;
  date_validite: string | null;
  id_partenaire_client: number;
  client?: PartenaireInfo | null;
  id_ville: number;
  ville?: { id: number; nom: string } | null;
  id_devise: number;
  devise?: { id: number; code: string; nom: string; symbole: string } | null;
  montant_ht: number;
  id_utilisateur: number | null;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  statut: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'TRANSFORME_EN_COMMANDE';
  commentaire: string | null;
  lignes?: LigneDevis[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface LigneFacture {
  id: number;
  id_facture: number;
  id_produit: number;
  produit?: { id: number; nom: string; code_article: string } | null;
  id_lot: number | null;
  lot?: { id: number; numero_lot: string } | null;
  quantite: number;
  prix_unitaire_ht: number;
  remise: number;
  montant_ht?: number;
}

export interface Facture {
  id: number;
  numero_facture: string;
  date_facture: string;
  date_echeance: string;
  id_partenaire_client: number;
  client?: PartenaireInfo | null;
  id_bon_commande: number | null;
  bon_commande?: { id: number; numero_commande: string } | null;
  id_ville: number;
  ville?: { id: number; nom: string } | null;
  id_devise: number;
  devise?: { id: number; code: string; nom: string; symbole: string } | null;
  montant_ht: number;
  montant_ttc: number;
  id_utilisateur: number | null;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  statut: 'BROUILLON' | 'EMISE' | 'PAYEE' | 'ANNULEE';
  commentaire: string | null;
  lignes?: LigneFacture[];
  paiements?: Paiement[];
  avoirs?: Avoir[];
  solde?: number;
  total_paye?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Paiement {
  id: number;
  id_facture: number;
  facture?: { id: number; numero_facture: string; client?: PartenaireInfo } | null;
  montant: number;
  date_paiement: string;
  mode_paiement: 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'CARTE' | 'AUTRE';
  reference: string | null;
  id_utilisateur: number | null;
  utilisateur?: { id: number; nom: string; prenom: string } | null;
  commentaire: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Avoir {
  id: number;
  numero_avoir: string;
  date_avoir: string;
  id_partenaire_client: number;
  client?: PartenaireInfo | null;
  id_facture_origine: number | null;
  facture_origine?: { id: number; numero_facture: string } | null;
  id_retour: number | null;
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

export interface DevisFormData {
  numero_devis: string;
  date_devis: string;
  date_validite: string;
  id_partenaire_client: string;
  id_ville: string;
  id_devise: string;
  commentaire: string;
  lignes: Array<{
    id_produit: string;
    quantite: string;
    prix_unitaire_ht: string;
    remise: string;
  }>;
}

export interface FactureFormData {
  numero_facture: string;
  date_facture: string;
  date_echeance: string;
  id_partenaire_client: string;
  id_bon_commande: string;
  id_ville: string;
  id_devise: string;
  commentaire: string;
  lignes: Array<{
    id_produit: string;
    quantite: string;
    prix_unitaire_ht: string;
    remise: string;
    id_lot: string;
  }>;
}

export interface PaiementFormData {
  id_facture: string;
  montant: string;
  date_paiement: string;
  mode_paiement: string;
  reference: string;
  commentaire: string;
}

export interface AvoirFormData {
  numero_avoir: string;
  date_avoir: string;
  id_partenaire_client: string;
  id_facture_origine: string;
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
