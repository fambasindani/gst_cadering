export interface StatCardData {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'indigo' | 'purple' | 'orange' | 'green' | 'red' | 'pink';
}

export interface MenuItem {
  title: string;
  icon: string;
  path: string;
  permission?: string;
  subItems?: { title: string; path: string; permission?: string }[];
}

export interface Activity {
  id: number;
  user: string;
  action: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
}