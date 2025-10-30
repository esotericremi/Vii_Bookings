import React from 'react';
import { useParams } from 'react-router-dom';
import { RealTimeBookingForm } from '@/components/booking/RealTimeBookingForm';
import { usePageTitle } from '@/hooks/usePageTitle';

export const BookingForm: React.FC = () => {
    const { roomId } = useParams<{ roomId?: string }>();
    usePageTitle('Book Room - VII Bookings');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Book a Room</h1>
                <p className="text-gray-600 mt-1">
                    Reserve a meeting room for your upcoming meeting
                </p>
            </div>

            <RealTimeBookingForm roomId={roomId} />
        </div>
    );
};