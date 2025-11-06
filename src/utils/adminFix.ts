// Utility functions to help fix admin role issues

import { supabase } from '@/lib/supabase';

export const verifyAdminRole = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, role')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error verifying admin role:', error);
            return { success: false, error: error.message };
        }

        return {
            success: true,
            user: data,
            isAdmin: data.role === 'admin'
        };
    } catch (error) {
        console.error('Unexpected error verifying admin role:', error);
        return { success: false, error: 'Unexpected error occurred' };
    }
};

export const forceAdminRole = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error setting admin role:', error);
            return { success: false, error: error.message };
        }

        // Clear any cached profile data
        localStorage.removeItem(`user_profile_${userId}`);

        return {
            success: true,
            user: data,
            message: 'Admin role set successfully'
        };
    } catch (error) {
        console.error('Unexpected error setting admin role:', error);
        return { success: false, error: 'Unexpected error occurred' };
    }
};

export const clearUserCache = (userId: string) => {
    // Clear all cached data for the user
    localStorage.removeItem(`user_profile_${userId}`);
    localStorage.removeItem('fallback_admin_profile');

    console.log('User cache cleared for:', userId);
    return { success: true, message: 'Cache cleared successfully' };
};

// Add to window for debugging in development
if (process.env.NODE_ENV === 'development') {
    (window as any).adminFix = {
        verifyAdminRole,
        forceAdminRole,
        clearUserCache
    };
}