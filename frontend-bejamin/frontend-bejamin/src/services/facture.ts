import { api } from './api';
import type { Facture, FactureFormData, ListResponse, SingleResponse } from '../types/facturation';

export const factureService = {
  list: (params?: Record<string, string>) =>
    api.get<ListResponse<Facture>>('/facturation/factures', { params }),

  get: (id: number) =>
    api.get<SingleResponse<Facture>>(`/facturation/factures/${id}`),

  create: (data: FactureFormData) =>
    api.post<SingleResponse<Facture>>('/facturation/factures', data),

  update: (id: number, data: Partial<FactureFormData>) =>
    api.put<SingleResponse<Facture>>(`/facturation/factures/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/facturation/factures/${id}`),

  emettre: (id: number) =>
    api.patch<SingleResponse<Facture>>(`/facturation/factures/${id}/emettre`),

  annuler: (id: number) =>
    api.patch<SingleResponse<Facture>>(`/facturation/factures/${id}/annuler`),

  marquerPayee: (id: number) =>
    api.patch<SingleResponse<Facture>>(`/facturation/factures/${id}/payee`),

  getClients: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/partenaires/clients', { params: { ...params, per_page: '200' } }),

  getVilles: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/villes', { params: { ...params, per_page: '200' } }),

  getDevises: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; code: string; nom: string; symbole: string }[] } }>('/config/devises', { params: { ...params, per_page: '200' } }),

  getProduits: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string; code_article: string }[] } }>('/config/produits', { params: { ...params, per_page: '200' } }),

  getBonsCommandes: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; numero_commande: string }[] } }>('/config/bons-commande', { params: { ...params, per_page: '200' } }),
};
