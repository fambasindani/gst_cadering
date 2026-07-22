import { api } from './api';
import type { Paiement, PaiementFormData, ListResponse, SingleResponse } from '../types/facturation';

export const paiementService = {
  list: (params?: Record<string, string>) =>
    api.get<ListResponse<Paiement>>('/facturation/paiements', { params }),

  get: (id: number) =>
    api.get<SingleResponse<Paiement>>(`/facturation/paiements/${id}`),

  create: (data: PaiementFormData) =>
    api.post<SingleResponse<Paiement>>('/facturation/paiements', data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/facturation/paiements/${id}`),
};
