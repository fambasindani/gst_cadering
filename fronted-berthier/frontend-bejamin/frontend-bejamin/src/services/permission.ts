import { api } from './api';
import type { Permission, PermissionFormData, ListResponse, SingleResponse } from '../types/auth';

export const permissionService = {
  list: (params?: Record<string, string>) =>
    api.get<ListResponse<Permission>>('/config/permissions', { params }),

  all: (params?: Record<string, string>) =>
    api.get<SingleResponse<Permission[]>>('/config/permissions-all', { params }),

  get: (id: number) =>
    api.get<SingleResponse<Permission>>(`/config/permissions/${id}`),

  create: (data: PermissionFormData) =>
    api.post<SingleResponse<Permission>>('/config/permissions', data),

  update: (id: number, data: Partial<PermissionFormData>) =>
    api.put<SingleResponse<Permission>>(`/config/permissions/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/permissions/${id}`),

  toggleActif: (id: number) =>
    api.patch<{ success: boolean; message: string }>(`/config/permissions/${id}/toggle`),
};
