import { api } from './api';
import type { PurgeStockResponse } from '../types/purge';

export const purgeService = {
  purgeStock: (confirmation: string) =>
    api.post<PurgeStockResponse>('/config/purge-stock', { confirmation }),
};
