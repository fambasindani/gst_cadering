import { api } from './api';
import type { Tracabilite, TracabiliteListResponse, TracabiliteResponse } from '../types/tracabilite';

export const tracabiliteService = {
  list: (params?: Record<string, string>) =>
    api.get<TracabiliteListResponse>('/config/tracabilites', { params }),

  get: (id: number) =>
    api.get<TracabiliteResponse>(`/config/tracabilites/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<TracabiliteResponse>('/config/tracabilites', data),

  createMultiple: (data: {
    id_departement?: number | null;
    id_partenaire?: number | null;
    date_tracabilite: string;
    lignes: Array<{ id_lot: number; quantite: number; commentaire?: string }>;
  }) =>
    api.post<{ success: boolean; data: Tracabilite[]; message: string }>('/config/tracabilites/bulk', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<TracabiliteResponse>(`/config/tracabilites/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/tracabilites/${id}`),
};
