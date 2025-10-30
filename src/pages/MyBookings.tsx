import React from 'react';
import { BookingList } from '@/components/booking/BookingList';
import { usePageTitle } from '@/hooks/usePageTitle';

export const MyBookings: React.FC = () => {
    usePageTitle('My Bookings - VII Bookings');

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <BookingList />
        </div>
    );
};