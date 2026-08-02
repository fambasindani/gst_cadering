import type { Activity, MenuItem, StatCardData } from "../types";


export const statsData: StatCardData[] = [
  {
    title: 'Produits',
    value: 774,
    icon: 'Package',
    color: 'blue',
  },
  {
    title: 'Clients Aériens',
    value: 13,
    icon: 'Plane',
    color: 'indigo',
  },
  {
    title: 'Clients Non Aériens',
    value: 4,
    icon: 'Building',
    color: 'purple',
  },
  {
    title: 'Commandes à Valider',
    value: 54,
    icon: 'ShoppingCart',
    color: 'orange',
  },
  {
    title: 'Prix à Valider',
    value: 0,
    icon: 'DollarSign',
    color: 'green',
  },
];

export const menuItems: MenuItem[] = [
  { title: 'Tableau de bord', icon: 'Home', path: '/' },
  { title: 'Produit', icon: 'Package', path: '/produits', permission: 'config:produits:view' },
  { title: 'Bon de Commande', icon: 'FileText', path: '/bon-commande', permission: 'config:bon_commande:view' },
  { 
    title: 'Validation', 
    icon: 'CheckCircle', 
    path: '/validation',
    subItems: [
      { title: 'Bon de commande', path: '/validation/bon-commande', permission: 'config:bon_commande:validate' },
      { title: 'Entrer stock', path: '/validation/entrer-stock', permission: 'config:mouvements:create' },
      { title: 'Période inventaire', path: '/validation/periode-inventaire', permission: 'config:periode_inventaire:view' },
      { title: 'Saisie inventaire', path: '/validation/saisie-inventaire', permission: 'config:inventaire:create' },
      { title: 'Ajustement', path: '/validation/ajustement', permission: 'config:inventaire:view' },
      { title: 'Ajustement inventaire', path: '/validation/ajustement-produit', permission: 'config:inventaire:view' },
    ]
  },
  { 
    title: 'Stock', 
    icon: 'Warehouse', 
    path: '/stock',
    subItems: [
      { title: 'Lot/Série', path: '/stock/lot-serie', permission: 'config:lots:view' },
      { title: 'Sortie stock', path: '/stock/sortie', permission: 'config:mouvements:create' },
      { title: 'Entrée stock', path: '/stock/entree', permission: 'config:mouvements:create' },
      { title: 'Bon de réception', path: '/reception', permission: 'config:bon_commande:receive' },
      { title: 'Mouvement produit', path: '/stock/mouvement-produit', permission: 'config:mouvements:view' },
      { title: 'Retour stock', path: '/stock/retour', permission: 'config:retours:view' },
      { title: 'Avoirs', path: '/stock/avoir', permission: 'facturation:avoir:view' },
    ]
  },
  { 
    title: 'Recettes', 
    icon: 'BookOpen', 
    path: '/recettes',
    permission: 'config:fiche_technique:view',
    subItems: [
      { title: 'Création Fiche Tech.', path: '/recettes/creation', permission: 'config:fiche_technique:view' },
      { title: 'Entrée Recette', path: '/recettes/entree', permission: 'config:recette:view' },
      { title: 'Rapport Recette', path: '/recettes/rapport', permission: 'config:recette:view' },
    ]
  },
  { 
    title: 'Configuration', 
    icon: 'Settings', 
    path: '/configuration',
    permission: 'config:magasins:view',
    subItems: [
      { title: 'Magasin', path: '/configuration/magasin', permission: 'config:magasins:view' },
      { title: 'Département', path: '/configuration/departement', permission: 'config:departements:view' },
      { title: 'Catégorie', path: '/configuration/categorie', permission: 'config:categories:view' },
      { title: 'Devise', path: '/configuration/devise', permission: 'config:devises:view' },
    ]
  },
  { 
    title: 'Utilisateurs', 
    icon: 'Users', 
    path: '/configuration/utilisateurs',
    permission: 'config:utilisateurs:view',
    subItems: [
      { title: 'Utilisateurs', path: '/configuration/utilisateurs', permission: 'config:utilisateurs:view' },
      { title: 'Rôles', path: '/configuration/roles', permission: 'config:roles:view' },
      { title: 'Permissions', path: '/configuration/permissions', permission: 'config:permissions:view' },
    ]
  },
  { 
    title: 'Partenaire', 
    icon: 'Users', 
    path: '/partenaire',
    permission: 'config:partenaires:view',
    subItems: [
      { title: 'Client Aérien', path: '/partenaire?type=client-aerien', permission: 'config:partenaires:view' },
      { title: 'Client Non Aérien', path: '/partenaire?type=client-non-aerien', permission: 'config:partenaires:view' },
      { title: 'Fournisseur', path: '/partenaire?type=fournisseur', permission: 'config:partenaires:view' },
    ]
  },
  { title: 'Audit', icon: 'ClipboardList', path: '/audit', permission: 'audit:view' },
  { 
    title: 'Rapports', 
    icon: 'BarChart', 
    path: '/rapports',
    permission: 'rapport:stock',
    subItems: [
      { title: 'Bon Commande', path: '/rapports/bon-commande', permission: 'rapport:commande' },
      { title: 'Bon Livraison', path: '/rapports/bon-livraison', permission: 'rapport:commande' },
      { title: 'Rapport Stock', path: '/rapports/stock', permission: 'rapport:stock' },
      { title: 'Variation Stock', path: '/rapports/variation-stock', permission: 'rapport:stock' },
      { title: 'Rapport Client', path: '/rapports/client', permission: 'rapport:client' },
      { title: 'Rapport Sortie', path: '/rapports/sortie', permission: 'rapport:stock' },
      { title: 'Rapport Achat', path: '/rapports/achat', permission: 'rapport:stock' },
      { title: 'Rapport Fournisseur', path: '/rapports/fournisseur', permission: 'rapport:stock' },
      { title: 'Inventaire Théorique', path: '/rapports/inventaire-theorique', permission: 'rapport:inventaire' },
      { title: 'Rupture Stock', path: '/rapports/rupture-stock', permission: 'rapport:stock' },
      { title: 'Stock bas', path: '/rapports/stock-bas', permission: 'rapport:stock' },
    ]
  },
];

export const recentActivities: Activity[] = [
  {
    id: 1,
    user: 'Jean Dupont',
    action: 'a validé la commande BC-2026-001',
    time: 'il y a 5 minutes',
    type: 'success',
  },
  {
    id: 2,
    user: 'Marie Claire',
    action: 'a créé un nouveau lot pour le produit "Poulet rôti"',
    time: 'il y a 15 minutes',
    type: 'info',
  },
  {
    id: 3,
    user: 'Pierre Kabila',
    action: 'a modifié le prix du produit "Salade César"',
    time: 'il y a 1 heure',
    type: 'warning',
  },
  {
    id: 4,
    user: 'Sophie Mbemba',
    action: 'a supprimé le lot LOT-2026-005',
    time: 'il y a 2 heures',
    type: 'error',
  },
  {
    id: 5,
    user: 'David Tshibanda',
    action: 'a réceptionné la commande BC-2026-002',
    time: 'il y a 3 heures',
    type: 'success',
  },
];