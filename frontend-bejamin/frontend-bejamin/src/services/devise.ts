import { api } from './api';
import type { DeviseListResponse, DeviseResponse, DeviseFormData } from '../types/devise';

export const deviseService = {
  list: (params?: Record<string, string>) =>
    api.get<DeviseListResponse>('/config/devises', { params }),

  get: (id: number) =>
    api.get<DeviseResponse>(`/config/devises/${id}`),

  create: (data: DeviseFormData) =>
    api.post<DeviseResponse>('/config/devises', data),

  update: (id: number, data: Partial<DeviseFormData>) =>
    api.put<DeviseResponse>(`/config/devises/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/devises/${id}`),

  toggle: (id: number) =>
    api.patch<DeviseResponse>(`/config/devises/${id}/toggle`),
};
