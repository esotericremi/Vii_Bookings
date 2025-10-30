import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '@/lib/supabase';
import { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error getting session:', error);
            } else {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const profile = await getUserProfile(session.user.id);
                    setUserProfile(profile);
                }
            }

            setLoading(false);
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session);

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const profile = await getUserProfile(session.user.id);
                    setUserProfile(profile);
                } else {
                    setUserProfile(null);
                }

                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error };
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        // If signup is successful, create user profile
        if (data.user && !error) {
            const { error: profileError } = await (supabase as any)
                .from('users')
                .insert({
                    id: data.user.id,
                    email: data.user.email!,
                    full_name: fullName,
                    role: 'staff',
                });

            if (profileError) {
                console.error('Error creating user profile:', profileError);
            }
        }

        return {
            error,
            needsEmailConfirmation: data.user && !data.session // If user exists but no session, email confirmation is required
        };
    };

    const signOut = async () => {
        try {
            // Clear local state first
            setUser(null);
            setUserProfile(null);
            setSession(null);

            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Sign out error:', error);
            }

            // Force redirect to login page
            window.location.href = '/login';

            return { error };
        } catch (error) {
            console.error('Unexpected sign out error:', error);
            // Still redirect even if there's an error
            window.location.href = '/login';
            return { error: error as AuthError };
        }
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        return { error };
    };

    const value: AuthContextType = {
        user,
        userProfile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};