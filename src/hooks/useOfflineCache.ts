import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/components/shared/NetworkStatusProvider';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface OfflineCacheOptions {
    maxAge?: number; // Cache duration in milliseconds
    storageKey?: string;
    syncOnReconnect?: boolean;
}

export const useOfflineCache = <T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: OfflineCacheOptions = {}
) => {
    const {
        maxAge = 5 * 60 * 1000, // 5 minutes default
        storageKey = 'offline-cache',
        syncOnReconnect = true
    } = options;

    const { isOnline, isOffline } = useNetworkStatus();
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isFromCache, setIsFromCache] = useState(false);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    // Get cache from localStorage
    const getCache = useCallback((): Record<string, CacheEntry<any>> => {
        try {
            const cached = localStorage.getItem(storageKey);
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    }, [storageKey]);

    // Set cache in localStorage
    const setCache = useCallback((cache: Record<string, CacheEntry<any>>) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(cache));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }, [storageKey]);

    // Get cached data for specific key
    const getCachedData = useCallback((): T | null => {
        const cache = getCache();
        const entry = cache[key];

        if (!entry) return null;

        const now = Date.now();
        if (now > entry.expiresAt) {
            // Cache expired, remove it
            delete cache[key];
            setCache(cache);
            return null;
        }

        return entry.data;
    }, [key, getCache, setCache]);

    // Cache data
    const cacheData = useCallback((newData: T) => {
        const cache = getCache();
        const now = Date.now();

        cache[key] = {
            data: newData,
            timestamp: now,
            expiresAt: now + maxAge,
        };

        setCache(cache);
    }, [key, maxAge, getCache, setCache]);

    // Fetch data from network
    const fetchData = useCallback(async (useCache = true) => {
        setIsLoading(true);
        setError(null);

        try {
            // If offline, try to use cached data
            if (isOffline && useCache) {
                const cachedData = getCachedData();
                if (cachedData) {
                    setData(cachedData);
                    setIsFromCache(true);
                    setIsLoading(false);
                    return cachedData;
                } else {
                    throw new Error('No cached data available while offline');
                }
            }

            // If online, fetch from network
            if (isOnline) {
                const freshData = await fetchFn();
                setData(freshData);
                setIsFromCache(false);
                setLastFetch(new Date());

                // Cache the fresh data
                cacheData(freshData);

                setIsLoading(false);
                return freshData;
            }

            throw new Error('Unable to fetch data');
        } catch (err) {
            const error = err as Error;
            setError(error);

            // If network fetch failed, try cached data as fallback
            if (useCache) {
                const cachedData = getCachedData();
                if (cachedData) {
                    setData(cachedData);
                    setIsFromCache(true);
                    // Keep the error but show cached data
                }
            }

            setIsLoading(false);
            throw error;
        }
    }, [isOnline, isOffline, fetchFn, getCachedData, cacheData]);

    // Force refresh from network
    const refresh = useCallback(() => {
        return fetchData(false);
    }, [fetchData]);

    // Clear cache for this key
    const clearCache = useCallback(() => {
        const cache = getCache();
        delete cache[key];
        setCache(cache);
    }, [key, getCache, setCache]);

    // Check if data is stale
    const isStale = useCallback(() => {
        if (!lastFetch) return true;
        return Date.now() - lastFetch.getTime() > maxAge;
    }, [lastFetch, maxAge]);

    // Initial data load
    useEffect(() => {
        fetchData();
    }, [key]); // Only depend on key to avoid infinite loops

    // Sync when coming back online
    useEffect(() => {
        if (isOnline && syncOnReconnect && data && isFromCache) {
            fetchData(false).catch(() => {
                // Ignore errors when syncing, keep cached data
            });
        }
    }, [isOnline, syncOnReconnect, data, isFromCache]);

    return {
        data,
        isLoading,
        error,
        isFromCache,
        lastFetch,
        isStale: isStale(),
        fetchData,
        refresh,
        clearCache,
    };
};

// Hook for managing multiple offline caches
export const useMultipleOfflineCaches = <T extends Record<string, any>>(
    cacheConfigs: Record<keyof T, {
        fetchFn: () => Promise<T[keyof T]>;
        options?: OfflineCacheOptions;
    }>
) => {
    const [caches, setCaches] = useState<Record<keyof T, ReturnType<typeof useOfflineCache>>>({} as any);

    useEffect(() => {
        const newCaches = {} as Record<keyof T, ReturnType<typeof useOfflineCache>>;

        Object.entries(cacheConfigs).forEach(([key, config]) => {
            // This is a simplified version - in practice, you'd need to properly handle the hooks
            // For now, this serves as a pattern for how multiple caches could be managed
        });

        setCaches(newCaches);
    }, [cacheConfigs]);

    return caches;
};

// Hook for cache statistics and management
export const useCacheManager = (storageKey: string = 'offline-cache') => {
    const [stats, setStats] = useState({
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null as Date | null,
        newestEntry: null as Date | null,
    });

    const getCache = useCallback((): Record<string, CacheEntry<any>> => {
        try {
            const cached = localStorage.getItem(storageKey);
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    }, [storageKey]);

    const setCache = useCallback((cache: Record<string, CacheEntry<any>>) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(cache));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }, [storageKey]);

    const updateStats = useCallback(() => {
        const cache = getCache();
        const entries = Object.values(cache);

        if (entries.length === 0) {
            setStats({
                totalEntries: 0,
                totalSize: 0,
                oldestEntry: null,
                newestEntry: null,
            });
            return;
        }

        const timestamps = entries.map(entry => entry.timestamp);
        const totalSize = JSON.stringify(cache).length;

        setStats({
            totalEntries: entries.length,
            totalSize,
            oldestEntry: new Date(Math.min(...timestamps)),
            newestEntry: new Date(Math.max(...timestamps)),
        });
    }, [getCache]);

    const clearExpiredEntries = useCallback(() => {
        const cache = getCache();
        const now = Date.now();
        let removedCount = 0;

        Object.keys(cache).forEach(key => {
            if (now > cache[key].expiresAt) {
                delete cache[key];
                removedCount++;
            }
        });

        if (removedCount > 0) {
            setCache(cache);
            updateStats();
        }

        return removedCount;
    }, [getCache, setCache, updateStats]);

    const clearAllCache = useCallback(() => {
        localStorage.removeItem(storageKey);
        updateStats();
    }, [storageKey, updateStats]);

    const clearOldEntries = useCallback((maxAge: number) => {
        const cache = getCache();
        const cutoff = Date.now() - maxAge;
        let removedCount = 0;

        Object.keys(cache).forEach(key => {
            if (cache[key].timestamp < cutoff) {
                delete cache[key];
                removedCount++;
            }
        });

        if (removedCount > 0) {
            setCache(cache);
            updateStats();
        }

        return removedCount;
    }, [getCache, setCache, updateStats]);

    useEffect(() => {
        updateStats();
    }, [updateStats]);

    return {
        stats,
        updateStats,
        clearExpiredEntries,
        clearAllCache,
        clearOldEntries,
    };
};