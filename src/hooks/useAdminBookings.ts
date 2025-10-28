import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingQueries } from '@/lib/queries';
import { BookingNotificationService } from '@/lib/bookingNotifications';
import { bookingKeys } from './useBookings';
import type { BookingWithRelations } from '@/types/booking';

// Admin-specific booking management hooks
export const useAdminUpdateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            updates,
            adminName,
            reason
        }: {
            id: string;
            updates: Partial<BookingWithRelations>;
            adminName: string;
            reason?: string;
        }) => {
            // Get original booking for comparison
            const originalBooking = await bookingQueries.getById(id);

            // Update booking with admin override flag
            const updatedBooking = await bookingQueries.update(id, {
                ...updates,
                is_admin_override: true
            });

            // Send notification to user about admin override
            await BookingNotificationService.notifyAdminOverride(
                updatedBooking,
                adminName,
                reason
            );

            return { originalBooking, updatedBooking };
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(data.updatedBooking.id), data.updatedBooking);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.updatedBooking.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.updatedBooking.room_id) });
        },
    });
};

export const useAdminCancelBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            bookingId,
            adminName,
            reason
        }: {
            bookingId: string;
            adminName: string;
            reason?: string;
        }) => {
            // Get booking before cancellation
            const booking = await bookingQueries.getById(bookingId);

            // Cancel booking
            const cancelledBooking = await bookingQueries.cancel(bookingId);

            // Send notification to user
            await BookingNotificationService.notifyBookingCancelled(
                cancelledBooking,
                reason ? `Cancelled by ${adminName}. Reason: ${reason}` : `Cancelled by ${adminName}`
            );

            return cancelledBooking;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(data.id), data);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.room_id) });
        },
    });
};

export const useAdminBulkCancelBookings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            bookingIds,
            adminName,
            reason
        }: {
            bookingIds: string[];
            adminName: string;
            reason?: string;
        }) => {
            const results = [];
            const affectedUserIds = new Set<string>();

            for (const bookingId of bookingIds) {
                try {
                    // Get booking before cancellation
                    const booking = await bookingQueries.getById(bookingId);
                    affectedUserIds.add(booking.user_id);

                    // Cancel booking
                    const cancelledBooking = await bookingQueries.cancel(bookingId);
                    results.push({ success: true, booking: cancelledBooking });
                } catch (error) {
                    results.push({ success: false, bookingId, error });
                }
            }

            // Send bulk notification to affected users
            if (affectedUserIds.size > 0) {
                await BookingNotificationService.notifyBulkCancellation(
                    Array.from(affectedUserIds),
                    adminName,
                    reason
                );
            }

            return results;
        },
        onSuccess: () => {
            // Invalidate all booking-related queries
            queryClient.invalidateQueries({ queryKey: bookingKeys.all });
        },
    });
};

export const useAdminReassignBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            bookingId,
            newRoomId,
            adminName,
            reason
        }: {
            bookingId: string;
            newRoomId: string;
            adminName: string;
            reason?: string;
        }) => {
            // Get original booking and room info
            const originalBooking = await bookingQueries.getById(bookingId);
            const oldRoomName = originalBooking.room?.name || 'Unknown Room';

            // Update booking with new room
            const updatedBooking = await bookingQueries.update(bookingId, {
                room_id: newRoomId,
                is_admin_override: true
            });

            // Get new room name for notification
            const newRoomName = updatedBooking.room?.name || 'Unknown Room';

            // Send notification about room reassignment
            await BookingNotificationService.notifyRoomReassignment(
                updatedBooking,
                oldRoomName,
                newRoomName,
                adminName,
                reason
            );

            return { originalBooking, updatedBooking };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.setQueryData(bookingKeys.detail(data.updatedBooking.id), data.updatedBooking);
            queryClient.invalidateQueries({ queryKey: bookingKeys.user(data.updatedBooking.user_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.originalBooking.room_id) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.room(data.updatedBooking.room_id) });
        },
    });
};

// Hook for admin conflict resolution
export const useAdminResolveConflict = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            conflictingBookings,
            resolution,
            adminName
        }: {
            conflictingBookings: BookingWithRelations[];
            resolution: 'cancel_first' | 'cancel_second' | 'reassign_first' | 'reassign_second';
            adminName: string;
        }) => {
            const results = [];

            switch (resolution) {
                case 'cancel_first':
                    const cancelled = await bookingQueries.cancel(conflictingBookings[0].id);
                    await BookingNotificationService.notifyBookingCancelled(
                        cancelled,
                        `Cancelled by ${adminName} to resolve booking conflict`
                    );
                    results.push({ action: 'cancelled', booking: cancelled });
                    break;

                case 'cancel_second':
                    const cancelled2 = await bookingQueries.cancel(conflictingBookings[1].id);
                    await BookingNotificationService.notifyBookingCancelled(
                        cancelled2,
                        `Cancelled by ${adminName} to resolve booking conflict`
                    );
                    results.push({ action: 'cancelled', booking: cancelled2 });
                    break;

                // Additional resolution strategies can be implemented here
                default:
                    throw new Error('Unsupported resolution strategy');
            }

            return results;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.all });
        },
    });
};