import React from 'react';
import { Analytics as AnalyticsComponent } from '@/components/admin/Analytics';
import { usePageTitle } from '@/hooks/usePageTitle';

export const Analytics: React.FC = () => {
    usePageTitle('Analytics - VII Bookings');

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            <AnalyticsComponent />
        </div>
    );
};