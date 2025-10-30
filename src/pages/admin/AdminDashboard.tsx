import React from 'react';
import { AdminDashboard as AdminDashboardComponent } from '@/components/AdminDashboard';
import { usePageTitle } from '@/hooks/usePageTitle';

const AdminDashboard: React.FC = () => {
    usePageTitle('Admin Dashboard - VII Bookings');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">
                    Overview of room bookings and system status
                </p>
            </div>

            <AdminDashboardComponent />
        </div>
    );
};

export default AdminDashboard;