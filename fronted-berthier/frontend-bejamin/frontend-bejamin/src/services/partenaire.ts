import { api } from './api';
import type { PartenairePaginatedResponse, PartenaireResponse, PartenaireFormData, VilleListResponse } from '../types/partenaire';

export const partenaireService = {
  list: (params?: Record<string, string>) =>
    api.get<PartenairePaginatedResponse>('/config/partenaires', { params }),

  get: (id: number) =>
    api.get<PartenaireResponse>(`/config/partenaires/${id}`),

  create: (data: PartenaireFormData) =>
    api.post<PartenaireResponse>('/config/partenaires', data),

  update: (id: number, data: Partial<PartenaireFormData>) =>
    api.put<PartenaireResponse>(`/config/partenaires/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/partenaires/${id}`),

  toggle: (id: number) =>
    api.patch<PartenaireResponse>(`/config/partenaires/${id}/toggle`),

  getVilles: () =>
    api.get<VilleListResponse>('/config/villes'),
};
