import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { notificationQueries } from '@/lib/queries';
import { NotificationService } from '@/lib/notificationService';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types/notification';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useNotifications = (options?: {
    limit?: number;
    autoCleanup?: boolean;
    cleanupDays?: number;
}) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [unreadCount, setUnreadCount] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
    const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

    const limit = options?.limit || 50;
    const autoCleanup = options?.autoCleanup ?? true;
    const cleanupDays = options?.cleanupDays || 30;

    // Fetch notifications with enhanced query
    const { data: notifications = [], isLoading, error } = useQuery({
        queryKey: ['notifications', user?.id, limit],
        queryFn: async () => {
            if (!user?.id) return [];

            return await notificationQueries.getByUserId(user.id, { limit });
        },
        enabled: !!user?.id,
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
    });

    // Get unread count separately for better performance
    const { data: unreadCountData = 0 } = useQuery({
        queryKey: ['notifications-unread-count', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0;
            return await notificationQueries.getUnreadCount(user.id);
        },
        enabled: !!user?.id,
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });

    // Update unread count when data changes
    useEffect(() => {
        setUnreadCount(unreadCountData);
    }, [unreadCountData]);

    // Mark notification as read
    const markAsReadMutation = useMutation({
        mutationFn: (notificationId: string) => notificationQueries.markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });

    // Mark multiple notifications as read
    const markMultipleAsReadMutation = useMutation({
        mutationFn: (notificationIds: string[]) => notificationQueries.markMultipleAsRead(notificationIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });

    // Mark all notifications as read
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) return;
            await notificationQueries.markAllAsRead(user.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });

    // Delete notification
    const deleteNotificationMutation = useMutation({
        mutationFn: (notificationId: string) => notificationQueries.delete(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });

    // Cleanup old notifications
    const cleanupOldNotificationsMutation = useMutation({
        mutationFn: async (daysOld: number = cleanupDays) => {
            if (!user?.id) return;
            await NotificationService.cleanupOldNotifications(user.id, daysOld);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });

    // Enhanced real-time subscription for notifications
    useEffect(() => {
        if (!user?.id) return;

        setConnectionStatus('connecting');

        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Notification real-time update:', payload);

                    // Invalidate and refetch notifications when changes occur
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });

                    // Show toast notification for new notifications
                    if (payload.eventType === 'INSERT' && payload.new) {
                        const notification = payload.new as Notification;
                        // You can add toast notification here if needed
                        console.log('New notification received:', notification.title);
                    }
                }
            )
            .subscribe((status) => {
                console.log('Notification subscription status:', status);
                setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
            });

        setRealtimeChannel(channel);

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
                setRealtimeChannel(null);
                setConnectionStatus('disconnected');
            }
        };
    }, [user?.id, queryClient]);

    // Auto cleanup old notifications
    useEffect(() => {
        if (!user?.id || !autoCleanup) return;

        const cleanup = async () => {
            try {
                await NotificationService.cleanupOldNotifications(user.id, cleanupDays);
            } catch (error) {
                console.error('Failed to cleanup old notifications:', error);
            }
        };

        // Run cleanup on mount and then every 24 hours
        cleanup();
        const interval = setInterval(cleanup, 24 * 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user?.id, autoCleanup, cleanupDays]);

    // Connection status monitoring
    const reconnect = useCallback(() => {
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
        }
        // The useEffect will handle reconnection
    }, [realtimeChannel]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        connectionStatus,

        // Actions
        markAsRead: markAsReadMutation.mutate,
        markMultipleAsRead: markMultipleAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
        deleteNotification: deleteNotificationMutation.mutate,
        cleanupOldNotifications: cleanupOldNotificationsMutation.mutate,
        reconnect,

        // Loading states
        isMarkingAsRead: markAsReadMutation.isPending,
        isMarkingMultipleAsRead: markMultipleAsReadMutation.isPending,
        isMarkingAllAsRead: markAllAsReadMutation.isPending,
        isDeletingNotification: deleteNotificationMutation.isPending,
        isCleaningUp: cleanupOldNotificationsMutation.isPending,
    };
};