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

// Helper function to get the current user
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting current user:', error);
        return null;
    }
    return user;
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
    try {
        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('getUserProfile timeout after 8 seconds')), 8000);
        });

        const queryPromise = supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        if (error) {
            console.error('Error getting user profile:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('getUserProfile - Timeout or error:', error);
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