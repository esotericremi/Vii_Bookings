import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { usePageTitle } from '@/hooks/usePageTitle';

const Settings: React.FC = () => {
    usePageTitle('Settings - VII Bookings');

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <SystemSettings />
            </div>
        </Layout>
    );
};

export default Settings;