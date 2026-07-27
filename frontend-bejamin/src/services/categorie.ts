import { api } from './api';
import type { CategorieListResponse, CategorieResponse, CategorieFormData } from '../types/categorie';

export const categorieService = {
  list: (params?: Record<string, string>) =>
    api.get<CategorieListResponse>('/config/categories', { params }),

  get: (id: number) =>
    api.get<CategorieResponse>(`/config/categories/${id}`),

  create: (data: CategorieFormData) =>
    api.post<CategorieResponse>('/config/categories', data),

  update: (id: number, data: Partial<CategorieFormData>) =>
    api.put<CategorieResponse>(`/config/categories/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/categories/${id}`),

  toggle: (id: number) =>
    api.patch<CategorieResponse>(`/config/categories/${id}/toggle`),
};
