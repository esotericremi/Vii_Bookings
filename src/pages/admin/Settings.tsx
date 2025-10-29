import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { SystemSettings } from '@/components/admin/SystemSettings';

const Settings: React.FC = () => {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <SystemSettings />
            </div>
        </Layout>
    );
};

export default Settings;