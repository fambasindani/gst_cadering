import { create } from 'zustand';
import type { Utilisateur } from '../types/auth';
import { authService } from '../services/auth';

interface AuthState {
  user: Utilisateur | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, mot_de_passe: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth-token'),
  isAuthenticated: !!localStorage.getItem('auth-token'),
  isLoading: false,
  error: null,

  login: async (email: string, mot_de_passe: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, mot_de_passe });

      if (response.success && response.data) {
        const { token, utilisateur } = response.data;
        localStorage.setItem('auth-token', token);
        set({
          user: utilisateur,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (err: unknown) {
      localStorage.removeItem('auth-token');
      const error = err as { message?: string; errors?: Record<string, string[]> };
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Une erreur est survenue lors de la connexion',
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('auth-token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await authService.me();
      if (response.success && response.data) {
        set({ user: response.data.utilisateur, isAuthenticated: true });
      }
    } catch {
      localStorage.removeItem('auth-token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
