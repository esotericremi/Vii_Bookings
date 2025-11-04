import React from 'react';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { usePageTitle } from '@/hooks/usePageTitle';

const Settings: React.FC = () => {
    usePageTitle('Settings - VII Bookings');

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <SystemSettings />
        </div>
    );
};

export default Settings;