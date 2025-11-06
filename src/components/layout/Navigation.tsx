import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar,
    Users,
    Settings,
    Home,
    CalendarDays,
    BarChart3,
    Building2,
    UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/user';

interface NavigationProps {
    activeView?: string;
    onViewChange?: (view: string) => void;
    userRole: UserRole;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: UserRole[];
    path: string;
}

const navItems: NavItem[] = [
    {
        id: 'home',
        label: 'Home',
        icon: Home,
        roles: ['staff', 'admin'],
        path: '/'
    },
    {
        id: 'rooms',
        label: 'Room Selection',
        icon: Building2,
        roles: ['staff', 'admin'],
        path: '/rooms'
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        roles: ['staff', 'admin'],
        path: '/dashboard'
    },
    {
        id: 'my-bookings',
        label: 'My Bookings',
        icon: Calendar,
        roles: ['staff', 'admin'],
        path: '/my-bookings'
    },
    // Admin-only items

    {
        id: 'admin-rooms',
        label: 'Manage Rooms',
        icon: Building2,
        roles: ['admin'],
        path: '/admin/rooms'
    },
    {
        id: 'admin-bookings',
        label: 'All Bookings',
        icon: Users,
        roles: ['admin'],
        path: '/admin/bookings'
    },
    {
        id: 'admin-analytics',
        label: 'Analytics',
        icon: CalendarDays,
        roles: ['admin'],
        path: '/admin/analytics'
    },
    {
        id: 'admin-settings',
        label: 'Settings',
        icon: Settings,
        roles: ['admin'],
        path: '/admin/settings'
    },
];

export const Navigation: React.FC<NavigationProps> = ({
    activeView,
    onViewChange,
    userRole
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    // Filter nav items based on user role
    const visibleNavItems = navItems.filter(item =>
        item.roles.includes(userRole)
    );

    // Separate staff and admin items for better organization
    const staffItems = visibleNavItems.filter(item =>
        !item.id.startsWith('admin-')
    );
    const adminItems = visibleNavItems.filter(item =>
        item.id.startsWith('admin-')
    );

    const handleNavigation = (item: NavItem) => {
        if (onViewChange) {
            onViewChange(item.id);
        } else {
            navigate(item.path);
        }
    };

    const renderNavItems = (items: NavItem[], section?: string) => (
        <>
            {section && items.length > 0 && (
                <div className="hidden md:block px-3 py-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {section}
                    </span>
                </div>
            )}
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id || location.pathname === item.path;

                return (
                    <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        onClick={() => handleNavigation(item)}
                        className={cn(
                            "flex items-center gap-2 transition-all duration-200 justify-start",
                            "md:mx-2",
                            isActive
                                ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                                : "hover:bg-gray-100 text-gray-700"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden md:inline">{item.label}</span>
                    </Button>
                );
            })}
        </>
    );

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-1 py-4">
                    {renderNavItems(staffItems)}
                    {adminItems.length > 0 && staffItems.length > 0 && (
                        <div className="h-6 w-px bg-gray-300 mx-4" />
                    )}
                    {renderNavItems(adminItems, userRole === 'admin' ? 'Admin' : undefined)}
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <div className="grid grid-cols-4 gap-1 p-2">
                        {visibleNavItems.slice(0, 4).map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.id || location.pathname === item.path;

                            return (
                                <Button
                                    key={item.id}
                                    variant={isActive ? "default" : "ghost"}
                                    onClick={() => handleNavigation(item)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 h-auto py-3 text-xs",
                                        isActive
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-600"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="truncate">{item.label}</span>
                                </Button>
                            );
                        })}
                    </div>

                    {/* Mobile overflow menu for additional items */}
                    {visibleNavItems.length > 4 && (
                        <div className="border-t border-gray-200 p-2">
                            <div className="grid grid-cols-2 gap-1">
                                {visibleNavItems.slice(4).map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeView === item.id || location.pathname === item.path;

                                    return (
                                        <Button
                                            key={item.id}
                                            variant={isActive ? "default" : "ghost"}
                                            onClick={() => handleNavigation(item)}
                                            className={cn(
                                                "flex items-center gap-2 justify-start text-xs py-2",
                                                isActive
                                                    ? "bg-blue-600 text-white"
                                                    : "text-gray-600"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};