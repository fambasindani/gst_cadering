import { api } from './api';
import type {
  FicheTechniqueMenuListResponse,
  FicheTechniqueMenuResponse,
  FicheTechniqueMenu,
} from '../types/fiche-technique-menu';

export const ficheTechniqueMenuService = {
  list: (params?: Record<string, string>) =>
    api.get<FicheTechniqueMenuListResponse>('/config/fiches-technique-menu', { params }),

  get: (id: number) =>
    api.get<FicheTechniqueMenuResponse>(`/config/fiches-technique-menu/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<FicheTechniqueMenuResponse>('/config/fiches-technique-menu', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<FicheTechniqueMenuResponse>(`/config/fiches-technique-menu/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/fiches-technique-menu/${id}`),

  toggle: (id: number) =>
    api.patch<{ success: boolean; data: FicheTechniqueMenu; message: string }>(`/config/fiches-technique-menu/${id}/toggle`),
};
