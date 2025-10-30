import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Route to title mapping
const routeTitles: Record<string, string> = {
    '/': 'Dashboard - VII Bookings',
    '/rooms': 'Room Selection - VII Bookings',
    '/dashboard': 'Dashboard - VII Bookings',
    '/my-bookings': 'My Bookings - VII Bookings',
    '/book': 'Book Room - VII Bookings',
    '/admin': 'Admin - VII Bookings',
    '/admin/dashboard': 'Admin Dashboard - VII Bookings',
    '/admin/bookings': 'All Bookings - VII Bookings',
    '/admin/rooms': 'Room Management - VII Bookings',
    '/admin/analytics': 'Analytics - VII Bookings',
    '/admin/settings': 'Settings - VII Bookings',
    '/login': 'Login - VII Bookings',
    '/register': 'Register - VII Bookings',
    '/unauthorized': 'Unauthorized - VII Bookings'
};

export const usePageTitle = (customTitle?: string) => {
    const location = useLocation();

    useEffect(() => {
        if (customTitle) {
            document.title = customTitle;
        } else {
            // Get title from route mapping or use default
            const title = routeTitles[location.pathname] || 'VII Bookings';
            document.title = title;
        }
    }, [location.pathname, customTitle]);
};

// Hook to get page title without setting it
export const useGetPageTitle = (): string => {
    const location = useLocation();
    return routeTitles[location.pathname] || 'VII Bookings';
};