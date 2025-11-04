import React from 'react';
import { AdminDashboard as AdminDashboardComponent } from '@/components/AdminDashboard';
import { usePageTitle } from '@/hooks/usePageTitle';

const AdminDashboard: React.FC = () => {
    usePageTitle('Admin Dashboard - VII Bookings');

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <AdminDashboardComponent />
        </div>
    );
};

export default AdminDashboard;