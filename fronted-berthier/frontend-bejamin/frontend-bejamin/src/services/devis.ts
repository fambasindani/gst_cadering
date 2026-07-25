import { api } from './api';
import type { Devis, DevisFormData, ListResponse, SingleResponse } from '../types/facturation';

export const devisService = {
  list: (params?: Record<string, string>) =>
    api.get<ListResponse<Devis>>('/facturation/devis', { params }),

  get: (id: number) =>
    api.get<SingleResponse<Devis>>(`/facturation/devis/${id}`),

  create: (data: DevisFormData) =>
    api.post<SingleResponse<Devis>>('/facturation/devis', data),

  update: (id: number, data: Partial<DevisFormData>) =>
    api.put<SingleResponse<Devis>>(`/facturation/devis/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/facturation/devis/${id}`),

  changeStatut: (id: number, statut: string) =>
    api.patch<SingleResponse<Devis>>(`/facturation/devis/${id}/statut`, { statut }),

  transformerEnCommande: (id: number) =>
    api.post<SingleResponse<{ devis: Devis; bon_commande: unknown }>>(`/facturation/devis/${id}/transformer-commande`),

  getClients: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/partenaires/clients', { ...params, per_page: '200' }),

  getVilles: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/villes', { ...params, per_page: '200' }),

  getDevises: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; code: string; nom: string; symbole: string }[] } }>('/config/devises', { ...params, per_page: '200' }),

  getProduits: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string; code_article: string }[] } }>('/config/produits', { ...params, per_page: '200' }),
};
