import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getUserProfile, checkDatabaseHealth } from '@/lib/supabase';
import { Database } from '@/types/database';
import { logAuthState, validateUserRole } from '@/utils/authDebug';

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
    const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);

    // Helper function to handle profile loading with aggressive caching
    const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
        const cacheKey = `user_profile_${userId}`;
        const emergencyAdminKey = `emergency_admin_${userId}`;

        try {
            // Check for emergency admin mode first
            const emergencyAdmin = localStorage.getItem(emergencyAdminKey);
            if (emergencyAdmin) {
                const emergencyProfile = JSON.parse(emergencyAdmin);
                console.log('🚨 Using emergency admin profile');
                return emergencyProfile;
            }

            // Try to get from cache first (always prefer cache for speed)
            const cachedProfile = localStorage.getItem(cacheKey);
            if (cachedProfile) {
                try {
                    const { profile, timestamp } = JSON.parse(cachedProfile);
                    // Use cache if it's less than 30 minutes old OR if we have connection issues
                    const isRecentEnough = Date.now() - timestamp < 30 * 60 * 1000; // 30 minutes
                    if (profile && isRecentEnough) {
                        console.log('📦 Using cached user profile');

                        // Try to refresh in background if cache is older than 5 minutes
                        const shouldRefresh = Date.now() - timestamp > 5 * 60 * 1000;
                        if (shouldRefresh) {
                            // Background refresh - don't wait for it
                            getUserProfile(userId, false).then(freshProfile => {
                                if (freshProfile && validateUserRole(freshProfile)) {
                                    localStorage.setItem(cacheKey, JSON.stringify({
                                        profile: freshProfile,
                                        timestamp: Date.now()
                                    }));

                                }
                            }).catch(error => {
                                console.warn('Background refresh failed:', error);
                            });
                        }

                        return profile;
                    }
                } catch (parseError) {
                    console.warn('Error parsing cached profile, will fetch fresh');
                    localStorage.removeItem(cacheKey);
                }
            }

            // Try to fetch fresh profile (with built-in fallback to cache)
            const profile = await getUserProfile(userId, true);

            if (profile && validateUserRole(profile)) {
                logAuthState('Profile Loaded Successfully', { id: userId }, profile, null);
                return profile;
            }

            // Check for fallback admin profile
            const fallbackProfile = localStorage.getItem('fallback_admin_profile');
            if (fallbackProfile) {
                try {
                    const parsedProfile = JSON.parse(fallbackProfile);
                    if (parsedProfile.id === userId) {

                        return parsedProfile;
                    }
                } catch (error) {
                    console.warn('Error parsing fallback profile:', error);
                }
            }

            console.warn('❌ No user profile found after all attempts');
            return null;
        } catch (error) {
            console.error('Error loading user profile:', error);

            // If we have retries left, try again
            if (retryCount < maxRetries) {
                console.log(`Profile fetch error, retrying... (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return loadUserProfile(userId, retryCount + 1);
            }

            // Check for cached profile as last resort
            const cachedProfile = localStorage.getItem(cacheKey);
            if (cachedProfile) {
                try {
                    const { profile } = JSON.parse(cachedProfile);
                    if (profile) {

                        return profile;
                    }
                } catch (parseError) {
                    console.error('Error parsing cached profile:', parseError);
                }
            }

            // Check for fallback admin profile on error
            const fallbackProfile = localStorage.getItem('fallback_admin_profile');
            if (fallbackProfile) {
                try {
                    const parsedProfile = JSON.parse(fallbackProfile);
                    if (parsedProfile.id === userId) {
                        console.log('Using fallback admin profile due to error');
                        return parsedProfile;
                    }
                } catch (parseError) {
                    console.error('Error parsing fallback profile:', parseError);
                }
            }
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;
        let refreshInterval: NodeJS.Timeout | null = null;

        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            if (isMounted) {
                console.warn('Auth loading timeout reached, setting loading to false');
                setLoading(false);
            }
        }, 10000); // Increased to 10 seconds

        setAuthTimeout(timeout);

        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error) {
                    console.error('Error getting session:', error);
                    setLoading(false);
                    return;
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const profile = await loadUserProfile(session.user.id);
                    if (isMounted) {
                        setUserProfile(profile);
                    }
                }
            } catch (error) {
                console.error('Error in getInitialSession:', error);
            } finally {
                if (isMounted) {
                    clearTimeout(timeout);
                    setLoading(false);
                }
            }
        };

        getInitialSession();

        // Set up periodic session refresh (every 50 minutes)
        refreshInterval = setInterval(async () => {
            if (isMounted) {
                try {
                    const { data: { session }, error } = await supabase.auth.refreshSession();
                    if (error) {
                        console.error('Error refreshing session:', error);
                    } else if (session) {
                        console.log('Session refreshed successfully');
                        setSession(session);
                        setUser(session.user);
                    }
                } catch (error) {
                    console.error('Unexpected error refreshing session:', error);
                }
            }
        }, 50 * 60 * 1000); // 50 minutes

        // Listen for auth changes with improved handling
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                console.log('Auth state change:', event, session?.user?.id);
                logAuthState(`Auth Event: ${event}`, session?.user, userProfile, session);

                // Handle different auth events
                if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
                    setSession(null);
                    setUser(null);
                    setUserProfile(null);
                    setLoading(false);
                    return;
                }

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        // For token refresh, only reload profile if we don't have one or if it's for a different user
                        if (event === 'TOKEN_REFRESHED' && userProfile && userProfile.id === session.user.id) {

                            // Keep existing profile, don't reload unless necessary
                        } else {
                            console.log('Loading user profile for', event);
                            const profile = await loadUserProfile(session.user.id);
                            if (isMounted) {
                                setUserProfile(profile);
                            }
                        }
                    } else {
                        setUserProfile(null);
                    }
                }

                if (isMounted) {
                    setLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            if (authTimeout) {
                clearTimeout(authTimeout);
            }
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Sign in error:', error);
                return { error };
            }

            // Ensure session is properly set
            if (data.session) {
                setSession(data.session);
                setUser(data.user);

                // Load user profile
                if (data.user) {
                    const profile = await loadUserProfile(data.user.id);
                    setUserProfile(profile);
                }
            }

            return { error: null };
        } catch (error) {
            console.error('Unexpected sign in error:', error);
            return { error: error as AuthError };
        }
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