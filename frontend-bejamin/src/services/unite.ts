import { api } from './api';
import type { UniteListResponse, UniteResponse, UniteFormData } from '../types/unite';

export const uniteService = {
  list: (params?: Record<string, string>) =>
    api.get<UniteListResponse>('/config/unites', { params }),

  get: (id: number) =>
    api.get<UniteResponse>(`/config/unites/${id}`),

  create: (data: UniteFormData) =>
    api.post<UniteResponse>('/config/unites', data),

  update: (id: number, data: Partial<UniteFormData>) =>
    api.put<UniteResponse>(`/config/unites/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/unites/${id}`),

  toggle: (id: number) =>
    api.patch<UniteResponse>(`/config/unites/${id}/toggle`),
};
