import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { bookingQueries } from '@/lib/queries';
import { NotificationService } from '@/lib/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/components/shared/NetworkStatusProvider';
import { useLoadingState } from '@/hooks/useLoadingState';
import { toast } from '@/hooks/use-toast';
import type { BookingWithRelations, BookingFormData } from '@/types/booking';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Query keys with better cache invalidation structure
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
    // Add pagination-specific keys
    paginated: (filters: any) => [...bookingKeys.lists(), 'paginated', { filters }] as const,
    // Add analytics keys for better caching
    analytics: () => [...bookingKeys.all, 'analytics'] as const,
    trends: (period: string) => [...bookingKeys.analytics(), 'trends', period] as const,
};

// Hook to get bookings with filtering and pagination
export const useBookings = (filters?: {
    userId?: string;
    roomId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    includeCount?: boolean;
}) => {
    const { isOffline } = useNetworkStatus();

    return useQuery({
        queryKey: bookingKeys.list(filters),
        queryFn: () => bookingQueries.getAll(filters),
        staleTime: 2 * 60 * 1000, // 2 minutes
        enabled: !isOffline, // Disable when offline
        retry: (failureCount, error) => {
            // Don't retry if offline
            if (!navigator.onLine) return false;
            // Retry up to 3 times for network errors
            return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};

// Hook to get bookings with pagination support and optimized caching
export const useBookingsPaginated = (filters?: {
    userId?: string;
    roomId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}) => {
    const { isOffline } = useNetworkStatus();

    return useQuery({
        queryKey: bookingKeys.paginated(filters),
        queryFn: () => bookingQueries.getAll({ ...filters, includeCount: true }),
        staleTime: 1 * 60 * 1000, // 1 minute for paginated data (more dynamic)
        gcTime: 5 * 60 * 1000, // 5 minutes cache time
        enabled: !isOffline,
        retry: (failureCount, error) => {
            if (!navigator.onLine) return false;
            return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Keep previous data while fetching new page
        placeholderData: (previousData) => previousData,
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
    const { isOffline } = useNetworkStatus();
    const loadingState = useLoadingState({
        initialText: 'Creating booking...',
        stages: ['Validating availability', 'Creating booking', 'Sending notifications']
    });

    return useMutation({
        mutationFn: async (booking: BookingFormData & { user_id: string }) => {
            if (isOffline) {
                throw new Error('Cannot create booking while offline. Please check your connection.');
            }

            loadingState.startLoading();
            loadingState.updateStage(0);

            try {
                const result = await bookingQueries.create(booking);
                loadingState.updateStage(1);
                return result;
            } finally {
                loadingState.stopLoading();
            }
        },
        onSuccess: async (data) => {
            loadingState.updateStage(2);

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.room_id) });

            // Create notification for booking confirmation
            try {
                await NotificationService.createBookingConfirmedNotification(data);
            } catch (error) {
                console.error('Failed to create booking confirmation notification:', error);
                // Don't fail the mutation for notification errors
                toast({
                    title: 'Booking Created',
                    description: 'Your booking was created successfully, but we couldn\'t send the confirmation notification.',
                    variant: 'default',
                });
            }

            toast({
                title: 'Booking Created',
                description: `Your booking for ${data.room?.name} has been confirmed.`,
            });
        },
        onError: (error: any) => {
            console.error('Booking creation failed:', error);

            // Handle specific error types
            if (error.message?.includes('conflict')) {
                toast({
                    title: 'Booking Conflict',
                    description: 'This time slot is no longer available. Please select a different time.',
                    variant: 'destructive',
                });
            } else if (isOffline) {
                toast({
                    title: 'Offline',
                    description: 'Cannot create booking while offline. Please check your connection.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Booking Failed',
                    description: error.message || 'Failed to create booking. Please try again.',
                    variant: 'destructive',
                });
            }
        },
        retry: false, // Don't auto-retry booking creation
    });
};

export const useUpdateBooking = () => {
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookingWithRelations> }) => {
            // Get original booking for comparison
            const originalBooking = await bookingQueries.getById(id);
            const updatedBooking = await bookingQueries.update(id, updates);

            return { originalBooking, updatedBooking };
        },
        onSuccess: async ({ originalBooking, updatedBooking }) => {
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(updatedBooking.id), updatedBooking);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(updatedBooking.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(updatedBooking.room_id) });

            // Create notification for booking modification
            try {
                await NotificationService.createBookingModifiedNotification(
                    originalBooking,
                    updatedBooking,
                    userProfile?.id
                );
            } catch (error) {
                console.error('Failed to create booking modification notification:', error);
            }
        },
    });
};

export const useCancelBooking = () => {
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();

    return useMutation({
        mutationFn: bookingQueries.cancel,
        onSuccess: async (data) => {
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.room_id) });

            // Create notification for booking cancellation
            try {
                await NotificationService.createBookingCancelledNotification(
                    data,
                    userProfile?.id
                );
            } catch (error) {
                console.error('Failed to create booking cancellation notification:', error);
            }
        },
    });
};

// Admin-specific hooks with notification support
export const useAdminCreateBooking = () => {
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();

    return useMutation({
        mutationFn: (booking: BookingFormData & { user_id: string }) =>
            bookingQueries.create(booking),
        onSuccess: async (data) => {
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.room_id) });

            // Create appropriate notification
            try {
                if (userProfile?.id === data.user_id) {
                    // Admin creating booking for themselves
                    await NotificationService.createBookingConfirmedNotification(data);
                } else if (userProfile?.role === 'admin') {
                    // Admin creating booking for another user
                    await NotificationService.createAdminOverrideNotification(
                        data,
                        userProfile,
                        'created'
                    );
                }
            } catch (error) {
                console.error('Failed to create admin booking notification:', error);
            }
        },
    });
};

export const useAdminUpdateBooking = () => {
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookingWithRelations> }) => {
            const originalBooking = await bookingQueries.getById(id);
            const updatedBooking = await bookingQueries.update(id, updates);

            return { originalBooking, updatedBooking };
        },
        onSuccess: async ({ originalBooking, updatedBooking }) => {
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(updatedBooking.id), updatedBooking);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(updatedBooking.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(updatedBooking.room_id) });

            // Create appropriate notification
            try {
                if (userProfile?.id === updatedBooking.user_id) {
                    // User updating their own booking
                    await NotificationService.createBookingModifiedNotification(
                        originalBooking,
                        updatedBooking,
                        userProfile.id
                    );
                } else if (userProfile?.role === 'admin') {
                    // Admin updating another user's booking
                    await NotificationService.createAdminOverrideNotification(
                        updatedBooking,
                        userProfile,
                        'modified'
                    );
                }
            } catch (error) {
                console.error('Failed to create admin booking update notification:', error);
            }
        },
    });
};

export const useAdminCancelBooking = () => {
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();

    return useMutation({
        mutationFn: bookingQueries.cancel,
        onSuccess: async (data) => {
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.room_id) });

            // Create appropriate notification
            try {
                if (userProfile?.id === data.user_id) {
                    // User cancelling their own booking
                    await NotificationService.createBookingCancelledNotification(
                        data,
                        userProfile.id
                    );
                } else if (userProfile?.role === 'admin') {
                    // Admin cancelling another user's booking
                    await NotificationService.createAdminOverrideNotification(
                        data,
                        userProfile,
                        'cancelled'
                    );
                }
            } catch (error) {
                console.error('Failed to create admin booking cancellation notification:', error);
            }
        },
    });
};