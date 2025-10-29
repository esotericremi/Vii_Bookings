import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeService, type ConnectionStatus } from '@/lib/realtimeService';
import { roomQueries, bookingQueries } from '@/lib/queries';
import type { Room, Booking } from '@/types';

interface UseRealTimeAvailabilityOptions {
    roomId?: string | null;
    autoReconnect?: boolean;
    onAvailabilityChange?: (roomId: string, isAvailable: boolean) => void;
    onBookingConflict?: (conflicts: Booking[]) => void;
}

export const useRealTimeAvailability = (options: UseRealTimeAvailabilityOptions = {}) => {
    const queryClient = useQueryClient();
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const { roomId, autoReconnect = true, onAvailabilityChange, onBookingConflict } = options;

    // Handle real-time updates
    const handleRealtimeUpdate = useCallback((payload: {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE';
        booking?: Booking;
        room?: Room;
    }) => {
        console.log('Real-time availability update:', payload);
        setLastUpdate(new Date());

        // Invalidate relevant queries
        if (payload.booking) {
            const booking = payload.booking;

            // Invalidate booking queries
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['bookings', 'room', booking.room_id] });

            // Invalidate room availability queries
            queryClient.invalidateQueries({ queryKey: ['rooms', 'availability'] });
            queryClient.invalidateQueries({ queryKey: ['rooms', booking.room_id, 'availability'] });

            // Trigger availability change callback
            if (onAvailabilityChange) {
                // Determine if room is available (simplified logic)
                const isAvailable = payload.eventType === 'DELETE' || booking.status === 'cancelled';
                onAvailabilityChange(booking.room_id, isAvailable);
            }
        }

        if (payload.room) {
            const room = payload.room;

            // Invalidate room queries
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            queryClient.invalidateQueries({ queryKey: ['rooms', room.id] });

            // If room was deactivated, trigger availability change
            if (onAvailabilityChange && payload.eventType === 'UPDATE') {
                onAvailabilityChange(room.id, room.is_active);
            }
        }
    }, [queryClient, onAvailabilityChange]);

    // Subscribe to real-time updates
    useEffect(() => {
        const id = RealtimeService.subscribeToRoomAvailability(
            roomId || null,
            handleRealtimeUpdate
        );

        setSubscriptionId(id);

        return () => {
            if (id) {
                RealtimeService.unsubscribe(id);
            }
        };
    }, [roomId, handleRealtimeUpdate]);

    // Monitor connection status
    useEffect(() => {
        const unsubscribe = RealtimeService.addConnectionListener((status) => {
            setConnectionStatus(status);

            // Auto-reconnect if connection is lost
            if (status === 'error' && autoReconnect) {
                console.log('Connection error detected, attempting to reconnect...');
                setTimeout(() => {
                    RealtimeService.reconnectAll();
                }, 2000);
            }
        });

        return unsubscribe;
    }, [autoReconnect]);

    // Manual reconnect function
    const reconnect = useCallback(() => {
        if (subscriptionId) {
            RealtimeService.unsubscribe(subscriptionId);
        }

        const newId = RealtimeService.subscribeToRoomAvailability(
            roomId || null,
            handleRealtimeUpdate
        );

        setSubscriptionId(newId);
    }, [roomId, handleRealtimeUpdate, subscriptionId]);

    // Get current room availability
    const getCurrentAvailability = useCallback(async (targetRoomId?: string) => {
        const id = targetRoomId || roomId;
        if (!id) return null;

        try {
            const room = await roomQueries.getById(id);
            const now = new Date().toISOString();
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const bookings = await bookingQueries.getByDateRange(
                now,
                endOfDay.toISOString(),
                id
            );

            const currentBooking = bookings.find(booking => {
                const start = new Date(booking.start_time);
                const end = new Date(booking.end_time);
                const current = new Date();
                return start <= current && current <= end && booking.status === 'confirmed';
            });

            return {
                room,
                isAvailable: room.is_active && !currentBooking,
                currentBooking,
                upcomingBookings: bookings.filter(booking =>
                    new Date(booking.start_time) > new Date() && booking.status === 'confirmed'
                )
            };
        } catch (error) {
            console.error('Error getting current availability:', error);
            return null;
        }
    }, [roomId]);

    return {
        connectionStatus,
        lastUpdate,
        reconnect,
        getCurrentAvailability,
        isConnected: connectionStatus === 'connected',
        isConnecting: connectionStatus === 'connecting',
        hasError: connectionStatus === 'error',
    };
};

