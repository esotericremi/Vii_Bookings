import React, { useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, X, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from './NetworkStatusProvider';

interface NetworkStatusBannerProps {
    className?: string;
    showWhenOnline?: boolean;
    dismissible?: boolean;
    compact?: boolean;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
    className,
    showWhenOnline = false,
    dismissible = true,
    compact = false
}) => {
    const {
        isOnline,
        isOffline,
        isSlowConnection,
        retryConnection,
        lastOnlineTime,
        offlineDuration,
        networkStatus
    } = useNetworkStatus();

    const [isDismissed, setIsDismissed] = useState(false);

    // Don't show if dismissed
    if (isDismissed) return null;

    // Don't show when online unless explicitly requested
    if (isOnline && !showWhenOnline && !isSlowConnection) return null;

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    const getStatusConfig = () => {
        if (isOffline) {
            return {
                icon: WifiOff,
                title: 'You\'re offline',
                description: `No internet connection${lastOnlineTime ? ` for ${formatDuration(offlineDuration)}` : ''}. Some features may be limited.`,
                variant: 'destructive' as const,
                bgColor: 'bg-red-50 border-red-200',
                textColor: 'text-red-800',
                showRetry: true,
            };
        }

        if (isSlowConnection) {
            return {
                icon: AlertTriangle,
                title: 'Slow connection detected',
                description: `Connection quality: ${networkStatus.effectiveType}. Some features may load slowly.`,
                variant: 'default' as const,
                bgColor: 'bg-yellow-50 border-yellow-200',
                textColor: 'text-yellow-800',
                showRetry: false,
            };
        }

        if (showWhenOnline) {
            return {
                icon: Wifi,
                title: 'You\'re back online',
                description: 'Connection restored. All features are available.',
                variant: 'default' as const,
                bgColor: 'bg-green-50 border-green-200',
                textColor: 'text-green-800',
                showRetry: false,
            };
        }

        return null;
    };

    const config = getStatusConfig();
    if (!config) return null;

    const Icon = config.icon;

    if (compact) {
        return (
            <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border',
                config.bgColor,
                config.textColor,
                className
            )}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{config.title}</span>
                {config.showRetry && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={retryConnection}
                        className="h-6 px-2 text-xs ml-auto"
                    >
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                )}
                {dismissible && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsDismissed(true)}
                        className="h-6 w-6 p-0 ml-1"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Alert className={cn('border-2', config.bgColor, className)}>
            <Icon className={cn('h-4 w-4', config.textColor)} />
            <AlertDescription className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={cn('font-medium', config.textColor)}>
                            {config.title}
                        </span>
                        {isOffline && (
                            <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(offlineDuration)}
                            </Badge>
                        )}
                        {isSlowConnection && (
                            <Badge variant="outline" className="text-xs">
                                {networkStatus.effectiveType}
                            </Badge>
                        )}
                    </div>
                    <p className={cn('text-sm', config.textColor)}>
                        {config.description}
                    </p>

                    {/* Connection details for slow connections */}
                    {isSlowConnection && networkStatus.downlink > 0 && (
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                                <span>Speed: {networkStatus.downlink} Mbps</span>
                                <span>•</span>
                                <span>Latency: {networkStatus.rtt}ms</span>
                            </div>
                            {networkStatus.downlink < 1 && (
                                <Progress
                                    value={networkStatus.downlink * 100}
                                    className="h-1 w-32"
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                    {config.showRetry && (
                        <Button
                            size="sm"
                            onClick={retryConnection}
                            className="flex items-center gap-1"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                        </Button>
                    )}
                    {dismissible && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsDismissed(true)}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
};

// Floating network status indicator for persistent display
export const FloatingNetworkStatus: React.FC<{
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ position = 'bottom-right' }) => {
    const { isOffline, isSlowConnection } = useNetworkStatus();
    const [isExpanded, setIsExpanded] = useState(false);

    // Only show when there are network issues
    if (!isOffline && !isSlowConnection) return null;

    const positionClasses = {
        'top-left': 'top-4 left-4',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-right': 'bottom-4 right-4',
    };

    return (
        <div className={cn(
            'fixed z-50 transition-all duration-200',
            positionClasses[position]
        )}>
            {isExpanded ? (
                <NetworkStatusBanner
                    compact={false}
                    dismissible={true}
                    className="max-w-sm shadow-lg"
                />
            ) : (
                <Button
                    size="sm"
                    variant={isOffline ? 'destructive' : 'secondary'}
                    onClick={() => setIsExpanded(true)}
                    className="shadow-lg"
                >
                    {isOffline ? (
                        <WifiOff className="h-4 w-4 mr-2" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    {isOffline ? 'Offline' : 'Slow'}
                </Button>
            )}
        </div>
    );
};

// Hook to automatically show/hide network status
export const useNetworkStatusBanner = () => {
    const { isOffline, isSlowConnection } = useNetworkStatus();
    const [shouldShow, setShouldShow] = useState(false);
    const [hasShown, setHasShown] = useState(false);

    React.useEffect(() => {
        if ((isOffline || isSlowConnection) && !hasShown) {
            setShouldShow(true);
            setHasShown(true);
        } else if (!isOffline && !isSlowConnection) {
            // Reset after coming back online
            setTimeout(() => {
                setHasShown(false);
                setShouldShow(false);
            }, 3000);
        }
    }, [isOffline, isSlowConnection, hasShown]);

    return {
        shouldShow,
        dismiss: () => setShouldShow(false),
    };
};