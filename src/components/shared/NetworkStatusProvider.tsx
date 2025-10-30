import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatus {
    isOnline: boolean;
    isSlowConnection: boolean;
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
}

interface NetworkStatusContextType {
    networkStatus: NetworkStatus;
    isOnline: boolean;
    isOffline: boolean;
    isSlowConnection: boolean;
    retryConnection: () => void;
    lastOnlineTime: Date | null;
    offlineDuration: number;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export const useNetworkStatus = () => {
    const context = useContext(NetworkStatusContext);
    if (context === undefined) {
        throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
    }
    return context;
};

interface NetworkStatusProviderProps {
    children: React.ReactNode;
}

export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({ children }) => {
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
        isOnline: navigator.onLine,
        isSlowConnection: false,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
    });

    const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
        navigator.onLine ? new Date() : null
    );
    const [offlineDuration, setOfflineDuration] = useState(0);
    const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false);
    const [hasShownOnlineToast, setHasShownOnlineToast] = useState(false);

    // Get network information from Navigator API
    const getNetworkInfo = useCallback((): Partial<NetworkStatus> => {
        const connection = (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        if (connection) {
            return {
                connectionType: connection.type || 'unknown',
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false,
                isSlowConnection: connection.effectiveType === 'slow-2g' ||
                    connection.effectiveType === '2g' ||
                    (connection.downlink && connection.downlink < 0.5),
            };
        }

        return {
            connectionType: 'unknown',
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false,
            isSlowConnection: false,
        };
    }, []);

    // Update network status
    const updateNetworkStatus = useCallback(() => {
        const isOnline = navigator.onLine;
        const networkInfo = getNetworkInfo();

        setNetworkStatus(prev => ({
            ...prev,
            isOnline,
            ...networkInfo,
        }));

        // Handle online/offline transitions
        if (isOnline && !networkStatus.isOnline) {
            // Just came online
            setLastOnlineTime(new Date());
            setOfflineDuration(0);
            setHasShownOfflineToast(false);

            if (!hasShownOnlineToast) {
                toast({
                    title: 'Connection Restored',
                    description: 'You are back online. Data will sync automatically.',
                    duration: 3000,
                    action: (
                        <div className="flex items-center">
                            <Wifi className="h-4 w-4 text-green-600" />
                        </div>
                    ),
                });
                setHasShownOnlineToast(true);
                // Reset the flag after a delay to allow showing it again later
                setTimeout(() => setHasShownOnlineToast(false), 30000);
            }
        } else if (!isOnline && networkStatus.isOnline) {
            // Just went offline
            setLastOnlineTime(prev => prev || new Date());

            if (!hasShownOfflineToast) {
                toast({
                    title: 'Connection Lost',
                    description: 'You are currently offline. Some features may be limited.',
                    duration: 5000,
                    variant: 'destructive',
                    action: (
                        <div className="flex items-center">
                            <WifiOff className="h-4 w-4" />
                        </div>
                    ),
                });
                setHasShownOfflineToast(true);
            }
        }
    }, [networkStatus.isOnline, hasShownOfflineToast, hasShownOnlineToast, getNetworkInfo]);

    // Calculate offline duration
    useEffect(() => {
        if (!networkStatus.isOnline && lastOnlineTime) {
            const interval = setInterval(() => {
                setOfflineDuration(Date.now() - lastOnlineTime.getTime());
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [networkStatus.isOnline, lastOnlineTime]);

    // Retry connection function
    const retryConnection = useCallback(() => {
        // Force a network check by making a simple request
        fetch('/favicon.ico', {
            method: 'HEAD',
            cache: 'no-cache',
            mode: 'no-cors'
        })
            .then(() => {
                updateNetworkStatus();
            })
            .catch(() => {
                // Still offline
                toast({
                    title: 'Still Offline',
                    description: 'Unable to establish connection. Please check your network.',
                    variant: 'destructive',
                });
            });
    }, [updateNetworkStatus]);

    // Set up event listeners
    useEffect(() => {
        const handleOnline = () => updateNetworkStatus();
        const handleOffline = () => updateNetworkStatus();
        const handleConnectionChange = () => updateNetworkStatus();

        // Standard online/offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Network Information API events
        const connection = (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        if (connection) {
            connection.addEventListener('change', handleConnectionChange);
        }

        // Initial status check
        updateNetworkStatus();

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            if (connection) {
                connection.removeEventListener('change', handleConnectionChange);
            }
        };
    }, [updateNetworkStatus]);

    // Periodic connection check when offline
    useEffect(() => {
        if (!networkStatus.isOnline) {
            const interval = setInterval(() => {
                retryConnection();
            }, 30000); // Check every 30 seconds when offline

            return () => clearInterval(interval);
        }
    }, [networkStatus.isOnline, retryConnection]);

    const value: NetworkStatusContextType = {
        networkStatus,
        isOnline: networkStatus.isOnline,
        isOffline: !networkStatus.isOnline,
        isSlowConnection: networkStatus.isSlowConnection,
        retryConnection,
        lastOnlineTime,
        offlineDuration,
    };

    return (
        <NetworkStatusContext.Provider value={value}>
            {children}
        </NetworkStatusContext.Provider>
    );
};

// Hook for checking if we should show offline UI
export const useOfflineCapable = () => {
    const { isOffline, isSlowConnection, retryConnection } = useNetworkStatus();

    return {
        isOffline,
        isSlowConnection,
        shouldShowOfflineUI: isOffline,
        shouldShowSlowConnectionWarning: isSlowConnection,
        retryConnection,
    };
};

// Hook for graceful degradation
export const useGracefulDegradation = () => {
    const { isOffline, isSlowConnection } = useNetworkStatus();

    return {
        // Disable real-time features when offline or slow
        disableRealTime: isOffline || isSlowConnection,

        // Reduce polling frequency when slow
        getPollingInterval: (defaultInterval: number) => {
            if (isOffline) return null; // No polling when offline
            if (isSlowConnection) return defaultInterval * 3; // Slower polling
            return defaultInterval;
        },

        // Disable auto-refresh when offline
        disableAutoRefresh: isOffline,

        // Show simplified UI when offline
        useSimplifiedUI: isOffline,
    };
};