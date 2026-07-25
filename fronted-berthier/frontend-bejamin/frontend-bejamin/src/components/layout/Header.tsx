import { useNavigate } from 'react-router-dom';
import { Search, Menu, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx';
import { useAuthStore } from '../../store/authStore';
import { NotificationPanel } from './NotificationPanel';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'BM';

  const avatarUrl = user?.full_name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=1E40AF&color=fff`
    : 'https://ui-avatars.com/api/?name=Benjamin+M&background=1E40AF&color=fff';

  const roleName = user?.role?.nom || 'Administrateur';

  return (
    <header className="bg-gray-200  border-b border-gray-500 h-16 px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-xl font-bold text-royal-800">Fondeg</h1>
          <span className="text-gray-400">|</span>
          <span className="text-bg text-black-700">Dashboard</span>
        </div>
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 w-64 h-9 bg-gray-200 border-blue-400 focus:ring-royal-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationPanel />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-royal-500 text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">
                  {user?.full_name || 'Benjamin M.'}
                </p>
                <p className="text-xs text-gray-400">{roleName}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 ">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profil')}>Profil</DropdownMenuItem>
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuItem>Administration</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
