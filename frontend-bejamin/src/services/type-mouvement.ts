import { api } from './api';

export interface TypeMouvement {
  id: number;
  libelle: string;
  sens: number;
  actif: boolean;
}

export const typeMouvementService = {
  list: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: TypeMouvement[] }>('/config/types-mouvement', { params }),

  getEntree: () =>
    api.get<{ success: boolean; data: TypeMouvement[] }>('/config/types-mouvement/entree'),

  getSortie: () =>
    api.get<{ success: boolean; data: TypeMouvement[] }>('/config/types-mouvement/sortie'),
};
