import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2, Clock, FileText, RotateCcw, AlertTriangle } from 'lucide-react';
import { notificationService } from '../../services/notification';
import type { NotificationItem } from '../../types/notification';
import { cn } from '../../lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  bon_commande_en_attente: FileText,
  retour_en_attente: RotateCcw,
  lot_peremption_proche: AlertTriangle,
};

const typeColors: Record<string, string> = {
  bon_commande_en_attente: 'text-amber-600 bg-amber-50',
  retour_en_attente: 'text-blue-600 bg-blue-50',
  lot_peremption_proche: 'text-red-600 bg-red-50',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.unreadCount();
      if (res.success) setUnreadCount(res.data.count);
    } catch { /* ignore */ }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.list({ per_page: '10', unread_only: '0' });
      if (res.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.unread_count);
      }
    } catch { /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-royal-600 hover:text-royal-700 transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                const color = typeColors[n.type] || 'text-gray-600 bg-gray-50';
                const isUnread = !n.read_at;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read_at && handleMarkRead(n.id)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors',
                      isUnread ? 'bg-royal-50/50 hover:bg-royal-50' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className={cn('p-2 rounded-lg shrink-0', color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', isUnread ? 'font-semibold text-gray-900' : 'text-gray-600')}>
                        {n.message}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {isUnread && <span className="w-2 h-2 rounded-full bg-royal-600 shrink-0 mt-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}