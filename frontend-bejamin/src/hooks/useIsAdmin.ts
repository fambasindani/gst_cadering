import { useAuthStore } from '../store/authStore';

export function useIsAdmin(): boolean {
  const user = useAuthStore(s => s.user);
  return user?.role?.nom === 'ADMIN' || user?.role?.nom === 'Administrateur';
}
