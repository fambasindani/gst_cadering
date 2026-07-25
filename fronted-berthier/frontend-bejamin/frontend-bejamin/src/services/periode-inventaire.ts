import { api } from './api';
import type { PeriodeInventaireListResponse, PeriodeInventaireResponse } from '../types/validation';

export const periodeInventaireService = {
  list: (params?: Record<string, string>) =>
    api.get<PeriodeInventaireListResponse>('/config/periodes-inventaire', { params }),

  get: (id: number) =>
    api.get<PeriodeInventaireResponse>(`/config/periodes-inventaire/${id}`),

  create: (data: Record<string, string>) =>
    api.post<PeriodeInventaireResponse>('/config/periodes-inventaire', data),

  update: (id: number, data: Record<string, string>) =>
    api.put<PeriodeInventaireResponse>(`/config/periodes-inventaire/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/periodes-inventaire/${id}`),

  start: (id: number) =>
    api.patch<PeriodeInventaireResponse>(`/config/periodes-inventaire/${id}/start`),

  close: (id: number) =>
    api.patch<PeriodeInventaireResponse>(`/config/periodes-inventaire/${id}/close`),
};
