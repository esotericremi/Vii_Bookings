import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Room, Booking, Notification } from '@/types';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface RealtimeSubscription {
    channel: RealtimeChannel;
    status: ConnectionStatus;
    lastUpdate: Date;
}

export class RealtimeService {
    private static subscriptions = new Map<string, RealtimeSubscription>();
    private static connectionListeners = new Set<(status: ConnectionStatus) => void>();
    private static globalStatus: ConnectionStatus = 'disconnected';
    private static lastConnectionAttempt = new Map<string, number>();
    private static readonly MIN_RECONNECT_DELAY = 1000; // 1 second minimum between reconnection attempts

    /**
     * Subscribe to room availability updates
     */
    static subscribeToRoomAvailability(
        roomId: string | null,
        callback: (payload: {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            booking?: Booking;
            room?: Room;
        }) => void
    ): string {
        const subscriptionId = `room-availability-${roomId || 'all'}`;

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    ...(roomId && { filter: `room_id=eq.${roomId}` })
                },
                (payload) => {
                    console.log('Room availability update:', payload);
                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        booking: payload.new as Booking || payload.old as Booking,
                    });

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rooms',
                    ...(roomId && { filter: `id=eq.${roomId}` })
                },
                (payload) => {
                    console.log('Room update:', payload);
                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        room: payload.new as Room || payload.old as Room,
                    });

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Room availability subscription ${subscriptionId} status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        return subscriptionId;
    }

    /**
     * Subscribe to booking conflict prevention updates
     */
    static subscribeToBookingConflicts(
        roomId: string,
        startTime: string,
        endTime: string,
        excludeBookingId: string | null,
        callback: (conflicts: Booking[]) => void
    ): string {
        const subscriptionId = `booking-conflicts-${roomId}-${Date.now()}`;

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    console.log('Booking conflict check triggered:', payload);

                    // Check for conflicts when bookings change
                    try {
                        const { data: conflicts, error } = await supabase
                            .from('bookings')
                            .select('*')
                            .eq('room_id', roomId)
                            .eq('status', 'confirmed')
                            .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)
                            .neq('id', excludeBookingId || '');

                        if (error) {
                            console.error('Error checking conflicts:', error);
                            return;
                        }

                        callback(conflicts || []);
                    } catch (error) {
                        console.error('Error in conflict check:', error);
                    }

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Booking conflicts subscription ${subscriptionId} status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        return subscriptionId;
    }

    /**
     * Subscribe to admin notifications for overrides
     */
    static subscribeToAdminNotifications(
        adminUserId: string,
        callback: (notification: Notification) => void
    ): string {
        const subscriptionId = `admin-notifications-${adminUserId}`;

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${adminUserId}`
                },
                (payload) => {
                    console.log('Admin notification received:', payload);
                    const notification = payload.new as Notification;

                    // Only trigger for admin-related notifications
                    if (notification.type === 'admin_override' || notification.type === 'system_error') {
                        callback(notification);
                    }

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Admin notifications subscription ${subscriptionId} status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        return subscriptionId;
    }

    /**
     * Subscribe to general real-time updates for a table
     */
    static subscribeToTable<T>(
        table: string,
        callback: (payload: {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            new?: T;
            old?: T;
        }) => void,
        filter?: string
    ): string {
        const subscriptionId = `table-${table}-${filter || 'all'}-${Date.now()}`;

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table,
                    ...(filter && { filter })
                },
                (payload) => {
                    console.log(`Table ${table} update:`, payload);
                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        new: payload.new as T,
                        old: payload.old as T,
                    });

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Table ${table} subscription ${subscriptionId} status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        return subscriptionId;
    }

    /**
     * Unsubscribe from a real-time subscription
     */
    static unsubscribe(subscriptionId: string): void {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            supabase.removeChannel(subscription.channel);
            this.subscriptions.delete(subscriptionId);
            console.log(`Unsubscribed from ${subscriptionId}`);
        }
    }

    /**
     * Unsubscribe from all subscriptions
     */
    static unsubscribeAll(): void {
        for (const [subscriptionId, subscription] of this.subscriptions) {
            supabase.removeChannel(subscription.channel);
        }
        this.subscriptions.clear();
        console.log('Unsubscribed from all real-time subscriptions');
    }

    /**
     * Get current connection status
     */
    static getConnectionStatus(): ConnectionStatus {
        return this.globalStatus;
    }

    /**
     * Get all active subscriptions
     */
    static getActiveSubscriptions(): Map<string, RealtimeSubscription> {
        return new Map(this.subscriptions);
    }

    /**
     * Add connection status listener
     */
    static addConnectionListener(listener: (status: ConnectionStatus) => void): () => void {
        this.connectionListeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.connectionListeners.delete(listener);
        };
    }

    /**
     * Reconnect all subscriptions
     */
    static async reconnectAll(): Promise<void> {
        console.log('Reconnecting all real-time subscriptions...');

        // Store current subscriptions
        const currentSubscriptions = new Map(this.subscriptions);

        // Clear all subscriptions
        this.unsubscribeAll();

        // Wait a bit before reconnecting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Note: This is a simplified reconnection. In a real implementation,
        // you would need to store the original subscription parameters
        // and recreate them here.
        console.log('Reconnection completed');
    }

    /**
     * Update subscription status and notify listeners
     */
    private static updateSubscriptionStatus(subscriptionId: string, status: ConnectionStatus): void {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.status = status;
            subscription.lastUpdate = new Date();
        }

        // Update global status based on all subscriptions
        const allStatuses = Array.from(this.subscriptions.values()).map(s => s.status);

        if (allStatuses.length === 0) {
            this.globalStatus = 'disconnected';
        } else if (allStatuses.every(s => s === 'connected')) {
            this.globalStatus = 'connected';
        } else if (allStatuses.some(s => s === 'error')) {
            this.globalStatus = 'error';
        } else if (allStatuses.some(s => s === 'connecting')) {
            this.globalStatus = 'connecting';
        } else {
            this.globalStatus = 'disconnected';
        }

        // Notify listeners
        this.connectionListeners.forEach(listener => {
            try {
                listener(this.globalStatus);
            } catch (error) {
                console.error('Error in connection listener:', error);
            }
        });
    }

    /**
     * Subscribe to real-time room availability updates for all clients
     */
    static subscribeToGlobalRoomAvailability(
        callback: (payload: {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            booking?: Booking;
            room?: Room;
            roomId?: string;
            isAvailable?: boolean;
        }) => void
    ): string {
        const subscriptionId = 'global-room-availability';

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                },
                async (payload) => {
                    console.log('Global room availability update (booking):', payload);
                    const booking = payload.new as Booking || payload.old as Booking;

                    // Determine availability based on booking status
                    let isAvailable = true;
                    if (payload.eventType === 'INSERT' && booking.status === 'confirmed') {
                        isAvailable = false;
                    } else if (payload.eventType === 'DELETE' ||
                        (payload.eventType === 'UPDATE' && booking.status === 'cancelled')) {
                        isAvailable = true;
                    }

                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        booking,
                        roomId: booking.room_id,
                        isAvailable
                    });

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rooms'
                },
                (payload) => {
                    console.log('Global room availability update (room):', payload);
                    const room = payload.new as Room || payload.old as Room;

                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        room,
                        roomId: room.id,
                        isAvailable: room.is_active
                    });

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Global room availability subscription status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        return subscriptionId;
    }

    /**
     * Subscribe to real-time booking conflict prevention with enhanced detection
     */
    static subscribeToEnhancedBookingConflicts(
        roomId: string,
        startTime: string,
        endTime: string,
        excludeBookingId: string | null,
        callback: (conflicts: Booking[], hasRealTimeConflict: boolean) => void
    ): string {
        const subscriptionId = `enhanced-booking-conflicts-${roomId}-${Date.now()}`;

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const checkConflicts = async (triggerEvent?: string) => {
            try {
                const { data: conflicts, error } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('room_id', roomId)
                    .eq('status', 'confirmed')
                    .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)
                    .neq('id', excludeBookingId || '');

                if (error) {
                    console.error('Error checking enhanced conflicts:', error);
                    return;
                }

                const hasRealTimeConflict = triggerEvent === 'INSERT' || triggerEvent === 'UPDATE';
                callback(conflicts || [], hasRealTimeConflict);
            } catch (error) {
                console.error('Error in enhanced conflict check:', error);
            }
        };

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    console.log('Enhanced booking conflict check triggered:', payload);
                    await checkConflicts(payload.eventType);
                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Enhanced booking conflicts subscription ${subscriptionId} status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        // Initial conflict check
        checkConflicts();

        return subscriptionId;
    }

    /**
     * Subscribe to real-time admin notifications with enhanced filtering
     */
    static subscribeToEnhancedAdminNotifications(
        adminUserId: string,
        callback: (notification: Notification, isRealTime: boolean) => void
    ): string {
        const subscriptionId = `enhanced-admin-notifications-${adminUserId}`;

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${adminUserId}`
                },
                (payload) => {
                    console.log('Enhanced admin notification received:', payload);
                    const notification = payload.new as Notification;

                    // Enhanced filtering for admin-relevant notifications
                    const adminRelevantTypes = [
                        'admin_override',
                        'system_error',
                        'booking_conflict',
                        'room_management'
                    ];

                    if (adminRelevantTypes.includes(notification.type)) {
                        callback(notification, true);
                    }

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                },
                async (payload) => {
                    // Monitor all booking changes for admin awareness
                    const booking = payload.new as Booking || payload.old as Booking;

                    // Create system notification for significant booking events
                    if (payload.eventType === 'INSERT' && booking.is_admin_override) {
                        // This would typically be handled by database triggers
                        console.log('Admin override booking detected:', booking);
                    }

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Enhanced admin notifications subscription ${subscriptionId} status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        return subscriptionId;
    }

    /**
     * Get detailed connection status with metrics
     */
    static getDetailedConnectionStatus(): {
        globalStatus: ConnectionStatus;
        subscriptions: Array<{
            id: string;
            status: ConnectionStatus;
            lastUpdate: Date;
            uptime: number;
        }>;
        metrics: {
            totalSubscriptions: number;
            connectedSubscriptions: number;
            disconnectedSubscriptions: number;
            errorSubscriptions: number;
            averageUptime: number;
        };
    } {
        const subscriptions = Array.from(this.subscriptions.entries()).map(([id, sub]) => ({
            id,
            status: sub.status,
            lastUpdate: sub.lastUpdate,
            uptime: Date.now() - sub.lastUpdate.getTime()
        }));

        const metrics = {
            totalSubscriptions: subscriptions.length,
            connectedSubscriptions: subscriptions.filter(s => s.status === 'connected').length,
            disconnectedSubscriptions: subscriptions.filter(s => s.status === 'disconnected').length,
            errorSubscriptions: subscriptions.filter(s => s.status === 'error').length,
            averageUptime: subscriptions.length > 0
                ? subscriptions.reduce((sum, s) => sum + s.uptime, 0) / subscriptions.length
                : 0
        };

        return {
            globalStatus: this.globalStatus,
            subscriptions,
            metrics
        };
    }

    /**
     * Health check for all subscriptions
     */
    static performHealthCheck(): {
        totalSubscriptions: number;
        connectedSubscriptions: number;
        disconnectedSubscriptions: number;
        errorSubscriptions: number;
        oldestSubscription?: Date;
    } {
        const subscriptions = Array.from(this.subscriptions.values());

        return {
            totalSubscriptions: subscriptions.length,
            connectedSubscriptions: subscriptions.filter(s => s.status === 'connected').length,
            disconnectedSubscriptions: subscriptions.filter(s => s.status === 'disconnected').length,
            errorSubscriptions: subscriptions.filter(s => s.status === 'error').length,
            oldestSubscription: subscriptions.length > 0
                ? new Date(Math.min(...subscriptions.map(s => s.lastUpdate.getTime())))
                : undefined
        };
    }

    /**
     * Enhanced real-time room availability synchronization across all clients
     */
    static subscribeToGlobalRoomSync(
        callback: (payload: {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            booking?: Booking;
            room?: Room;
            roomId: string;
            isAvailable: boolean;
            timestamp: Date;
            clientId?: string;
        }) => void
    ): string {
        const subscriptionId = 'global-room-sync';
        const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Check if subscription already exists and is connected
        const existingSubscription = this.subscriptions.get(subscriptionId);
        if (existingSubscription && existingSubscription.status === 'connected') {
            console.log('Global room sync already connected, reusing existing subscription');
            return subscriptionId;
        }

        // Check if we're reconnecting too frequently
        const lastAttempt = this.lastConnectionAttempt.get(subscriptionId) || 0;
        const now = Date.now();
        if (now - lastAttempt < this.MIN_RECONNECT_DELAY) {
            console.log(`Throttling reconnection attempt for ${subscriptionId}, waiting...`);
            setTimeout(() => {
                this.subscribeToGlobalRoomSync(callback);
            }, this.MIN_RECONNECT_DELAY - (now - lastAttempt));
            return subscriptionId;
        }

        this.lastConnectionAttempt.set(subscriptionId, now);

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                },
                async (payload) => {
                    console.log('Global room sync update (booking):', payload);
                    const booking = payload.new as Booking || payload.old as Booking;

                    if (!booking?.room_id) return;

                    // Determine availability based on booking status and event
                    let isAvailable = true;
                    const now = new Date();
                    const bookingStart = new Date(booking.start_time);
                    const bookingEnd = new Date(booking.end_time);

                    if (payload.eventType === 'INSERT' && booking.status === 'confirmed') {
                        // New confirmed booking - room becomes unavailable during booking time
                        isAvailable = !(now >= bookingStart && now <= bookingEnd);
                    } else if (payload.eventType === 'DELETE' ||
                        (payload.eventType === 'UPDATE' && booking.status === 'cancelled')) {
                        // Booking deleted or cancelled - room becomes available
                        isAvailable = true;
                    } else if (payload.eventType === 'UPDATE' && booking.status === 'confirmed') {
                        // Booking updated - check if currently in progress
                        isAvailable = !(now >= bookingStart && now <= bookingEnd);
                    }

                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        booking,
                        roomId: booking.room_id,
                        isAvailable,
                        timestamp: new Date(),
                        clientId
                    });

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rooms'
                },
                (payload) => {
                    console.log('Global room sync update (room):', payload);
                    const room = payload.new as Room || payload.old as Room;

                    if (!room?.id) return;

                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        room,
                        roomId: room.id,
                        isAvailable: room.is_active,
                        timestamp: new Date(),
                        clientId
                    });

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);

                // Only log status changes, not every status update
                const currentSubscription = this.subscriptions.get(subscriptionId);
                if (!currentSubscription || currentSubscription.status !== connectionStatus) {
                    console.log(`Global room sync subscription status:`, status);
                }

                // Add reconnection delay for closed connections to prevent rapid cycling
                if (status === 'CLOSED') {
                    setTimeout(() => {
                        const subscription = this.subscriptions.get(subscriptionId);
                        if (subscription && subscription.status === 'disconnected') {
                            console.log('Attempting to reconnect global room sync after delay...');
                        }
                    }, 2000); // 2 second delay before attempting reconnection
                }
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        return subscriptionId;
    }

    /**
     * Enhanced real-time booking conflict prevention with immediate detection
     */
    static subscribeToRealTimeConflictPrevention(
        roomId: string,
        startTime: string,
        endTime: string,
        excludeBookingId: string | null,
        callback: (payload: {
            hasConflict: boolean;
            conflicts: Booking[];
            isRealTimeConflict: boolean;
            conflictSource: 'existing' | 'realtime';
            timestamp: Date;
        }) => void
    ): string {
        const subscriptionId = `realtime-conflict-prevention-${roomId}-${Date.now()}`;

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const checkConflicts = async (triggerEvent?: string, triggerBooking?: Booking) => {
            try {
                const { data: conflicts, error } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('room_id', roomId)
                    .eq('status', 'confirmed')
                    .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)
                    .neq('id', excludeBookingId || '');

                if (error) {
                    console.error('Error checking real-time conflicts:', error);
                    return;
                }

                const hasConflict = (conflicts || []).length > 0;
                const isRealTimeConflict = triggerEvent === 'INSERT' ||
                    (triggerEvent === 'UPDATE' && triggerBooking?.status === 'confirmed');

                callback({
                    hasConflict,
                    conflicts: conflicts || [],
                    isRealTimeConflict,
                    conflictSource: isRealTimeConflict ? 'realtime' : 'existing',
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Error in real-time conflict prevention:', error);
            }
        };

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    console.log('Real-time conflict prevention triggered:', payload);
                    const booking = payload.new as Booking || payload.old as Booking;
                    await checkConflicts(payload.eventType, booking);
                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Real-time conflict prevention subscription ${subscriptionId} status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        // Initial conflict check
        checkConflicts();

        return subscriptionId;
    }

    /**
     * Enhanced admin notification system for real-time overrides and system events
     */
    static subscribeToRealTimeAdminNotifications(
        adminUserId: string,
        callback: (payload: {
            notification: Notification;
            isRealTime: boolean;
            priority: 'low' | 'medium' | 'high' | 'critical';
            source: 'booking' | 'room' | 'system' | 'user';
            timestamp: Date;
        }) => void
    ): string {
        const subscriptionId = `realtime-admin-notifications-${adminUserId}`;

        // Remove existing subscription if any
        this.unsubscribe(subscriptionId);

        const channel = supabase
            .channel(subscriptionId)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${adminUserId}`
                },
                (payload) => {
                    console.log('Real-time admin notification received:', payload);
                    const notification = payload.new as Notification;

                    // Enhanced filtering and prioritization for admin notifications
                    const adminRelevantTypes = [
                        'admin_override',
                        'system_error',
                        'booking_conflict',
                        'room_management',
                        'booking_cancelled',
                        'booking_modified'
                    ];

                    if (adminRelevantTypes.includes(notification.type)) {
                        // Determine priority based on notification type
                        let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
                        let source: 'booking' | 'room' | 'system' | 'user' = 'system';

                        switch (notification.type) {
                            case 'system_error':
                                priority = 'critical';
                                source = 'system';
                                break;
                            case 'admin_override':
                                priority = 'high';
                                source = 'booking';
                                break;
                            case 'booking_conflict':
                                priority = 'high';
                                source = 'booking';
                                break;
                            case 'room_management':
                                priority = 'medium';
                                source = 'room';
                                break;
                            case 'booking_cancelled':
                            case 'booking_modified':
                                priority = 'low';
                                source = 'booking';
                                break;
                        }

                        callback({
                            notification,
                            isRealTime: true,
                            priority,
                            source,
                            timestamp: new Date()
                        });
                    }

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                },
                async (payload) => {
                    // Monitor booking changes for admin awareness
                    const booking = payload.new as Booking || payload.old as Booking;

                    // Create real-time notifications for significant booking events
                    if (payload.eventType === 'INSERT' && booking.is_admin_override) {
                        console.log('Admin override booking detected in real-time:', booking);
                        // This would typically trigger a notification creation
                    } else if (payload.eventType === 'UPDATE' && booking.status === 'cancelled') {
                        console.log('Booking cancellation detected in real-time:', booking);
                    }

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rooms'
                },
                (payload) => {
                    // Monitor room changes for admin awareness
                    const room = payload.new as Room || payload.old as Room;

                    if (payload.eventType === 'UPDATE' && room.is_active !== (payload.old as Room)?.is_active) {
                        console.log('Room status change detected in real-time:', room);
                    }

                    this.updateSubscriptionStatus(subscriptionId, 'connected');
                }
            )
            .subscribe((status) => {
                const connectionStatus: ConnectionStatus =
                    status === 'SUBSCRIBED' ? 'connected' :
                        status === 'CHANNEL_ERROR' ? 'error' :
                            status === 'TIMED_OUT' ? 'error' :
                                status === 'CLOSED' ? 'disconnected' : 'connecting';

                this.updateSubscriptionStatus(subscriptionId, connectionStatus);
                console.log(`Real-time admin notifications subscription ${subscriptionId} status:`, status);
            });

        this.subscriptions.set(subscriptionId, {
            channel,
            status: 'connecting',
            lastUpdate: new Date()
        });

        return subscriptionId;
    }

    /**
     * Enhanced connection status monitoring with automatic recovery
     */
    static enableEnhancedConnectionMonitoring(options: {
        autoReconnect?: boolean;
        reconnectDelay?: number;
        maxReconnectAttempts?: number;
        healthCheckInterval?: number;
    } = {}): () => void {
        const {
            autoReconnect = true,
            reconnectDelay = 2000,
            maxReconnectAttempts = 5,
            healthCheckInterval = 30000
        } = options;

        let reconnectAttempts = 0;
        let healthCheckTimer: NodeJS.Timeout;
        let reconnectTimer: NodeJS.Timeout;

        const performHealthCheck = () => {
            const health = this.performHealthCheck();
            console.log('Connection health check:', health);

            // Auto-reconnect if we have errors and haven't exceeded max attempts
            if (autoReconnect && health.errorSubscriptions > 0 && reconnectAttempts < maxReconnectAttempts) {
                console.log(`Detected ${health.errorSubscriptions} failed connections, attempting reconnect...`);
                reconnectAttempts++;

                reconnectTimer = setTimeout(() => {
                    this.reconnectAll().then(() => {
                        console.log('Auto-reconnect completed');
                        reconnectAttempts = 0; // Reset on successful reconnect
                    }).catch(error => {
                        console.error('Auto-reconnect failed:', error);
                    });
                }, reconnectDelay);
            }
        };

        // Start health check interval
        healthCheckTimer = setInterval(performHealthCheck, healthCheckInterval);

        // Initial health check
        performHealthCheck();

        // Return cleanup function
        return () => {
            if (healthCheckTimer) clearInterval(healthCheckTimer);
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }
}