import React from 'react';
import { BookingManagement } from '@/components/admin/BookingManagement';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';

const AdminBookings: React.FC = () => {
    const { userProfile } = useAuth();

    usePageTitle('All Bookings - VII Bookings');

    // Check if user is admin
    if (!userProfile || userProfile.role !== 'admin') {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <BookingManagement />
        </div>
    );
};

export default AdminBookings;