import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
    isActive?: boolean;
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    className?: string;
}

// Route to breadcrumb mapping
const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
    '/': [{ label: 'Home', href: '/', isActive: true }],
    '/rooms': [
        { label: 'Home', href: '/' },
        { label: 'Room Selection', isActive: true }
    ],
    '/dashboard': [
        { label: 'Home', href: '/' },
        { label: 'Dashboard', isActive: true }
    ],
    '/my-bookings': [
        { label: 'Home', href: '/' },
        { label: 'My Bookings', isActive: true }
    ],
    '/book': [
        { label: 'Home', href: '/' },
        { label: 'Room Selection', href: '/rooms' },
        { label: 'Book Room', isActive: true }
    ],
    '/admin': [
        { label: 'Home', href: '/' },
        { label: 'Admin', isActive: true }
    ],
    '/admin/dashboard': [
        { label: 'Home', href: '/' },
        { label: 'Admin', href: '/admin' },
        { label: 'Dashboard', isActive: true }
    ],
    '/admin/bookings': [
        { label: 'Home', href: '/' },
        { label: 'Admin', href: '/admin' },
        { label: 'All Bookings', isActive: true }
    ],
    '/admin/rooms': [
        { label: 'Home', href: '/' },
        { label: 'Admin', href: '/admin' },
        { label: 'Room Management', isActive: true }
    ],
    '/admin/analytics': [
        { label: 'Home', href: '/' },
        { label: 'Admin', href: '/admin' },
        { label: 'Analytics', isActive: true }
    ],
    '/admin/settings': [
        { label: 'Home', href: '/' },
        { label: 'Admin', href: '/admin' },
        { label: 'Settings', isActive: true }
    ]
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
    const location = useLocation();

    // Use provided items or generate from current route
    const breadcrumbItems = items || routeBreadcrumbs[location.pathname] || [
        { label: 'Home', href: '/' },
        { label: 'Page', isActive: true }
    ];

    if (breadcrumbItems.length <= 1) {
        return null; // Don't show breadcrumb for single items
    }

    return (
        <nav className={cn('flex items-center space-x-1 text-sm text-gray-500', className)}>
            {breadcrumbItems.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    {item.href && !item.isActive ? (
                        <Link
                            to={item.href}
                            className="hover:text-gray-700 transition-colors duration-200 flex items-center"
                        >
                            {index === 0 && <Home className="h-4 w-4 mr-1" />}
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className={cn(
                                'flex items-center',
                                item.isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                            )}
                        >
                            {index === 0 && <Home className="h-4 w-4 mr-1" />}
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};