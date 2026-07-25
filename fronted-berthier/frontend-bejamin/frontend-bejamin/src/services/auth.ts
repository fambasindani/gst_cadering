import { api } from './api';
import type { LoginRequest, LoginResponse } from '../types/auth';

export const authService = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', credentials),

  logout: () =>
    api.post<{ success: boolean; message: string }>('/auth/logout'),

  me: () =>
    api.get<{ success: boolean; data: { utilisateur: import('../types/auth').Utilisateur } }>('/auth/me'),

  updateProfile: (data: Partial<import('../types/auth').UtilisateurFormData & { mot_de_passe: string; mot_de_passe_confirmation: string }>) =>
    api.put<{ success: boolean; data: { utilisateur: import('../types/auth').Utilisateur }; message: string }>('/auth/me', data),
};
