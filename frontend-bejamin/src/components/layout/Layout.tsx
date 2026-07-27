import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { useAuthStore } from '../../store/authStore';




export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Vérifier si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Sur desktop, sidebar ouvert par défaut; sur mobile, fermé
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ne pas fermer le sidebar sur changement de page (pour desktop)
  // Sur mobile, on ferme si le sidebar est ouvert
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);

  const handleIdle = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  useIdleTimer(2 * 60 * 60 * 1000, handleIdle);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="flex h-screen bg-gray-300 overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
      />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-w-0",
          // Sur desktop, on décale le contenu selon l'état du sidebar
          !isMobile && isSidebarOpen && "lg:ml-64",
          !isMobile && !isSidebarOpen && "lg:ml-16"
        )}
      >
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}