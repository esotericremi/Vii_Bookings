import { supabase } from './supabase';

export const authHelpers = {
    // Check if user is authenticated
    isAuthenticated: async (): Promise<boolean> => {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    // Check if user has admin role
    isAdmin: async (): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role === 'admin';
    },

    // Get current user's role
    getUserRole: async (): Promise<'staff' | 'admin' | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role || null;
    },

    // Sign out and redirect
    signOutAndRedirect: async (redirectTo: string = '/login') => {
        await supabase.auth.signOut();
        window.location.href = redirectTo;
    },
};