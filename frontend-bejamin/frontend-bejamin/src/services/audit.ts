import { api } from './api';
import type { Audit, AuditStats, AuditTable, AuditAction } from '../types/audit';

interface ListResponse {
  success: boolean;
  data: {
    data: Audit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

interface SingleResponse {
  success: boolean;
  data: Audit;
  message: string;
}

export const auditService = {
  list: (params?: Record<string, string>) =>
    api.get<ListResponse>('/audits', { params }),

  get: (id: number) =>
    api.get<SingleResponse>(`/audits/${id}`),

  statistiques: () =>
    api.get<{ success: boolean; data: AuditStats; message: string }>('/audits/statistiques'),

  byTable: (table: string, params?: Record<string, string>) =>
    api.get<ListResponse>(`/audits/table/${table}`, { params }),

  byUtilisateur: (utilisateurId: number, params?: Record<string, string>) =>
    api.get<ListResponse>(`/audits/utilisateur/${utilisateurId}`, { params }),

  tables: () =>
    api.get<{ success: boolean; data: AuditTable[]; message: string }>('/audits/tables/liste'),

  actions: () =>
    api.get<{ success: boolean; data: AuditAction[]; message: string }>('/audits/actions/liste'),
};
