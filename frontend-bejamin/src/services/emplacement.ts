import { api } from './api';
import type { EmplacementListResponse, EmplacementResponse, EmplacementFormData } from '../types/emplacement';

export const emplacementService = {
  list: (params?: Record<string, string>) =>
    api.get<EmplacementListResponse>('/config/emplacements', { params }),

  get: (id: number) =>
    api.get<EmplacementResponse>(`/config/emplacements/${id}`),

  create: (data: EmplacementFormData) =>
    api.post<EmplacementResponse>('/config/emplacements', data),

  update: (id: number, data: Partial<EmplacementFormData>) =>
    api.put<EmplacementResponse>(`/config/emplacements/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/emplacements/${id}`),

  toggle: (id: number) =>
    api.patch<EmplacementResponse>(`/config/emplacements/${id}/toggle`),

  getZones: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/zones', { params }),
};
