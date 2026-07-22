import { api } from './api';
import type { DepartementListResponse, DepartementResponse, DepartementFormData } from '../types/departement';

export const departementService = {
  list: (params?: Record<string, string>) =>
    api.get<DepartementListResponse>('/config/departements', { params }),

  get: (id: number) =>
    api.get<DepartementResponse>(`/config/departements/${id}`),

  create: (data: DepartementFormData) =>
    api.post<DepartementResponse>('/config/departements', data),

  update: (id: number, data: Partial<DepartementFormData>) =>
    api.put<DepartementResponse>(`/config/departements/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/departements/${id}`),

  toggle: (id: number) =>
    api.patch<DepartementResponse>(`/config/departements/${id}/toggle`),

  getVilles: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/villes', { params }),
};
