import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
    children: React.ReactNode;
    activeView?: string;
    onViewChange?: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    activeView = 'rooms',
    onViewChange
}) => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();

    const handleViewChange = (view: string) => {
        if (onViewChange) {
            onViewChange(view);
        } else {
            // Default routing behavior
            switch (view) {
                case 'rooms':
                    navigate('/');
                    break;
                case 'dashboard':
                    navigate('/dashboard');
                    break;
                case 'room-selection':
                    navigate('/rooms');
                    break;
                case 'admin-bookings':
                    navigate('/admin/bookings');
                    break;
                case 'admin-settings':
                    navigate('/admin/settings');
                    break;
                default:
                    if (onViewChange) onViewChange(view);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <Navigation
                activeView={activeView}
                onViewChange={handleViewChange}
                userRole={userProfile?.role || 'staff'}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
            <NotificationCenter />
        </div>
    );
};