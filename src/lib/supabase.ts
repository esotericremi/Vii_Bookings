import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Type-safe table references
export type SupabaseClient = typeof supabase;

// Helper function to get the current user
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting current user:', error);
        return null;
    }
    return user;
};

// Connection health status
let connectionHealthy = true;
let lastHealthCheck = 0;

// Helper function to check database connection health
export const checkDatabaseHealth = async (): Promise<boolean> => {
    const now = Date.now();
    // Only check health every 30 seconds to avoid spam
    if (now - lastHealthCheck < 30000) {
        return connectionHealthy;
    }

    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Health check timeout')), 3000);
        });

        const healthPromise = supabase
            .from('users')
            .select('count')
            .limit(1);

        await Promise.race([healthPromise, timeoutPromise]);
        connectionHealthy = true;
        lastHealthCheck = now;
        console.log('✅ Database connection healthy');
        return true;
    } catch (error) {
        connectionHealthy = false;
        lastHealthCheck = now;
        console.warn('❌ Database connection unhealthy:', error);
        return false;
    }
};

// Helper function to get user profile with aggressive fallback
export const getUserProfile = async (userId: string, useCache = true): Promise<any> => {
    const cacheKey = `user_profile_${userId}`;

    // If we're using cache and connection is unhealthy, return cached data immediately
    if (useCache && !connectionHealthy) {
        const cachedProfile = localStorage.getItem(cacheKey);
        if (cachedProfile) {
            try {
                const { profile } = JSON.parse(cachedProfile);

                return profile;
            } catch (error) {
                console.warn('Error parsing cached profile:', error);
            }
        }
    }

    try {
        // Much shorter timeout for faster fallback
        const timeoutMs = 5000; // Reduced to 5 seconds

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`getUserProfile timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        const queryPromise = supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        if (error) {
            console.error('Error getting user profile:', error);
            connectionHealthy = false;

            // Immediately fall back to cache
            if (useCache) {
                const cachedProfile = localStorage.getItem(cacheKey);
                if (cachedProfile) {
                    try {
                        const { profile } = JSON.parse(cachedProfile);

                        return profile;
                    } catch (parseError) {
                        console.warn('Error parsing cached profile:', parseError);
                    }
                }
            }

            return null;
        }

        // Success - update cache and connection status
        connectionHealthy = true;
        if (data && useCache) {
            localStorage.setItem(cacheKey, JSON.stringify({
                profile: data,
                timestamp: Date.now()
            }));
        }

        return data;
    } catch (error) {
        console.error('getUserProfile - Timeout or error:', error);
        connectionHealthy = false;

        // Immediately fall back to cache
        if (useCache) {
            const cachedProfile = localStorage.getItem(cacheKey);
            if (cachedProfile) {
                try {
                    const { profile } = JSON.parse(cachedProfile);

                    return profile;
                } catch (parseError) {
                    console.warn('Error parsing cached profile:', parseError);
                }
            }
        }

        return null;
    }
};

// Helper function to check if user is admin
export const isUserAdmin = async (userId?: string) => {
    if (!userId) {
        const user = await getCurrentUser();
        if (!user) return false;
        userId = user.id;
    }

    const profile = await getUserProfile(userId);
    return profile?.role === 'admin';
};

// Helper function to get system settings
export const getSystemSettings = async () => {
    const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error getting system settings:', error);
        return null;
    }

    return data;
};