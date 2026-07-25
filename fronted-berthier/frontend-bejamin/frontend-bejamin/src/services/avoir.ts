import { api } from './api';
import type { Avoir, AvoirFormData, ListResponse, SingleResponse } from '../types/facturation';

export const avoirService = {
  list: (params?: Record<string, string>) =>
    api.get<ListResponse<Avoir>>('/facturation/avoirs', { params }),

  get: (id: number) =>
    api.get<SingleResponse<Avoir>>(`/facturation/avoirs/${id}`),

  create: (data: AvoirFormData) =>
    api.post<SingleResponse<Avoir>>('/facturation/avoirs', data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/facturation/avoirs/${id}`),
};
