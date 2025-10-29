import React, { useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
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
import { useRealtimeConnectionStatus } from '@/hooks/useRealTimeAvailability';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
    className?: string;
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
    className,
    showDetails = false,
    size = 'md'
}) => {
    const [showPopover, setShowPopover] = useState(false);
    const {
        status,
        healthCheck,
        detailedStatus,
        reconnectAll,
        isConnected,
        isConnecting,
        hasError,
        isDisconnected
    } = useRealtimeConnectionStatus();

    const getStatusConfig = () => {
        if (isConnected) {
            return {
                icon: Wifi,
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                label: 'Connected',
                description: 'Real-time updates active'
            };
        } else if (isConnecting) {
            return {
                icon: RefreshCw,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-100',
                label: 'Connecting',
                description: 'Establishing connection...'
            };
        } else if (hasError) {
            return {
                icon: AlertTriangle,
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                label: 'Error',
                description: 'Connection failed'
            };
        } else {
            return {
                icon: WifiOff,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100',
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

    if (!showDetails) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            'flex items-center gap-2 px-2 py-1 rounded-full',
                            statusConfig.bgColor,
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
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{statusConfig.description}</p>
                        {healthCheck && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {healthCheck.connectedSubscriptions}/{healthCheck.totalSubscriptions} active
                            </p>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Popover open={showPopover} onOpenChange={setShowPopover}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'flex items-center gap-2 h-auto px-2 py-1',
                        className
                    )}
                >
                    <Icon className={cn(
                        statusConfig.color,
                        'h-4 w-4',
                        isConnecting && 'animate-spin'
                    )} />
                    <span className={cn('text-xs font-medium', statusConfig.color)}>
                        {statusConfig.label}
                    </span>
                    {healthCheck && (
                        <Badge variant="outline" className="h-5 px-1 text-xs">
                            {healthCheck.connectedSubscriptions}/{healthCheck.totalSubscriptions}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80" align="end">
                <Card className="border-0 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4" />
                            Real-time Connection Status
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

                        <Separator />

                        {/* Health Check Info */}
                        {healthCheck && (
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

                        {/* Metrics */}
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

// Compact version for header/toolbar use
export const CompactConnectionStatus: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <ConnectionStatusIndicator
            className={className}
            showDetails={false}
            size="sm"
        />
    );
};

// Detailed version for admin dashboard
export const DetailedConnectionStatus: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <ConnectionStatusIndicator
            className={className}
            showDetails={true}
            size="md"
        />
    );
};