import { api } from './api';
import type { FicheTechniqueListResponse, FicheTechniqueResponse } from '../types/fiche-technique';

export const ficheTechniqueService = {
  list: (params?: Record<string, string>) =>
    api.get<FicheTechniqueListResponse>('/config/fiches-technique', { params }),

  get: (id: number) =>
    api.get<FicheTechniqueResponse>(`/config/fiches-technique/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<FicheTechniqueResponse>('/config/fiches-technique', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<FicheTechniqueResponse>(`/config/fiches-technique/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/fiches-technique/${id}`),

  toggle: (id: number) =>
    api.patch<{ success: boolean; message: string }>(`/config/fiches-technique/${id}/toggle`),

  duplicate: (id: number) =>
    api.post<FicheTechniqueResponse>(`/config/fiches-technique/${id}/duplicate`),

  calculateCost: (id: number) =>
    api.get<{ success: boolean; data: { cout_total: number; cout_unitaire: number }; message: string }>(`/config/fiches-technique/${id}/calculate-cost`),
};
