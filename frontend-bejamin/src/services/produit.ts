import { api } from './api';
import type { ProduitListResponse, ProduitResponse, ProduitFormData, StockResponse, HistoriquePrix } from '../types/produit';

export const produitService = {
  list: (params?: Record<string, string>) =>
    api.get<ProduitListResponse>('/config/produits', { params }),

  get: (id: number) =>
    api.get<ProduitResponse>(`/config/produits/${id}`),

  getDernierPrix: (produitId: number) =>
    api.get<{ success: boolean; data: { produit: string; dernier_prix_achat: { prix: number; devise: string; date: string } | null }; message: string }>(`/config/produits/${produitId}/dernier-prix`),

  create: (data: ProduitFormData) =>
    api.post<ProduitResponse>('/config/produits', data),

  update: (id: number, data: Partial<ProduitFormData>) =>
    api.put<ProduitResponse>(`/config/produits/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/produits/${id}`),

  toggle: (id: number) =>
    api.patch<ProduitResponse>(`/config/produits/${id}/toggle`),

  getStock: (id: number) =>
    api.get<StockResponse>(`/config/produits/${id}/stock`),

  getCategories: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/categories', { params }),

  getUnites: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string; symbole: string }[] } }>('/config/unites', { params }),

  getDevises: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; code: string; nom: string; symbole: string }[] } }>('/config/devises', { params }),

  getFournisseurs: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: { data: { id: number; nom: string }[] } }>('/config/partenaires', { params: { ...params, type: 'fournisseur' } }),

  addPrix: (data: { id_produit: number; prix_achat_ht: number; id_devise: number; date_application?: string; commentaire?: string }) =>
    api.post<{ success: boolean; data: HistoriquePrix; message: string }>('/config/historique-prix', data),

  updatePrix: (id: number, data: { prix_achat_ht?: number; id_devise?: number; date_application?: string; commentaire?: string }) =>
    api.put<{ success: boolean; data: HistoriquePrix; message: string }>(`/config/historique-prix/${id}`, data),

  deletePrix: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/historique-prix/${id}`),
};
