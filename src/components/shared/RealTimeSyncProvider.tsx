import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    useEnhancedGlobalRoomSync,
    useRealtimeConnectionStatus,
    useEnhancedAdminNotifications
} from '@/hooks/useRealTimeAvailability';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ConnectionStatus } from '@/lib/realtimeService';

interface RealTimeSyncContextType {
    connectionStatus: ConnectionStatus;
    isConnected: boolean;
    lastUpdate: Date | null;
    syncUpdates: Array<{
        roomId: string;
        isAvailable: boolean;
        timestamp: Date;
        eventType: 'INSERT' | 'UPDATE' | 'DELETE';
        source: 'booking' | 'room';
    }>;
    adminNotifications: Array<{
        notification: any;
        isRealTime: boolean;
        priority: 'low' | 'medium' | 'high' | 'critical';
        source: 'booking' | 'room' | 'system' | 'user';
        timestamp: Date;
    }>;
    reconnect: () => void;
}

const RealTimeSyncContext = createContext<RealTimeSyncContextType | undefined>(undefined);

interface RealTimeSyncProviderProps {
    children: ReactNode;
    enableToasts?: boolean;
    enableAdminNotifications?: boolean;
}

export const RealTimeSyncProvider: React.FC<RealTimeSyncProviderProps> = ({
    children,
    enableToasts = true,
    enableAdminNotifications = true
}) => {
    const queryClient = useQueryClient();
    const { userProfile, user, loading } = useAuth();
    const [roomUpdateCount, setRoomUpdateCount] = useState(0);
    const [lastToastTime, setLastToastTime] = useState<Date | null>(null);

    // Don't initialize realtime connections until user is authenticated
    const shouldEnableRealtime = !loading && !!user;

    // Enhanced global room synchronization - only when authenticated
    const {
        connectionStatus,
        lastUpdate,
        syncUpdates,
        isConnected
    } = useEnhancedGlobalRoomSync(shouldEnableRealtime ? {
        onAvailabilityChange: (roomId, isAvailable, source, timestamp) => {
            console.log(`Room ${roomId} availability changed:`, { isAvailable, source, timestamp });

            // Show toast notification for room availability changes
            if (enableToasts && isConnected) {
                const now = new Date();
                // Throttle toasts to prevent spam (max 1 per 5 seconds)
                if (!lastToastTime || now.getTime() - lastToastTime.getTime() > 5000) {
                    const message = isAvailable
                        ? `Room became available`
                        : `Room is now occupied`;

                    toast.info(message, {
                        description: `Real-time update from ${source}`,
                        duration: 3000,
                    });

                    setLastToastTime(now);
                }
            }

            setRoomUpdateCount(prev => prev + 1);
        },
        onRealTimeUpdate: (roomId, eventType, isRealTime) => {
            if (isRealTime) {
                console.log(`Real-time ${eventType} event for room ${roomId}`);
            }
        }
    } : {});

    // Connection status monitoring
    const { reconnectAll, isMonitoringEnabled } = useRealtimeConnectionStatus();

    // Enhanced admin notifications (only for admin users and when authenticated)
    const {
        notifications: adminNotifications,
        criticalNotifications,
        highPriorityNotifications
    } = useEnhancedAdminNotifications(
        shouldEnableRealtime && enableAdminNotifications && userProfile?.role === 'admin' ? userProfile.id : ''
    );

    // Handle critical admin notifications with immediate toasts
    useEffect(() => {
        if (!enableToasts || !enableAdminNotifications || userProfile?.role !== 'admin') return;

        criticalNotifications.forEach(notification => {
            if (notification.isRealTime) {
                toast.error('Critical System Alert', {
                    description: notification.notification.message,
                    duration: 10000, // 10 seconds for critical alerts
                    action: {
                        label: 'View Details',
                        onClick: () => {
                            // Navigate to admin dashboard or show details
                            console.log('Critical notification details:', notification);
                        }
                    }
                });
            }
        });
    }, [criticalNotifications, enableToasts, enableAdminNotifications, userProfile?.role]);

    // Handle high priority admin notifications
    useEffect(() => {
        if (!enableToasts || !enableAdminNotifications || userProfile?.role !== 'admin') return;

        highPriorityNotifications.forEach(notification => {
            if (notification.isRealTime && notification.priority === 'high') {
                toast.warning('Admin Alert', {
                    description: notification.notification.message,
                    duration: 7000,
                });
            }
        });
    }, [highPriorityNotifications, enableToasts, enableAdminNotifications, userProfile?.role]);

    // Connection status change notifications
    useEffect(() => {
        if (!enableToasts) return;

        if (connectionStatus === 'connected' && roomUpdateCount > 0) {
            toast.success('Real-time sync connected', {
                description: 'Live updates are now active',
                duration: 3000,
            });
        } else if (connectionStatus === 'error') {
            toast.error('Real-time sync error', {
                description: 'Some features may not update automatically',
                duration: 5000,
                action: {
                    label: 'Retry',
                    onClick: reconnectAll
                }
            });
        }
    }, [connectionStatus, enableToasts, roomUpdateCount, reconnectAll]);

    const contextValue: RealTimeSyncContextType = {
        connectionStatus,
        isConnected,
        lastUpdate,
        syncUpdates,
        adminNotifications,
        reconnect: reconnectAll
    };

    return (
        <RealTimeSyncContext.Provider value={contextValue}>
            {children}
        </RealTimeSyncContext.Provider>
    );
};

export const useRealTimeSync = (): RealTimeSyncContextType => {
    const context = useContext(RealTimeSyncContext);
    if (context === undefined) {
        throw new Error('useRealTimeSync must be used within a RealTimeSyncProvider');
    }
    return context;
};

// Higher-order component for easy integration
export const withRealTimeSync = <P extends object>(
    Component: React.ComponentType<P>,
    options?: {
        enableToasts?: boolean;
        enableAdminNotifications?: boolean;
    }
) => {
    return (props: P) => (
        <RealTimeSyncProvider {...options}>
            <Component {...props} />
        </RealTimeSyncProvider>
    );
};