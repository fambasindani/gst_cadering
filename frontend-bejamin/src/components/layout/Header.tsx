import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
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
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const pageTitle = useMemo(() => {
    const path = location.pathname;

    const routeTitles: Record<string, string> = {
      '/': 'Tableau de Bord',
      '/dashboard': 'Tableau de Bord',
      '/produits': 'Produits',
      '/bon-commande': 'Bons de commande',
      '/reception': 'Réceptions',
      '/stock/mouvement-produit': 'Mouvements par produit',
      '/entrer-stock': 'Entrées stock',
      '/sortie-stock': 'Sorties stock',
      '/retour-stock': 'Retours stock',
      '/validation': 'Validations',
      '/validation/bon-commande': 'Validation bons',
      '/validation/entrer-stock': 'Validation entrées',
      '/validation/periode-inventaire': 'Périodes inventaire',
      '/validation/saisie-inventaire': 'Saisie inventaire',
      '/validation/ajustement': 'Ajustements',
      '/recettes/creation': 'Fiches recette',
      '/recettes/entree': 'Entrée recette',
      '/recettes/rapport': 'Rapport recettes',
      '/recettes/fiche-technique': 'Fiches techniques',
      '/recettes/rapport-ft': 'Rapport fiche technique',
      '/configuration/magasin': 'Magasins',
      '/configuration/departement': 'Départements',
      '/configuration/categorie': 'Catégories',
      '/configuration/devise': 'Devises',
      '/configuration/taux-change': 'Taux de change',
      '/configuration/purge-stock': 'Purge stock',
      '/configuration/unite': 'Unités',
      '/configuration/type-mouvement': 'Types mouvement',
      '/configuration/roles': 'Rôles',
      '/configuration/permissions': 'Permissions',
      '/configuration/utilisateurs': 'Utilisateurs',
      '/rapports/stock': 'Rapport stock',
      '/rapports/stock/bas': 'Stock bas',
      '/rapports/stock/rupture': 'Rupture stock',
      '/rapports/inventaire-theorique': 'Inventaire théorique',
      '/rapports/bon-commande': 'Rapport commandes',
      '/rapports/bon-livraison': 'Rapport livraisons',
      '/profil': 'Mon Profil',
      '/audit': 'Audit',
    };

    if (routeTitles[path]) return routeTitles[path];

    const dynamicPatterns: [RegExp, string][] = [
      [/^\/produits\/(\d+)$/, 'Détail produit'],
      [/^\/produits\/(\d+)\/modifier$/, 'Modifier produit'],
      [/^\/produits\/creer$/, 'Nouveau produit'],
      [/^\/bon-commande\/(\d+)$/, 'Détail bon'],
      [/^\/bon-commande\/(\d+)\/modifier$/, 'Modifier bon'],
      [/^\/bon-commande\/creer$/, 'Nouveau bon'],
      [/^\/recettes\/creation\/(\d+)$/, 'Détail fiche recette'],
      [/^\/recettes\/creation\/(\d+)\/modifier$/, 'Modifier fiche recette'],
      [/^\/recettes\/creation\/nouveau$/, 'Nouvelle fiche recette'],
      [/^\/recettes\/fiche-technique\/(\d+)$/, 'Détail fiche technique'],
      [/^\/recettes\/fiche-technique\/(\d+)\/modifier$/, 'Modifier fiche technique'],
      [/^\/recettes\/fiche-technique\/nouveau$/, 'Nouvelle fiche technique'],
      [/^\/recettes\/rapport-ft\/(\d+)$/, 'Rapport fiche technique'],
      [/^\/reception\/(\d+)$/, 'Réception'],
      [/^\/stock\/mouvement-produit\/(\d+)$/, 'Mouvements du produit'],
      [/^\/configuration\/utilisateurs\/(\d+)\/modifier$/, 'Modifier utilisateur'],
      [/^\/configuration\/utilisateurs\/creer$/, 'Nouvel utilisateur'],
      [/^\/stock\/sortie\/creer$/, 'Nouvelle sortie'],
      [/^\/stock\/sortie\/(\d+)\/modifier$/, 'Modifier sortie'],
    ];

    for (const [pattern, title] of dynamicPatterns) {
      if (pattern.test(path)) return title;
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
    }

    return 'Tableau de Bord';
  }, [location.pathname]);

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
          <span className="text-sm text-gray-500">{pageTitle}</span>
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
          <DropdownMenuContent align="end" className="w-56">
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
