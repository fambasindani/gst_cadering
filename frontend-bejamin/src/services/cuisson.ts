import { api } from './api';
import type { CuissonListResponse, CuissonResponse } from '../types/cuisson';

export const cuissonService = {
  list: (params?: Record<string, string>) =>
    api.get<CuissonListResponse>('/config/cuissons', { params }),

  get: (id: number) =>
    api.get<CuissonResponse>(`/config/cuissons/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<CuissonResponse>('/config/cuissons', data),

  createBulk: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; data: unknown[]; message: string }>('/config/cuissons/bulk', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<CuissonResponse>(`/config/cuissons/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/cuissons/${id}`),
};
