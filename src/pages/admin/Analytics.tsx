import React from 'react';
import { Analytics as AnalyticsComponent } from '@/components/admin/Analytics';
import { usePageTitle } from '@/hooks/usePageTitle';

export const Analytics: React.FC = () => {
    usePageTitle('Analytics - VII Bookings');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-1">
                    Room usage statistics and booking insights
                </p>
            </div>

            <AnalyticsComponent />
        </div>
    );
};