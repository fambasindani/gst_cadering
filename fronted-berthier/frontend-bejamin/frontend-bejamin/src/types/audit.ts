export interface Audit {
  id: number;
  id_utilisateur: number;
  action: string;
  table_cible: string;
  id_enregistrement: number | null;
  anciennes_valeurs: Record<string, unknown> | null;
  nouvelles_valeurs: Record<string, unknown> | null;
  date_action: string;
  adresse_ip: string;
  user_agent: string | null;
  route: string | null;
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
}

export interface AuditStats {
  total_audits: number;
  par_action: { action: string; total: number }[];
  par_table: { table_cible: string; total: number }[];
}

export interface AuditTable {
  table_cible: string;
  total: number;
}

export interface AuditAction {
  action: string;
  total: number;
}
