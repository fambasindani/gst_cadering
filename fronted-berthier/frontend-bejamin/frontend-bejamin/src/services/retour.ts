import { api } from './api';
import type { RetourListResponse, RetourResponse } from '../types/retour';

export const retourService = {
  list: (params?: Record<string, string>) =>
    api.get<RetourListResponse>('/config/retours', { params }),

  get: (id: number) =>
    api.get<RetourResponse>(`/config/retours/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<RetourResponse>('/config/retours', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<RetourResponse>(`/config/retours/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/retours/${id}`),

  validate: (id: number) =>
    api.patch<RetourResponse>(`/config/retours/${id}/valider`),

  reject: (id: number) =>
    api.patch<RetourResponse>(`/config/retours/${id}/rejeter`),

  traiter: (id: number) =>
    api.patch<RetourResponse>(`/config/retours/${id}/traiter`),
};
