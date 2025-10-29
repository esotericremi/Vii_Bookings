import React, { useState, useEffect } from 'react';
import { Activity, Users, Calendar, AlertTriangle, TrendingUp, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DetailedConnectionStatus } from '@/components/shared/ConnectionStatusIndicator';
import {
    useGlobalRoomAvailability,
    useEnhancedAdminNotifications,
    useRealtimeConnectionStatus
} from '@/hooks/useRealTimeAvailability';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface RealTimeEvent {
    id: string;
    type: 'booking' | 'room' | 'notification' | 'connection';
    title: string;
    description: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error' | 'success';
    roomId?: string;
    userId?: string;
}

export const RealTimeDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [events, setEvents] = useState<RealTimeEvent[]>([]);
    const [activeUsers, setActiveUsers] = useState(0);
    const [realtimeStats, setRealtimeStats] = useState({
        totalBookings: 0,
        activeRooms: 0,
        conflictsResolved: 0,
        systemAlerts: 0
    });

    // Real-time connection monitoring
    const { status, detailedStatus, healthCheck } = useRealtimeConnectionStatus();

    // Global room availability monitoring
    const { connectionStatus, lastUpdate, availabilityUpdates } = useGlobalRoomAvailability({
        onAvailabilityChange: (roomId, isAvailable, booking, room) => {
            const newEvent: RealTimeEvent = {
                id: `availability-${Date.now()}`,
                type: 'room',
                title: `Room ${isAvailable ? 'Available' : 'Booked'}`,
                description: `${room?.name || 'Room'} is now ${isAvailable ? 'available' : 'unavailable'}`,
                timestamp: new Date(),
                severity: isAvailable ? 'success' : 'info',
                roomId,
                userId: booking?.user_id
            };

            setEvents(prev => [newEvent, ...prev.slice(0, 49)]);

            // Update stats
            setRealtimeStats(prev => ({
                ...prev,
                totalBookings: prev.totalBookings + (isAvailable ? 0 : 1),
                activeRooms: prev.activeRooms + (isAvailable ? -1 : 1)
            }));
        }
    });

    // Enhanced admin notifications
    const {
        notifications: adminNotifications,
        connectionStatus: adminConnectionStatus,
        recentNotifications
    } = useEnhancedAdminNotifications(userProfile?.id || '');

    // Process admin notifications into events
    useEffect(() => {
        recentNotifications.forEach(({ notification, isRealTime, timestamp }) => {
            if (isRealTime) {
                const newEvent: RealTimeEvent = {
                    id: `notification-${notification.id}`,
                    type: 'notification',
                    title: notification.title,
                    description: notification.message,
                    timestamp,
                    severity: notification.type === 'system_error' ? 'error' :
                        notification.type === 'admin_override' ? 'warning' : 'info'
                };

                setEvents(prev => {
                    // Avoid duplicates
                    if (prev.some(e => e.id === newEvent.id)) return prev;
                    return [newEvent, ...prev.slice(0, 49)];
                });

                if (notification.type === 'system_error') {
                    setRealtimeStats(prev => ({
                        ...prev,
                        systemAlerts: prev.systemAlerts + 1
                    }));
                }
            }
        });
    }, [recentNotifications]);

    // Monitor connection status changes
    useEffect(() => {
        const connectionEvent: RealTimeEvent = {
            id: `connection-${Date.now()}`,
            type: 'connection',
            title: `Connection ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            description: `Real-time connection is ${status}`,
            timestamp: new Date(),
            severity: status === 'connected' ? 'success' :
                status === 'error' ? 'error' : 'warning'
        };

        setEvents(prev => [connectionEvent, ...prev.slice(0, 49)]);
    }, [status]);

    const getEventIcon = (type: RealTimeEvent['type']) => {
        switch (type) {
            case 'booking':
                return Calendar;
            case 'room':
                return Activity;
            case 'notification':
                return AlertTriangle;
            case 'connection':
                return Wifi;
            default:
                return Activity;
        }
    };

    const getEventColor = (severity: RealTimeEvent['severity']) => {
        switch (severity) {
            case 'success':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'warning':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'error':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return date.toLocaleTimeString();
    };

    if (userProfile?.role !== 'admin') {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Access denied. This dashboard is only available to administrators.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Real-time Dashboard</h2>
                    <p className="text-muted-foreground">
                        Monitor live system activity and real-time updates
                    </p>
                </div>
                <DetailedConnectionStatus />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {healthCheck?.connectedSubscriptions || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            of {healthCheck?.totalSubscriptions || 0} total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Live Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{realtimeStats.totalBookings}</div>
                        <p className="text-xs text-muted-foreground">
                            Real-time updates
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Room Updates</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{availabilityUpdates.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Recent changes
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{realtimeStats.systemAlerts}</div>
                        <p className="text-xs text-muted-foreground">
                            Requires attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="events" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="events">Live Events</TabsTrigger>
                    <TabsTrigger value="connections">Connections</TabsTrigger>
                    <TabsTrigger value="notifications">Admin Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Real-time Events
                                {events.length > 0 && (
                                    <Badge variant="secondary">{events.length}</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                {events.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No events yet</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Real-time events will appear here as they occur.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {events.map((event, index) => {
                                            const Icon = getEventIcon(event.type);
                                            return (
                                                <React.Fragment key={event.id}>
                                                    <div className={cn(
                                                        'flex items-start gap-3 p-3 rounded-lg border',
                                                        getEventColor(event.severity)
                                                    )}>
                                                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-sm font-medium">
                                                                    {event.title}
                                                                </h4>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatTimeAgo(event.timestamp)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {event.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {index < events.length - 1 && <Separator />}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="connections" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connection Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {detailedStatus ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Global Status:</span>
                                            <Badge
                                                variant={detailedStatus.globalStatus === 'connected' ? 'default' : 'destructive'}
                                                className="ml-2"
                                            >
                                                {detailedStatus.globalStatus}
                                            </Badge>
                                        </div>
                                        <div>
                                            <span className="font-medium">Active Subscriptions:</span>
                                            <span className="ml-2">{detailedStatus.metrics.connectedSubscriptions}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h4 className="font-medium mb-2">Subscription Details</h4>
                                        <div className="space-y-2">
                                            {detailedStatus.subscriptions.map((sub) => (
                                                <div key={sub.id} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            'h-2 w-2 rounded-full',
                                                            sub.status === 'connected' ? 'bg-green-500' :
                                                                sub.status === 'error' ? 'bg-red-500' :
                                                                    'bg-yellow-500'
                                                        )} />
                                                        <span className="font-mono text-xs">
                                                            {sub.id.replace(/^(.*?)-.*/, '$1')}
                                                        </span>
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {formatTimeAgo(sub.lastUpdate)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Loading connection details...</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Admin Notifications
                                <Badge
                                    variant={adminConnectionStatus === 'connected' ? 'default' : 'destructive'}
                                >
                                    {adminConnectionStatus}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                {recentNotifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No admin notifications</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Admin-specific notifications will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recentNotifications.map(({ notification, isRealTime, timestamp }, index) => (
                                            <React.Fragment key={notification.id}>
                                                <div className="flex items-start gap-3 p-3 border rounded-lg">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-sm font-medium">
                                                                {notification.title}
                                                                {isRealTime && (
                                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                                        Live
                                                                    </Badge>
                                                                )}
                                                            </h4>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTimeAgo(timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                </div>
                                                {index < recentNotifications.length - 1 && <Separator />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};