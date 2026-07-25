import { api } from './api';
import type { MouvementStockListResponse, MouvementStockResponse } from '../types/validation';

export const mouvementStockService = {
  list: (params?: Record<string, string>) =>
    api.get<MouvementStockListResponse>('/config/mouvements', { params }),

  get: (id: number) =>
    api.get<MouvementStockResponse>(`/config/mouvements/${id}`),

  create: (data: Record<string, string | number>) =>
    api.post<{ success: boolean; message: string; data?: MouvementStock }>('/config/mouvements', data),

  update: (id: number, data: Record<string, string | number>) =>
    api.put<{ success: boolean; message: string }>(`/config/mouvements/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/mouvements/${id}`),

  validate: (id: number) =>
    api.patch<MouvementStockResponse>(`/config/mouvements/${id}/valider`),

  reject: (id: number) =>
    api.patch<MouvementStockResponse>(`/config/mouvements/${id}/rejeter`),

  getTypesMouvement: () =>
    api.get<{ success: boolean; data: { id: number; libelle: string; sens: number }[] }>('/config/types-mouvement'),
};
