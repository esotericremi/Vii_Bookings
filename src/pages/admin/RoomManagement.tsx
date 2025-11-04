import React from 'react';
import { RoomManagement as RoomManagementComponent } from '@/components/admin/RoomManagement';
import { usePageTitle } from '@/hooks/usePageTitle';

export const RoomManagement: React.FC = () => {
    usePageTitle('Room Management - VII Bookings');

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <RoomManagementComponent />
        </div>
    );
};