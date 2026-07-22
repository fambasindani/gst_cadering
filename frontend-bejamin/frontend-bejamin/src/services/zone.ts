import { api } from './api';
import type { ZoneListResponse, ZoneResponse, ZoneFormData } from '../types/zone';

export const zoneService = {
  list: (params?: Record<string, string>) =>
    api.get<ZoneListResponse>('/config/zones', { params }),

  get: (id: number) =>
    api.get<ZoneResponse>(`/config/zones/${id}`),

  create: (data: ZoneFormData) =>
    api.post<ZoneResponse>('/config/zones', data),

  update: (id: number, data: Partial<ZoneFormData>) =>
    api.put<ZoneResponse>(`/config/zones/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/zones/${id}`),

  toggle: (id: number) =>
    api.patch<ZoneResponse>(`/config/zones/${id}/toggle`),

  getVilles: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/villes', { params }),
};
