import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface NavigationGuardOptions {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    redirectTo?: string;
    allowedRoles?: ('staff' | 'admin')[];
}

export const useNavigationGuard = (options: NavigationGuardOptions = {}) => {
    const { user, userProfile, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        requireAuth = true,
        requireAdmin = false,
        redirectTo,
        allowedRoles
    } = options;

    useEffect(() => {
        if (loading) return; // Wait for auth to load

        // Check authentication requirement
        if (requireAuth && !user) {
            const loginPath = redirectTo || '/login';
            navigate(loginPath, {
                state: { from: location },
                replace: true
            });
            return;
        }

        // Check admin requirement
        if (requireAdmin && userProfile?.role !== 'admin') {
            navigate('/unauthorized', { replace: true });
            return;
        }

        // Check allowed roles
        if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
            navigate('/unauthorized', { replace: true });
            return;
        }
    }, [
        user,
        userProfile,
        loading,
        navigate,
        location,
        requireAuth,
        requireAdmin,
        redirectTo,
        allowedRoles
    ]);

    return {
        isAuthenticated: !!user,
        isAdmin: userProfile?.role === 'admin',
        userRole: userProfile?.role,
        loading
    };
};