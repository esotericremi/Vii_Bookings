import { Tables } from './database';

// Core notification types from database
export type Notification = Tables<'notifications'>;
export type NotificationInsert = Tables<'notifications'>['Insert'];
export type NotificationUpdate = Tables<'notifications'>['Update'];

// Notification type enum
export type NotificationType =
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'booking_modified'
    | 'admin_override'
    | 'booking_reminder'
    | 'system_error';

// Notification with user relation
export interface NotificationWithUser extends Notification {
    user?: User;
}

// Notification creation data
export interface CreateNotificationData {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
}

// Notification statistics
export interface NotificationStats {
    total_notifications: number;
    unread_notifications: number;
    notifications_by_type: Record<NotificationType, number>;
}

// Real-time notification payload
export interface RealtimeNotificationPayload {
    notification: Notification;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
}

// Import types for relations
import type { User } from './user';