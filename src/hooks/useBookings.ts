import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { bookingQueries } from '@/lib/queries';
import type { BookingWithRelations, BookingFormData } from '@/types/booking';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Query keys
export const bookingKeys = {
    all: ['bookings'] as const,
    lists: () => [...bookingKeys.all, 'list'] as const,
    list: (filters: any) => [...bookingKeys.lists(), { filters }] as const,
    details: () => [...bookingKeys.all, 'detail'] as const,
    detail: (id: string) => [...bookingKeys.details(), id] as const,
    user: (userId: string) => [...bookingKeys.all, 'user', userId] as const,
    room: (roomId: string) => [...bookingKeys.all, 'room', roomId] as const,
    conflicts: (roomId: string, startTime: string, endTime: string) =>
        [...bookingKeys.all, 'conflicts', roomId, startTime, endTime] as const,
};

// Hook to get bookings with filtering
export const useBookings = (filters?: {
    userId?: string;
    roomId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}) => {
    return useQuery({
        queryKey: bookingKeys.list(filters),
        queryFn: () => bookingQueries.getAll(filters),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

// Hook to get a single booking
export const useBooking = (id: string) => {
    return useQuery({
        queryKey: bookingKeys.detail(id),
        queryFn: () => bookingQueries.getById(id),
        enabled: !!id,
    });
};

// Hook to get user's bookings
export const useUserBookings = (userId: string, type?: 'upcoming' | 'past') => {
    return useQuery({
        queryKey: bookingKeys.user(userId),
        queryFn: () => {
            if (type === 'upcoming') {
                return bookingQueries.getUpcoming(userId);
            } else if (type === 'past') {
                return bookingQueries.getPast(userId);
            }
            return bookingQueries.getAll({ userId });
        },
        enabled: !!userId,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

// Hook to get room bookings for a date range
export const useRoomBookings = (roomId: string, startDate: string, endDate: string) => {
    return useQuery({
        queryKey: bookingKeys.room(roomId),
        queryFn: () => bookingQueries.getByDateRange(startDate, endDate, roomId),
        enabled: !!roomId && !!startDate && !!endDate,
        staleTime: 1 * 60 * 1000,
    });
};

// Hook to check booking conflicts
export const useBookingConflicts = (
    roomId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
) => {
    return useQuery({
        queryKey: bookingKeys.conflicts(roomId, startTime, endTime),
        queryFn: () => bookingQueries.checkConflicts(roomId, startTime, endTime, excludeBookingId),
        enabled: !!roomId && !!startTime && !!endTime,
        staleTime: 30 * 1000, // 30 seconds
    });
};

// Hook for real-time booking updates
export const useBookingsRealtime = (filters?: { roomId?: string; userId?: string }) => {
    const queryClient = useQueryClient();
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        const realtimeChannel = bookingQueries.subscribe((payload) => {
            // Invalidate and refetch booking queries when bookings change
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });

            // Update specific booking if we have the ID
            if (payload.new?.id) {
                queryClient.setQueryData(
                    bookingKeys.detail(payload.new.id),
                    payload.eventType === 'DELETE' ? null : payload.new
                );
            }

            // Invalidate room-specific queries if room_id is available
            if (payload.new?.room_id || payload.old?.room_id) {
                const roomId = payload.new?.room_id || payload.old?.room_id;
                queryClient.invalidateQueries({ queryKey: bookingKeys.room(roomId!) });
            }

            // Invalidate user-specific queries if user_id is available
            if (payload.new?.user_id || payload.old?.user_id) {
                const userId = payload.new?.user_id || payload.old?.user_id;
                queryClient.invalidateQueries({ queryKey: bookingKeys.user(userId!) });
            }
        }, filters);

        setChannel(realtimeChannel);

        return () => {
            if (realtimeChannel) {
                realtimeChannel.unsubscribe();
            }
        };
    }, [queryClient, filters]);

    return useBookings();
};

// Mutation hooks for booking management
export const useCreateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (booking: BookingFormData & { user_id: string }) =>
            bookingQueries.create(booking),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.room_id) });
        },
    });
};

export const useUpdateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<BookingWithRelations> }) =>
            bookingQueries.update(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.room_id) });
        },
    });
};

export const useCancelBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: bookingQueries.cancel,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.room_id) });
        },
    });
};