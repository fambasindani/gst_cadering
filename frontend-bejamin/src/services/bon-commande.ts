import { api } from './api';
import type { BonCommandeListResponse, BonCommandeResponse, BonCommandeFormData } from '../types/bon-commande';

export const bonCommandeService = {
  list: (params?: Record<string, string>) =>
    api.get<BonCommandeListResponse>('/config/bons-commande', { params }),

  get: (id: number) =>
    api.get<BonCommandeResponse>(`/config/bons-commande/${id}`),

  create: (data: BonCommandeFormData) =>
    api.post<BonCommandeResponse>('/config/bons-commande', data),

  update: (id: number, data: Partial<BonCommandeFormData>) =>
    api.put<BonCommandeResponse>(`/config/bons-commande/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/bons-commande/${id}`),

  validate: (id: number) =>
    api.patch<BonCommandeResponse>(`/config/bons-commande/${id}/valider`),

  reject: (id: number) =>
    api.patch<BonCommandeResponse>(`/config/bons-commande/${id}/rejeter`),

  cancel: (id: number) =>
    api.patch<BonCommandeResponse>(`/config/bons-commande/${id}/annuler`),

  getPartenaires: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/partenaires', { params: { ...params, per_page: '200' } }),

  getMagasins: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/magasins', { params: { ...params, per_page: '200' } }),

  getDevises: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; code: string; nom: string; symbole: string }[] } }>('/config/devises', { params: { ...params, per_page: '200' } }),

  getProduits: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string; code_article: string }[] } }>('/config/produits', { params: { ...params, per_page: '200' } }),

  receive: (id: number, data: { receptions: ReceptionItem[] }) =>
    api.patch<BonCommandeResponse>(`/config/bons-commande/${id}/recevoir`, data),
};

export interface ReceptionItem {
  id_ligne_commande: number;
  quantite_recue: number;
  numero_lot: string;
  date_peremption: string;
  prix_achat_ht_unitaire?: number;
}
