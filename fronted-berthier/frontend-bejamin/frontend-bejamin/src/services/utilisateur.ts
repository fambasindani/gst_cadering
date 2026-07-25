import { api } from './api';
import type { Utilisateur, UtilisateurFormData, ListResponse, SingleResponse } from '../types/auth';

export const utilisateurService = {
  list: (params?: Record<string, string>) =>
    api.get<ListResponse<Utilisateur>>('/config/utilisateurs', { params }),

  get: (id: number) =>
    api.get<SingleResponse<Utilisateur>>(`/config/utilisateurs/${id}`),

  create: (data: UtilisateurFormData) =>
    api.post<SingleResponse<Utilisateur>>('/config/utilisateurs', data),

  update: (id: number, data: Partial<UtilisateurFormData>) =>
    api.put<SingleResponse<Utilisateur>>(`/config/utilisateurs/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/utilisateurs/${id}`),

  toggleActif: (id: number) =>
    api.patch<{ success: boolean; message: string }>(`/config/utilisateurs/${id}/toggle`),
};