// Hook for real-time booking conflict detection
export const useRealTimeConflictDetection = (
    roomId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string | null
) => {
    const [conflicts, setConflicts] = useState<Booking[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

    // Handle conflict updates
    const handleConflictUpdate = useCallback((newConflicts: Booking[]) => {
        setConflicts(newConflicts);
        setIsChecking(false);
    }, []);

    // Subscribe to conflict detection
    useEffect(() => {
        if (!roomId || !startTime || !endTime) return;

        setIsChecking(true);

        const id = RealtimeService.subscribeToBookingConflicts(
            roomId,
            startTime,
            endTime,
            excludeBookingId || null,
            handleConflictUpdate
        );

        setSubscriptionId(id);

        // Initial conflict check
        bookingQueries.checkConflicts(roomId, startTime, endTime, excludeBookingId)
            .then(initialConflicts => {
                setConflicts(initialConflicts || []);
                setIsChecking(false);
            })
            .catch(error => {
                console.error('Error checking initial conflicts:', error);
                setIsChecking(false);
            });

        return () => {
            if (id) {
                RealtimeService.unsubscribe(id);
            }
        };
    }, [roomId, startTime, endTime, excludeBookingId, handleConflictUpdate]);

    return {
        conflicts,
        hasConflicts: conflicts.length > 0,
        isChecking,
        conflictCount: conflicts.length,
    };
};

// Hook for global real-time room availability updates
export const useGlobalRoomAvailability = (options: {
    onAvailabilityChange?: (roomId: string, isAvailable: boolean, booking?: Booking, room?: Room) => void;
    autoReconnect?: boolean;
} = {}) => {
    const queryClient = useQueryClient();
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [availabilityUpdates, setAvailabilityUpdates] = useState<Array<{
        roomId: string;
        isAvailable: boolean;
        timestamp: Date;
        type: 'booking' | 'room';
    }>>([]);

    const { onAvailabilityChange, autoReconnect = true } = options;

    // Handle global availability updates
    const handleGlobalUpdate = useCallback((payload: {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE';
        booking?: Booking;
        room?: Room;
        roomId?: string;
        isAvailable?: boolean;
    }) => {
        console.log('Global room availability update:', payload);
        setLastUpdate(new Date());

        const roomId = payload.roomId || payload.booking?.room_id || payload.room?.id;
        if (!roomId) return;

        // Update availability tracking
        setAvailabilityUpdates(prev => [
            ...prev.slice(-9), // Keep last 10 updates
            {
                roomId,
                isAvailable: payload.isAvailable ?? true,
                timestamp: new Date(),
                type: payload.booking ? 'booking' : 'room'
            }
        ]);

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
        queryClient.invalidateQueries({ queryKey: ['bookings', 'room', roomId] });

        // Trigger callback
        if (onAvailabilityChange && payload.isAvailable !== undefined) {
            onAvailabilityChange(roomId, payload.isAvailable, payload.booking, payload.room);
        }
    }, [queryClient, onAvailabilityChange]);

    // Subscribe to global updates
    useEffect(() => {
        const id = RealtimeService.subscribeToGlobalRoomAvailability(handleGlobalUpdate);
        setSubscriptionId(id);

        return () => {
            if (id) {
                RealtimeService.unsubscribe(id);
            }
        };
    }, [handleGlobalUpdate]);

    // Monitor connection status
    useEffect(() => {
        const unsubscribe = RealtimeService.addConnectionListener((status) => {
            setConnectionStatus(status);

            // Auto-reconnect if connection is lost
            if (status === 'error' && autoReconnect) {
                console.log('Global availability connection error, attempting to reconnect...');
                setTimeout(() => {
                    RealtimeService.reconnectAll();
                }, 2000);
            }
        });

        return unsubscribe;
    }, [autoReconnect]);

    return {
        connectionStatus,
        lastUpdate,
        availabilityUpdates,
        isConnected: connectionStatus === 'connected',
        isConnecting: connectionStatus === 'connecting',
        hasError: connectionStatus === 'error',
    };
};

// Enhanced hook for real-time booking conflict detection with prevention
export const useEnhancedRealTimeConflictDetection = (
    roomId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string | null
) => {
    const [conflicts, setConflicts] = useState<Booking[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [hasRealTimeConflict, setHasRealTimeConflict] = useState(false);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [conflictHistory, setConflictHistory] = useState<Array<{
        timestamp: Date;
        conflictCount: number;
        isRealTime: boolean;
    }>>([]);

    // Handle enhanced conflict updates
    const handleConflictUpdate = useCallback((newConflicts: Booking[], isRealTime: boolean) => {
        setConflicts(newConflicts);
        setHasRealTimeConflict(isRealTime);
        setIsChecking(false);

        // Track conflict history
        setConflictHistory(prev => [
            ...prev.slice(-9), // Keep last 10 checks
            {
                timestamp: new Date(),
                conflictCount: newConflicts.length,
                isRealTime
            }
        ]);
    }, []);

    // Subscribe to enhanced conflict detection
    useEffect(() => {
        if (!roomId || !startTime || !endTime) return;

        setIsChecking(true);

        const id = RealtimeService.subscribeToEnhancedBookingConflicts(
            roomId,
            startTime,
            endTime,
            excludeBookingId || null,
            handleConflictUpdate
        );

        setSubscriptionId(id);

        return () => {
            if (id) {
                RealtimeService.unsubscribe(id);
            }
        };
    }, [roomId, startTime, endTime, excludeBookingId, handleConflictUpdate]);

    return {
        conflicts,
        hasConflicts: conflicts.length > 0,
        hasRealTimeConflict,
        isChecking,
        conflictCount: conflicts.length,
        conflictHistory,
    };
};

// Hook for enhanced admin notifications
export const useEnhancedAdminNotifications = (adminUserId: string) => {
    const [notifications, setNotifications] = useState<Array<{
        notification: Notification;
        isRealTime: boolean;
        priority: 'low' | 'medium' | 'high' | 'critical';
        source: 'booking' | 'room' | 'system' | 'user';
        timestamp: Date;
    }>>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

    // Handle admin notification updates
    const handleNotificationUpdate = useCallback((payload: {
        notification: Notification;
        isRealTime: boolean;
        priority: 'low' | 'medium' | 'high' | 'critical';
        source: 'booking' | 'room' | 'system' | 'user';
        timestamp: Date;
    }) => {
        setNotifications(prev => [
            payload,
            ...prev.slice(0, 49) // Keep last 50 notifications
        ]);
    }, []);

    // Subscribe to enhanced admin notifications
    useEffect(() => {
        if (!adminUserId) return;

        const id = RealtimeService.subscribeToRealTimeAdminNotifications(
            adminUserId,
            handleNotificationUpdate
        );

        setSubscriptionId(id);

        return () => {
            if (id) {
                RealtimeService.unsubscribe(id);
            }
        };
    }, [adminUserId, handleNotificationUpdate]);

    // Monitor connection status
    useEffect(() => {
        const unsubscribe = RealtimeService.addConnectionListener(setConnectionStatus);
        return unsubscribe;
    }, []);

    return {
        notifications,
        connectionStatus,
        isConnected: connectionStatus === 'connected',
        recentNotifications: notifications.slice(0, 10),
        realTimeNotifications: notifications.filter(n => n.isRealTime),
        criticalNotifications: notifications.filter(n => n.priority === 'critical'),
        highPriorityNotifications: notifications.filter(n => n.priority === 'high'),
    };
};

// Hook for connection status monitoring with detailed metrics
export const useRealtimeConnectionStatus = () => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [healthCheck, setHealthCheck] = useState<ReturnType<typeof RealtimeService.performHealthCheck> | null>(null);
    const [detailedStatus, setDetailedStatus] = useState<ReturnType<typeof RealtimeService.getDetailedConnectionStatus> | null>(null);
    const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(false);

    useEffect(() => {
        // Initial status
        setStatus(RealtimeService.getConnectionStatus());

        // Subscribe to status changes
        const unsubscribe = RealtimeService.addConnectionListener(setStatus);

        // Enable enhanced connection monitoring
        const cleanupMonitoring = RealtimeService.enableEnhancedConnectionMonitoring({
            autoReconnect: true,
            reconnectDelay: 2000,
            maxReconnectAttempts: 5,
            healthCheckInterval: 30000
        });

        setIsMonitoringEnabled(true);

        // Periodic health check and detailed status
        const healthCheckInterval = setInterval(() => {
            setHealthCheck(RealtimeService.performHealthCheck());
            setDetailedStatus(RealtimeService.getDetailedConnectionStatus());
        }, 30000); // Every 30 seconds

        return () => {
            unsubscribe();
            cleanupMonitoring();
            clearInterval(healthCheckInterval);
            setIsMonitoringEnabled(false);
        };
    }, []);

    const reconnectAll = useCallback(() => {
        RealtimeService.reconnectAll();
    }, []);

    return {
        status,
        healthCheck,
        detailedStatus,
        reconnectAll,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        hasError: status === 'error',
        isDisconnected: status === 'disconnected',
        isMonitoringEnabled,
    };
};

// Hook for enhanced global room availability synchronization
export const useEnhancedGlobalRoomSync = (options: {
    onAvailabilityChange?: (roomId: string, isAvailable: boolean, source: 'booking' | 'room', timestamp: Date) => void;
    onRealTimeUpdate?: (roomId: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', isRealTime: boolean) => void;
} = {}) => {
    const queryClient = useQueryClient();
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [syncUpdates, setSyncUpdates] = useState<Array<{
        roomId: string;
        isAvailable: boolean;
        timestamp: Date;
        eventType: 'INSERT' | 'UPDATE' | 'DELETE';
        source: 'booking' | 'room';
        clientId?: string;
    }>>([]);

    const { onAvailabilityChange, onRealTimeUpdate } = options;

    // Handle global sync updates
    const handleGlobalSyncUpdate = useCallback((payload: {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE';
        booking?: Booking;
        room?: Room;
        roomId: string;
        isAvailable: boolean;
        timestamp: Date;
        clientId?: string;
    }) => {
        console.log('Enhanced global room sync update:', payload);
        setLastUpdate(new Date());

        const source = payload.booking ? 'booking' : 'room';

        // Update sync tracking
        setSyncUpdates(prev => [
            {
                roomId: payload.roomId,
                isAvailable: payload.isAvailable,
                timestamp: payload.timestamp,
                eventType: payload.eventType,
                source,
                clientId: payload.clientId
            },
            ...prev.slice(0, 49) // Keep last 50 updates
        ]);

        // Invalidate relevant queries for real-time updates
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['rooms', payload.roomId] });
        queryClient.invalidateQueries({ queryKey: ['bookings', 'room', payload.roomId] });
        queryClient.invalidateQueries({ queryKey: ['rooms', 'availability'] });

        // Trigger callbacks
        if (onAvailabilityChange) {
            onAvailabilityChange(payload.roomId, payload.isAvailable, source, payload.timestamp);
        }

        if (onRealTimeUpdate) {
            onRealTimeUpdate(payload.roomId, payload.eventType, true);
        }
    }, [queryClient, onAvailabilityChange, onRealTimeUpdate]);

    // Subscribe to enhanced global sync
    useEffect(() => {
        const id = RealtimeService.subscribeToGlobalRoomSync(handleGlobalSyncUpdate);
        setSubscriptionId(id);

        return () => {
            if (id) {
                RealtimeService.unsubscribe(id);
            }
        };
    }, [handleGlobalSyncUpdate]);

    // Monitor connection status
    useEffect(() => {
        const unsubscribe = RealtimeService.addConnectionListener(setConnectionStatus);
        return unsubscribe;
    }, []);

    return {
        connectionStatus,
        lastUpdate,
        syncUpdates,
        recentUpdates: syncUpdates.slice(0, 10),
        isConnected: connectionStatus === 'connected',
        isConnecting: connectionStatus === 'connecting',
        hasError: connectionStatus === 'error',
    };
};

