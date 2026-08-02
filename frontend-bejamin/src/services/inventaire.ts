import { api } from './api';
import type { InventaireListResponse, InventaireResponse, InventaireResumeResponse, AjustementResponse, MiseAJourStockResponse, InventaireCreateMultipleResponse } from '../types/validation';

export const inventaireService = {
  list: (params?: Record<string, string>) =>
    api.get<InventaireListResponse>('/config/inventaires', { params }),

  get: (id: number) =>
    api.get<InventaireResponse>(`/config/inventaires/${id}`),

  create: (data: Record<string, string | number>) =>
    api.post<InventaireResponse>('/config/inventaires', data),

  createMultiple: (data: Record<string, unknown>) =>
    api.post<InventaireCreateMultipleResponse>('/config/inventaires/bulk', data),

  update: (id: number, data: Record<string, string | number>) =>
    api.put<InventaireResponse>(`/config/inventaires/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/inventaires/${id}`),

  resume: (periodeId: number) =>
    api.get<InventaireResumeResponse>(`/config/inventaires/periodes/${periodeId}/resume`),

  generateAjustements: (periodeId: number) =>
    api.post<AjustementResponse>(`/config/inventaires/periodes/${periodeId}/generer-ajustements`),

  mettreAJourStock: (periodeId: number) =>
    api.post<MiseAJourStockResponse>(`/config/inventaires/periodes/${periodeId}/mettre-a-jour-stock`),
};
