import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Settings, BarChart3, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AdminNavigationProps {
    className?: string;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({ className }) => {
    const location = useLocation();

    const navigationItems = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: Home,
            description: 'Overview and quick actions'
        },
        {
            title: 'Booking Management',
            href: '/admin/bookings',
            icon: Calendar,
            description: 'Manage all bookings and resolve conflicts',
            badge: 'New'
        },
        {
            title: 'Room Management',
            href: '/admin/rooms',
            icon: Users,
            description: 'Add, edit, and manage meeting rooms'
        },
        {
            title: 'Analytics',
            href: '/admin/analytics',
            icon: BarChart3,
            description: 'Usage reports and insights'
        },
        {
            title: 'Settings',
            href: '/admin/settings',
            icon: Settings,
            description: 'System configuration and preferences'
        }
    ];

    return (
        <div className={`space-y-4 ${className}`}>
            <div>
                <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;

                        return (
                            <Link key={item.href} to={item.href}>
                                <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isActive ? 'ring-2 ring-primary' : ''
                                    }`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <Icon className="h-6 w-6 text-primary" />
                                            {item.badge && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-medium mb-1">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};