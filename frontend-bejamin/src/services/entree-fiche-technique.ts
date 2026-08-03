import { api } from './api';
import type {
  EntreeFicheTechniqueListResponse,
  RapportFicheTechniqueResponse,
  RapportPayload,
  EntreeFicheTechnique,
} from '../types/fiche-technique-menu';

export const entreeFicheTechniqueService = {
  list: (params?: Record<string, string>) =>
    api.get<EntreeFicheTechniqueListResponse>('/config/entree-fiche-technique', { params }),

  generer: (data: RapportPayload) =>
    api.post<RapportFicheTechniqueResponse>('/config/entree-fiche-technique/generer', data),

  apercu: (data: Pick<RapportPayload, 'id_fiche_technique_menu' | 'nombre_passagers'>) =>
    api.post<RapportFicheTechniqueResponse>('/config/entree-fiche-technique/apercu', data),

  get: (id: number) =>
    api.get<RapportFicheTechniqueResponse>(`/config/entree-fiche-technique/${id}`),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/config/entree-fiche-technique/${id}`),
};

export type { EntreeFicheTechnique };
