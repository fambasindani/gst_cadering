import { api } from './api';
import type { DashboardResponse } from '../types/dashboard';

export const dashboardService = {
  get: () =>
    api.get<DashboardResponse>('/dashboard'),
};
