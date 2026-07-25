import { api } from './api';
import type { EntreeRecettePayload, EntreeRecetteResponse } from '../types/fiche-technique';

export const entreeRecetteService = {
  produire: (data: EntreeRecettePayload) =>
    api.post<EntreeRecetteResponse>('/config/entree-recette/produire', data),
};
