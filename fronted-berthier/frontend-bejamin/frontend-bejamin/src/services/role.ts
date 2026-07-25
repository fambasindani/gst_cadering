import { api } from './api';
import type { Role, RoleFormData, ListResponse, SingleResponse } from '../types/auth';

export const roleService = {
  list: (params?: Record<string, string>) =>
    api.get<ListResponse<Role>>('/config/roles', { params }),

  get: (id: number) =>
    api.get<SingleResponse<Role>>(`/config/roles/${id}`),

  create: (data: RoleFormData) =>
    api.post<SingleResponse<Role>>('/config/roles', data),

  update: (id: number, data: Partial<RoleFormData>) =>
    api.put<SingleResponse<Role>>(`/config/roles/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/roles/${id}`),

  toggleActif: (id: number) =>
    api.patch<{ success: boolean; message: string }>(`/config/roles/${id}/toggle`),

  assignPermissions: (id: number, permissionIds: number[]) =>
    api.post<{ success: boolean; message: string }>(`/config/roles/${id}/assign-permissions`, { permission_ids: permissionIds }),
};
