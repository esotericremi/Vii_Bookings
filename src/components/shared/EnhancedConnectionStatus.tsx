import React, { useState } from 'react';
import {
    Wifi,
    WifiOff,
    AlertTriangle,
    RefreshCw,
    Activity,
    Zap,
    Clock,
    Users,
    Shield,
    TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useRealtimeConnectionStatus } from '@/hooks/useRealTimeAvailability';
import { useRealTimeSyncSafe } from './RealTimeSyncProvider';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface EnhancedConnectionStatusProps {
    className?: string;
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'compact' | 'detailed' | 'admin';
}

export const EnhancedConnectionStatus: React.FC<EnhancedConnectionStatusProps> = ({
    className,
    showDetails = false,
    size = 'md',
    variant = 'compact'
}) => {
    const [showPopover, setShowPopover] = useState(false);
    const { userProfile } = useAuth();

    const {
        status,
        healthCheck,
        detailedStatus,
        reconnectAll,
        isConnected,
        isConnecting,
        hasError,
        isDisconnected,
        isMonitoringEnabled
    } = useRealtimeConnectionStatus();

    // Safely use RealTimeSync hook with fallback
    const realTimeSync = useRealTimeSyncSafe();
    const syncStatus = realTimeSync?.connectionStatus || 'disconnected';
    const lastUpdate = realTimeSync?.lastUpdate || null;
    const syncUpdates = realTimeSync?.syncUpdates || 0;
    const adminNotifications = realTimeSync?.adminNotifications || [];

    const getStatusConfig = () => {
        if (isConnected) {
            return {
                icon: Wifi,
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                borderColor: 'border-green-200',
                label: 'Connected',
                description: 'Real-time sync active'
            };
        } else if (isConnecting) {
            return {
                icon: RefreshCw,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-100',
                borderColor: 'border-yellow-200',
                label: 'Connecting',
                description: 'Establishing connection...'
            };
        } else if (hasError) {
            return {
                icon: AlertTriangle,
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                borderColor: 'border-red-200',
                label: 'Error',
                description: 'Connection failed'
            };
        } else {
            return {
                icon: WifiOff,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100',
                borderColor: 'border-gray-200',
                label: 'Disconnected',
                description: 'Real-time updates unavailable'
            };
        }
    };

    const statusConfig = getStatusConfig();
    const Icon = statusConfig.icon;

    const formatUptime = (uptime: number) => {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    const formatLastUpdate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return date.toLocaleTimeString();
    };

    const getConnectionQuality = () => {
        if (!healthCheck) return 0;

        const { totalSubscriptions, connectedSubscriptions, errorSubscriptions } = healthCheck;
        if (totalSubscriptions === 0) return 0;

        const quality = ((connectedSubscriptions - errorSubscriptions) / totalSubscriptions) * 100;
        return Math.max(0, Math.min(100, quality));
    };

    const connectionQuality = getConnectionQuality();

    // Compact variant for headers/toolbars
    if (variant === 'compact' && !showDetails) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            'flex items-center gap-2 px-2 py-1 rounded-full border',
                            statusConfig.bgColor,
                            statusConfig.borderColor,
                            className
                        )}>
                            <Icon className={cn(
                                statusConfig.color,
                                size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
                                isConnecting && 'animate-spin'
                            )} />
                            {size !== 'sm' && (
                                <span className={cn(
                                    'text-xs font-medium',
                                    statusConfig.color
                                )}>
                                    {statusConfig.label}
                                </span>
                            )}
                            {isConnected && lastUpdate && (
                                <Zap className="h-3 w-3 text-green-500 animate-pulse" />
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="space-y-1">
                            <p>{statusConfig.description}</p>
                            {healthCheck && (
                                <p className="text-xs text-muted-foreground">
                                    {healthCheck.connectedSubscriptions}/{healthCheck.totalSubscriptions} active
                                </p>
                            )}
                            {lastUpdate && (
                                <p className="text-xs text-muted-foreground">
                                    Last update: {formatLastUpdate(lastUpdate)}
                                </p>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Detailed popover variant
    return (
        <Popover open={showPopover} onOpenChange={setShowPopover}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'flex items-center gap-2 h-auto px-3 py-2 border rounded-lg',
                        statusConfig.bgColor,
                        statusConfig.borderColor,
                        className
                    )}
                >
                    <Icon className={cn(
                        statusConfig.color,
                        'h-4 w-4',
                        isConnecting && 'animate-spin'
                    )} />
                    <div className="flex flex-col items-start">
                        <span className={cn('text-xs font-medium', statusConfig.color)}>
                            {statusConfig.label}
                        </span>
                        {healthCheck && (
                            <span className="text-xs text-muted-foreground">
                                {healthCheck.connectedSubscriptions}/{healthCheck.totalSubscriptions} active
                            </span>
                        )}
                    </div>
                    {isConnected && (
                        <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-green-500" />
                            <Badge variant="outline" className="h-5 px-1 text-xs bg-green-50">
                                Live
                            </Badge>
                        </div>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-96" align="end">
                <Card className="border-0 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4" />
                            Real-time Connection Status
                            {isMonitoringEnabled && (
                                <Badge variant="outline" className="text-xs">
                                    Auto-monitoring
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Current Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon className={cn(
                                    statusConfig.color,
                                    'h-4 w-4',
                                    isConnecting && 'animate-spin'
                                )} />
                                <span className="text-sm font-medium">{statusConfig.label}</span>
                                {isConnected && (
                                    <Zap className="h-3 w-3 text-green-500 animate-pulse" />
                                )}
                            </div>
                            {hasError && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={reconnectAll}
                                    className="h-7 px-2 text-xs"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Retry
                                </Button>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {statusConfig.description}
                        </p>

                        {/* Connection Quality */}
                        {healthCheck && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Connection Quality</span>
                                    <span className="text-xs text-muted-foreground">
                                        {Math.round(connectionQuality)}%
                                    </span>
                                </div>
                                <Progress value={connectionQuality} className="h-2" />
                            </div>
                        )}

                        <Separator />

                        {/* Real-time Sync Info */}
                        {lastUpdate && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Real-time Sync
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span>Last update: {formatLastUpdate(lastUpdate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                        <span>Updates: {syncUpdates.length}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Admin Notifications (for admin users) */}
                        {variant === 'admin' && userProfile?.role === 'admin' && adminNotifications.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                        <Shield className="h-3 w-3" />
                                        Admin Notifications
                                    </h4>
                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                        {adminNotifications.slice(0, 3).map((notification, index) => (
                                            <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={cn(
                                                        'h-2 w-2 rounded-full flex-shrink-0',
                                                        notification.priority === 'critical' ? 'bg-red-500' :
                                                            notification.priority === 'high' ? 'bg-orange-500' :
                                                                notification.priority === 'medium' ? 'bg-yellow-500' :
                                                                    'bg-blue-500'
                                                    )} />
                                                    <span className="truncate">
                                                        {notification.notification.title}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {notification.priority}
                                                </Badge>
                                            </div>
                                        ))}
                                        {adminNotifications.length > 3 && (
                                            <div className="text-xs text-muted-foreground text-center pt-1">
                                                +{adminNotifications.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Health Check Info */}
                        {healthCheck && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Connection Health
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between">
                                            <span>Total:</span>
                                            <span className="font-medium">{healthCheck.totalSubscriptions}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Connected:</span>
                                            <span className="font-medium text-green-600">
                                                {healthCheck.connectedSubscriptions}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Errors:</span>
                                            <span className="font-medium text-red-600">
                                                {healthCheck.errorSubscriptions}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Disconnected:</span>
                                            <span className="font-medium text-gray-600">
                                                {healthCheck.disconnectedSubscriptions}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Detailed Status */}
                        {detailedStatus && detailedStatus.subscriptions.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Active Subscriptions
                                    </h4>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {detailedStatus.subscriptions.slice(0, 5).map((sub) => (
                                            <div key={sub.id} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={cn(
                                                        'h-2 w-2 rounded-full flex-shrink-0',
                                                        sub.status === 'connected' ? 'bg-green-500' :
                                                            sub.status === 'error' ? 'bg-red-500' :
                                                                sub.status === 'connecting' ? 'bg-yellow-500' :
                                                                    'bg-gray-400'
                                                    )} />
                                                    <span className="truncate">
                                                        {sub.id.replace(/^(.*?)-.*/, '$1')}
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground text-xs">
                                                    {formatUptime(sub.uptime)}
                                                </span>
                                            </div>
                                        ))}
                                        {detailedStatus.subscriptions.length > 5 && (
                                            <div className="text-xs text-muted-foreground text-center pt-1">
                                                +{detailedStatus.subscriptions.length - 5} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Performance Metrics */}
                        {detailedStatus?.metrics && (
                            <>
                                <Separator />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Performance
                                    </h4>
                                    <div className="text-xs text-muted-foreground">
                                        Average uptime: {formatUptime(detailedStatus.metrics.averageUptime)}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </PopoverContent>
        </Popover>
    );
};

// Specialized variants
export const CompactEnhancedConnectionStatus: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <EnhancedConnectionStatus
            className={className}
            showDetails={false}
            size="sm"
            variant="compact"
        />
    );
};

export const DetailedEnhancedConnectionStatus: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <EnhancedConnectionStatus
            className={className}
            showDetails={true}
            size="md"
            variant="detailed"
        />
    );
};

export const AdminEnhancedConnectionStatus: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <EnhancedConnectionStatus
            className={className}
            showDetails={true}
            size="md"
            variant="admin"
        />
    );
};