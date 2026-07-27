import { api } from './api';
import type { VilleListResponse, VilleResponse, VilleFormData } from '../types/ville';

export const villeService = {
  list: (params?: Record<string, string>) =>
    api.get<VilleListResponse>('/config/villes', { params }),

  get: (id: number) =>
    api.get<VilleResponse>(`/config/villes/${id}`),

  create: (data: VilleFormData) =>
    api.post<VilleResponse>('/config/villes', data),

  update: (id: number, data: Partial<VilleFormData>) =>
    api.put<VilleResponse>(`/config/villes/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/villes/${id}`),

  toggle: (id: number) =>
    api.patch<VilleResponse>(`/config/villes/${id}/toggle`),
};
