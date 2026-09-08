import { api } from './api';
import type { ParametreListResponse, ParametreResponse, ParametreFormData } from '../types/parametre';

export const parametreService = {
  list: (params?: Record<string, string>) =>
    api.get<ParametreListResponse>('/config/parametres', { params }),

  get: (id: number) =>
    api.get<ParametreResponse>(`/config/parametres/${id}`),

  create: (data: ParametreFormData) =>
    api.post<ParametreResponse>('/config/parametres', data),

  update: (id: number, data: Partial<ParametreFormData>) =>
    api.put<ParametreResponse>(`/config/parametres/${id}`, data),

  updateByCle: (cle: string, data: { valeur: string }) =>
    api.put<ParametreResponse>(`/config/parametres/${cle}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/parametres/${id}`),

  toggle: (id: number) =>
    api.patch<ParametreResponse>(`/config/parametres/${id}/toggle`),
};
