import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, LogOut, X } from 'lucide-react';
import { menuItems } from '../../data/mockData';
import type { MenuItem as MenuItemType } from '../../types';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const permissions = user?.permissions || [];

  const isAdmin = user?.role?.nom === 'ADMIN' || user?.role?.nom === 'Administrateur';

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  const filteredMenuItems = menuItems
    .map(item => {
      if (!item.subItems) return hasPermission(item.permission) ? item : null;
      const filteredSubItems = item.subItems.filter(s => hasPermission(s.permission));
      if (filteredSubItems.length === 0) return null;
      return { ...item, subItems: filteredSubItems };
    })
    .filter(Boolean) as MenuItemType[];

  useEffect(() => {
    const currentPath = location.pathname;
    setExpandedItems(prev => {
      const merged = new Set(prev);
      filteredMenuItems.forEach((item) => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some(
            (subItem) => currentPath === subItem.path || currentPath.startsWith(subItem.path + '/'),
          );
          if (hasActiveSubItem || currentPath === item.path) {
            merged.add(item.title);
          }
        }
      });
      return Array.from(merged);
    });
  }, [location.pathname]);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  const isParentActive = (item: MenuItemType) => {
    if (location.pathname === item.path) return true;
    return item.subItems?.some(s => isActive(s.path)) ?? false;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Home: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      ),
      Package: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      ),
      FileText: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      CheckCircle: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      Warehouse: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      BookOpen: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      Receipt: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      Settings: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      Users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      Shield: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5L12 2z" />
        </svg>
      ),
      ClipboardList: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      BarChart: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}

      <div
        className={cn(
          'fixed top-0 left-0 h-full bg-royal-900 transition-all duration-300 z-50 flex flex-col border-r border-royal-700',
          isOpen ? 'w-64' : 'w-16',
          isMobile && (isOpen ? 'translate-x-0' : '-translate-x-full'),
        )}
      >
        <div
          className={cn(
            'p-4 border-b border-royal-700 flex items-center',
            !isOpen && 'justify-center',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-royal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              FS
            </div>
            <span
              className={cn(
                'text-white font-bold text-lg transition-opacity duration-300 whitespace-nowrap',
                !isOpen && 'opacity-0 w-0 overflow-hidden',
              )}
            >
              Fondeg stocks
            </span>
          </div>
          {isMobile && isOpen && (
            <button onClick={onClose} className="ml-auto text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredMenuItems.map((item, index) => (
            <div key={index}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-sm font-medium transition-colors',
                      isParentActive(item)
                        ? 'bg-royal-700 text-white'
                        : 'text-royal-300 hover:text-white hover:bg-royal-800',
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0">{getIcon(item.icon)}</span>
                      <span
                        className={cn(
                          'transition-opacity duration-300 truncate',
                          !isOpen && 'hidden',
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                    <span className={cn('transition-opacity duration-300', !isOpen && 'hidden')}>
                      {expandedItems.includes(item.title) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {expandedItems.includes(item.title) && isOpen && (
                    <div className="ml-4 mt-1 space-y-1 transition-all duration-300">
                      {item.subItems.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          onClick={handleLinkClick}
                          className={cn(
                            'flex items-center px-3 py-2 rounded-sm text-sm transition-colors',
                            isActive(subItem.path)
                              ? 'bg-royal-700 text-white'
                              : 'text-royal-400 hover:text-white hover:bg-royal-800',
                          )}
                        >
                          <span className="w-2 h-2 rounded-full bg-royal-500 mr-3 flex-shrink-0"></span>
                          <span className="truncate">{subItem.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors',
                    isActive(item.path)
                      ? 'bg-royal-700 text-white'
                      : 'text-royal-300 hover:text-white hover:bg-royal-800',
                  )}
                >
                  <span className="flex-shrink-0">{getIcon(item.icon)}</span>
                  <span
                    className={cn(
                      'transition-opacity duration-300 truncate',
                      !isOpen && 'hidden',
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-royal-700">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors',
              'text-red-400 hover:text-red-300 hover:bg-red-900/30',
              !isOpen && 'justify-center',
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn('transition-opacity duration-300', !isOpen && 'hidden')}>
              Déconnexion
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
