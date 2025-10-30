import React from 'react';
import { BookingList } from '@/components/booking/BookingList';
import { usePageTitle } from '@/hooks/usePageTitle';

export const MyBookings: React.FC = () => {
    usePageTitle('My Bookings - VII Bookings');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-gray-600 mt-1">
                    View and manage your meeting room reservations
                </p>
            </div>

            <BookingList />
        </div>
    );
};