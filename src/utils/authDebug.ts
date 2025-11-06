// Utility functions for debugging authentication issues

export const logAuthState = (context: string, user: any, userProfile: any, session: any) => {
    if (process.env.NODE_ENV === 'development') {
        console.group(`🔐 Auth State - ${context}`);
        console.log('User ID:', user?.id);
        console.log('User Email:', user?.email);
        console.log('Profile Role:', userProfile?.role);
        console.log('Profile ID:', userProfile?.id);
        console.log('Session Valid:', !!session);
        console.log('Session Expires:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
        console.groupEnd();
    }
};

export const validateUserRole = (userProfile: any): boolean => {
    if (!userProfile) {
        console.warn('⚠️ User profile is null or undefined');
        return false;
    }

    if (!userProfile.role) {
        console.warn('⚠️ User profile missing role field');
        return false;
    }

    if (!['staff', 'admin'].includes(userProfile.role)) {
        console.warn('⚠️ Invalid user role:', userProfile.role);
        return false;
    }

    return true;
};

export const clearAuthCache = (userId?: string) => {
    if (userId) {
        localStorage.removeItem(`user_profile_${userId}`);
        console.log('🧹 Cleared auth cache for user:', userId);
    } else {
        // Clear all user profile caches
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('user_profile_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('🧹 Cleared all auth caches');
    }
};

export const enableEmergencyAdminMode = (userId: string, userEmail: string) => {
    const emergencyProfile = {
        id: userId,
        email: userEmail,
        full_name: 'Emergency Admin',
        role: 'admin',
        avatar_url: null,
        department: 'System',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    localStorage.setItem(`emergency_admin_${userId}`, JSON.stringify(emergencyProfile));
    console.log('🚨 Emergency admin mode enabled for:', userEmail);

    return emergencyProfile;
};

export const disableEmergencyAdminMode = (userId: string) => {
    localStorage.removeItem(`emergency_admin_${userId}`);
    console.log('✅ Emergency admin mode disabled for user:', userId);
};

// Add to window for debugging in development
if (process.env.NODE_ENV === 'development') {
    (window as any).authDebug = {
        logAuthState,
        validateUserRole,
        clearAuthCache,
        enableEmergencyAdminMode,
        disableEmergencyAdminMode
    };
}