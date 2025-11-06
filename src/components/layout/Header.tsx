import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useEnhancedAdminNotifications } from '@/hooks/useRealTimeAvailability';
import { CompactEnhancedConnectionStatus } from '@/components/shared/EnhancedConnectionStatus';
import { NotificationCenter } from './NotificationCenter';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useBranding } from '@/contexts/BrandingContext';

export const Header: React.FC = () => {
    const { userProfile } = useAuth();
    const { unreadCount } = useNotifications();
    const { companyName, isLoading } = useBranding();

    // Enhanced admin notifications for admin users
    const {
        connectionStatus: adminConnectionStatus,
        recentNotifications
    } = useEnhancedAdminNotifications(
        userProfile?.role === 'admin' ? userProfile.id : ''
    );

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="flex items-center justify-between h-16 px-4">
                {/* Left side - Sidebar trigger and Company Name */}
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <div className="hidden sm:block">
                        {isLoading ? (
                            <div className="animate-pulse">
                                <div className="h-6 w-32 bg-gray-300 rounded"></div>
                            </div>
                        ) : (
                            <h1 className="text-xl font-bold text-foreground">
                                {companyName}
                            </h1>
                        )}
                    </div>
                </div>

                {/* Right side - Connection Status and Notifications */}
                <div className="flex items-center space-x-4">
                    {/* Enhanced Connection Status */}
                    <CompactEnhancedConnectionStatus />

                    {/* Admin Real-time Notifications Indicator */}
                    {userProfile?.role === 'admin' && recentNotifications.length > 0 && (
                        <div className="relative">
                            <Badge
                                variant="outline"
                                className="h-6 px-2 text-xs bg-orange-50 text-orange-700 border-orange-200"
                            >
                                {recentNotifications.length} admin
                            </Badge>
                            {adminConnectionStatus === 'connected' && (
                                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                        </div>
                    )}

                    {/* Notifications - Now properly integrated in header */}
                    <NotificationCenter />
                </div>
            </div>
        </header>
    );
};