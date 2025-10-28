import { Tables } from './database';

// Core booking types from database
export type Booking = Tables<'bookings'>;
export type BookingInsert = Tables<'bookings'>['Insert'];
export type BookingUpdate = Tables<'bookings'>['Update'];

// Extended booking interface with relations
export interface BookingWithRelations extends Booking {
    room?: Room;
    user?: User;
}

// Booking status enum
export type BookingStatus = 'confirmed' | 'cancelled' | 'pending';

// Booking form data interface
export interface BookingFormData {
    room_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    attendees?: string[];
}

// Booking conflict interface
export interface BookingConflict {
    conflicting_booking: Booking;
    overlap_start: string;
    overlap_end: string;
}

// Time slot interface for availability display
export interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
    booking?: Booking;
}

// Room availability interface
export interface RoomAvailability {
    room_id: string;
    date: string;
    slots: TimeSlot[];
}

// Booking analytics interface
export interface BookingAnalytics {
    total_bookings: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    utilization_rate: number;
    peak_hours: { hour: number; count: number }[];
    popular_rooms: { room_id: string; room_name: string; booking_count: number }[];
}

// Import types for relations
import type { Room } from './room';
import type { User } from './user';