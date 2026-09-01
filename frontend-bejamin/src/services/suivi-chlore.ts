import { api } from './api';
import type { SuiviChloreListResponse, SuiviChloreResponse } from '../types/suivi-chlore';

export const suiviChloreService = {
  list: (params?: Record<string, string>) =>
    api.get<SuiviChloreListResponse>('/config/suivis-chlore', { params }),

  get: (id: number) =>
    api.get<SuiviChloreResponse>(`/config/suivis-chlore/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<SuiviChloreResponse>('/config/suivis-chlore', data),

  createBulk: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; data: unknown[]; message: string }>('/config/suivis-chlore/bulk', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<SuiviChloreResponse>(`/config/suivis-chlore/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/suivis-chlore/${id}`),
};
