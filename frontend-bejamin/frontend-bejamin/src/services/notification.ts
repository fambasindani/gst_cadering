import { api } from './api';
import type { NotificationListResponse, UnreadCountResponse, NotificationActionResponse } from '../types/notification';

export const notificationService = {
  list: (params?: Record<string, string>) =>
    api.get<NotificationListResponse>('/config/notifications', { params }),

  unreadCount: () =>
    api.get<UnreadCountResponse>('/config/notifications/unread-count'),

  markAsRead: (id: number) =>
    api.patch<NotificationActionResponse>(`/config/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch<NotificationActionResponse>('/config/notifications/read-all'),
};