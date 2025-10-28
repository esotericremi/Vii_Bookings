import React from 'react';
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
    onViewChange = () => { }
}) => {
    const { userProfile } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <Navigation
                activeView={activeView}
                onViewChange={onViewChange}
                userRole={userProfile?.role || 'staff'}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
            <NotificationCenter />
        </div>
    );
};