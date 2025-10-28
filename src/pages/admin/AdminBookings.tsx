import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { BookingManagement } from '@/components/admin/BookingManagement';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const AdminBookings: React.FC = () => {
    const { userProfile } = useAuth();

    // Check if user is admin
    if (!userProfile || userProfile.role !== 'admin') {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <Layout activeView="admin">
            <div className="container mx-auto px-4 py-6">
                <BookingManagement />
            </div>
        </Layout>
    );
};

export default AdminBookings;