import { api } from './api';
import type {
  EntreeRecetteListResponse,
  EntreeRecettePayload,
  EntreeRecetteResponse,
} from '../types/fiche-technique';

export const entreeRecetteService = {
  list: (params?: Record<string, string>) =>
    api.get<EntreeRecetteListResponse>('/config/entree-recette', { params }),

  produire: (data: EntreeRecettePayload) =>
    api.post<EntreeRecetteResponse>('/config/entree-recette/produire', data),

  get: (id: number) =>
    api.get<{ success: boolean; data: import('../types/fiche-technique').EntreeRecette; message: string }>(`/config/entree-recette/${id}`),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/entree-recette/${id}`),
};
