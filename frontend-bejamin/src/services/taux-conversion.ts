import { api } from './api';
import type {
  TauxConversionListResponse,
  TauxConversionResponse,
  TauxConversionActuelResponse,
  TauxConversionFormData,
} from '../types/taux-conversion';

export const tauxConversionService = {
  list: (params?: Record<string, string>) =>
    api.get<TauxConversionListResponse>('/config/taux-conversion', { params }),

  get: (id: number) =>
    api.get<TauxConversionResponse>(`/config/taux-conversion/${id}`),

  getActuel: () =>
    api.get<TauxConversionActuelResponse>('/config/taux-conversion/taux-actuel'),

  create: (data: TauxConversionFormData) =>
    api.post<TauxConversionResponse>('/config/taux-conversion', data),

  update: (id: number, data: Partial<TauxConversionFormData>) =>
    api.put<TauxConversionResponse>(`/config/taux-conversion/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/taux-conversion/${id}`),

  toggle: (id: number) =>
    api.patch<TauxConversionResponse>(`/config/taux-conversion/${id}/toggle`),
};