// Hook for enhanced real-time conflict prevention
export const useEnhancedRealTimeConflictPrevention = (
    roomId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string | null
) => {
    const [conflictState, setConflictState] = useState<{
        hasConflict: boolean;
        conflicts: Booking[];
        isRealTimeConflict: boolean;
        conflictSource: 'existing' | 'realtime';
        timestamp: Date;
    }>({
        hasConflict: false,
        conflicts: [],
        isRealTimeConflict: false,
        conflictSource: 'existing',
        timestamp: new Date()
    });
    const [isChecking, setIsChecking] = useState(false);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [conflictHistory, setConflictHistory] = useState<Array<{
        timestamp: Date;
        hasConflict: boolean;
        conflictCount: number;
        isRealTime: boolean;
        source: 'existing' | 'realtime';
    }>>([]);

    // Handle conflict prevention updates
    const handleConflictUpdate = useCallback((payload: {
        hasConflict: boolean;
        conflicts: Booking[];
        isRealTimeConflict: boolean;
        conflictSource: 'existing' | 'realtime';
        timestamp: Date;
    }) => {
        setConflictState(payload);
        setIsChecking(false);

        // Track conflict history
        setConflictHistory(prev => [
            {
                timestamp: payload.timestamp,
                hasConflict: payload.hasConflict,
                conflictCount: payload.conflicts.length,
                isRealTime: payload.isRealTimeConflict,
                source: payload.conflictSource
            },
            ...prev.slice(0, 19) // Keep last 20 checks
        ]);
    }, []);

    // Subscribe to enhanced conflict prevention
    useEffect(() => {
        if (!roomId || !startTime || !endTime) return;

        setIsChecking(true);

        const id = RealtimeService.subscribeToRealTimeConflictPrevention(
            roomId,
            startTime,
            endTime,
            excludeBookingId || null,
            handleConflictUpdate
        );

        setSubscriptionId(id);

        return () => {
            if (id) {
                RealtimeService.unsubscribe(id);
            }
        };
    }, [roomId, startTime, endTime, excludeBookingId, handleConflictUpdate]);

    return {
        ...conflictState,
        isChecking,
        conflictHistory,
        recentConflicts: conflictHistory.slice(0, 5),
        realTimeConflicts: conflictHistory.filter(c => c.isRealTime),
    };
};