import { api } from './api';
import type { LotListResponse, LotResponse } from '../types/lot';

export const lotService = {
  list: (params?: Record<string, string>) =>
    api.get<LotListResponse>('/config/lots', { params }),

  get: (id: number) =>
    api.get<LotResponse>(`/config/lots/${id}`),

  create: (data: Record<string, string | number>) =>
    api.post<LotResponse>('/config/lots', data),

  update: (id: number, data: Record<string, string | number>) =>
    api.put<LotResponse>(`/config/lots/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/lots/${id}`),

  validate: (id: number) =>
    api.patch<LotResponse>(`/config/lots/${id}/valider`),

  reject: (id: number) =>
    api.patch<LotResponse>(`/config/lots/${id}/rejeter`),

  peremptionProche: (params?: Record<string, string>) =>
    api.get<LotListResponse>('/config/lots/peremption-proche', { params }),

  scan: (codeQr: string) =>
    api.get<LotResponse>(`/config/lots/scan/${codeQr}`),
};
