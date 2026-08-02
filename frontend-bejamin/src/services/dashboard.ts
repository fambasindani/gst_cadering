import { api } from './api';
import type { DashboardResponse } from '../types/dashboard';

export const dashboardService = {
  get: (params?: Record<string, string>) =>
    api.get<DashboardResponse>('/dashboard', { params }),
};
