import React from 'react';
import { RoomManagement as RoomManagementComponent } from '@/components/admin/RoomManagement';
import { usePageTitle } from '@/hooks/usePageTitle';

export const RoomManagement: React.FC = () => {
    usePageTitle('Room Management - VII Bookings');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
                <p className="text-gray-600 mt-1">
                    Create, edit, and manage meeting rooms
                </p>
            </div>

            <RoomManagementComponent />
        </div>
    );
};