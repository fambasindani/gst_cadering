export interface NotificationItem {
  id: number;
  type: string;
  message: string;
  id_utilisateur: number;
  reference_type: string | null;
  reference_id: number | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    data: NotificationItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  unread_count: number;
  message: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
  message: string;
}

export interface NotificationActionResponse {
  success: boolean;
  data?: NotificationItem;
  message: string;
}