import { api } from './api';
import type { MagasinListResponse, MagasinResponse, MagasinFormData } from '../types/magasin';

export const magasinService = {
  list: (params?: Record<string, string>) =>
    api.get<MagasinListResponse>('/config/magasins', { params }),

  get: (id: number) =>
    api.get<MagasinResponse>(`/config/magasins/${id}`),

  create: (data: MagasinFormData) =>
    api.post<MagasinResponse>('/config/magasins', data),

  update: (id: number, data: Partial<MagasinFormData>) =>
    api.put<MagasinResponse>(`/config/magasins/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/magasins/${id}`),

  toggle: (id: number) =>
    api.patch<MagasinResponse>(`/config/magasins/${id}/toggle`),
};
