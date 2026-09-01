import { api } from './api';
import type { ControleLivraisonListResponse, ControleLivraisonResponse } from '../types/controle-livraison';

export const controleLivraisonService = {
  list: (params?: Record<string, string>) =>
    api.get<ControleLivraisonListResponse>('/config/controles-livraison', { params }),

  get: (id: number) =>
    api.get<ControleLivraisonResponse>(`/config/controles-livraison/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ControleLivraisonResponse>('/config/controles-livraison', data),

  createBulk: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; data: unknown[]; message: string }>('/config/controles-livraison/bulk', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ControleLivraisonResponse>(`/config/controles-livraison/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/controles-livraison/${id}`),
};
