import { api } from './api';
import type { AtelierListResponse, AtelierResponse } from '../types/atelier';

export const atelierService = {
  list: (params?: Record<string, string>) =>
    api.get<AtelierListResponse>('/config/ateliers', { params }),

  get: (id: number) =>
    api.get<AtelierResponse>(`/config/ateliers/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<AtelierResponse>('/config/ateliers', data),

  createBulk: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; data: unknown[]; message: string }>('/config/ateliers/bulk', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<AtelierResponse>(`/config/ateliers/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/ateliers/${id}`),
};
