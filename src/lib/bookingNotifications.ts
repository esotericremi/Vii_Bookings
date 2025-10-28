import { notificationQueries } from './queries';
import { BookingWithRelations } from '@/types/booking';
import { format } from 'date-fns';

export class BookingNotificationService {
    /**
     * Create notification for booking confirmation
     */
    static async notifyBookingConfirmed(booking: BookingWithRelations) {
        if (!booking.user_id) return;

        const roomName = booking.room?.name || 'Unknown Room';
        const dateTime = format(new Date(booking.start_time), "MMM dd, yyyy 'at' h:mm a");

        await notificationQueries.createBookingNotification(
            booking.user_id,
            booking.id,
            roomName,
            'booking_confirmed',
            `Your booking for ${roomName} on ${dateTime} has been confirmed.`
        );
    }

    /**
     * Create notification for booking cancellation
     */
    static async notifyBookingCancelled(booking: BookingWithRelations, reason?: string) {
        if (!booking.user_id) return;

        const roomName = booking.room?.name || 'Unknown Room';
        const dateTime = format(new Date(booking.start_time), "MMM dd, yyyy 'at' h:mm a");
        const message = reason
            ? `Your booking for ${roomName} on ${dateTime} has been cancelled. Reason: ${reason}`
            : `Your booking for ${roomName} on ${dateTime} has been cancelled.`;

        await notificationQueries.createBookingNotification(
            booking.user_id,
            booking.id,
            roomName,
            'booking_cancelled',
            message
        );
    }

    /**
     * Create notification for booking modification
     */
    static async notifyBookingModified(booking: BookingWithRelations, changes: string[]) {
        if (!booking.user_id) return;

        const roomName = booking.room?.name || 'Unknown Room';
        const dateTime = format(new Date(booking.start_time), "MMM dd, yyyy 'at' h:mm a");
        const changesText = changes.join(', ');

        await notificationQueries.createBookingNotification(
            booking.user_id,
            booking.id,
            roomName,
            'booking_modified',
            `Your booking for ${roomName} on ${dateTime} has been modified. Changes: ${changesText}`
        );
    }

    /**
     * Create notification for admin override
     */
    static async notifyAdminOverride(booking: BookingWithRelations, adminName: string, reason?: string) {
        if (!booking.user_id) return;

        const roomName = booking.room?.name || 'Unknown Room';
        const dateTime = format(new Date(booking.start_time), "MMM dd, yyyy 'at' h:mm a");
        const message = reason
            ? `Your booking for ${roomName} on ${dateTime} has been modified by ${adminName}. Reason: ${reason}`
            : `Your booking for ${roomName} on ${dateTime} has been modified by ${adminName}.`;

        await notificationQueries.createBookingNotification(
            booking.user_id,
            booking.id,
            roomName,
            'admin_override',
            message
        );
    }

    /**
     * Create reminder notification for upcoming booking
     */
    static async notifyBookingReminder(booking: BookingWithRelations, minutesBefore: number) {
        if (!booking.user_id) return;

        const roomName = booking.room?.name || 'Unknown Room';
        const startTime = format(new Date(booking.start_time), "h:mm a");

        await notificationQueries.create({
            user_id: booking.user_id,
            title: 'Upcoming Meeting Reminder',
            message: `Your meeting "${booking.title}" in ${roomName} starts at ${startTime} (in ${minutesBefore} minutes).`,
            type: 'booking_reminder'
        });
    }

    /**
     * Create notification for booking conflict resolution
     */
    static async notifyConflictResolved(booking: BookingWithRelations, resolution: string) {
        if (!booking.user_id) return;

        const roomName = booking.room?.name || 'Unknown Room';

        await notificationQueries.create({
            user_id: booking.user_id,
            title: 'Booking Conflict Resolved',
            message: `The conflict with your booking "${booking.title}" in ${roomName} has been resolved. ${resolution}`,
            type: 'booking_modified'
        });
    }

    /**
     * Batch create notifications for multiple users (e.g., attendees)
     */
    static async notifyAttendees(
        userIds: string[],
        booking: BookingWithRelations,
        type: 'booking_confirmed' | 'booking_cancelled' | 'booking_modified',
        customMessage?: string
    ) {
        const roomName = booking.room?.name || 'Unknown Room';
        const dateTime = format(new Date(booking.start_time), "MMM dd, yyyy 'at' h:mm a");

        const notifications = userIds.map(userId => {
            let message = customMessage;
            if (!message) {
                switch (type) {
                    case 'booking_confirmed':
                        message = `You've been invited to "${booking.title}" in ${roomName} on ${dateTime}.`;
                        break;
                    case 'booking_cancelled':
                        message = `The meeting "${booking.title}" in ${roomName} on ${dateTime} has been cancelled.`;
                        break;
                    case 'booking_modified':
                        message = `The meeting "${booking.title}" in ${roomName} on ${dateTime} has been updated.`;
                        break;
                }
            }

            return {
                user_id: userId,
                title: type === 'booking_confirmed' ? 'Meeting Invitation' :
                    type === 'booking_cancelled' ? 'Meeting Cancelled' : 'Meeting Updated',
                message: message!,
                type
            };
        });

        await notificationQueries.createBulk(notifications);
    }
}

/**
 * Hook into booking mutations to automatically trigger notifications
 */
export const setupBookingNotificationTriggers = () => {
    // This would be called in the main app setup to register notification triggers
    // For now, we'll manually call these in the booking mutation handlers
};

/**
 * Utility to determine what changed in a booking update
 */
export const getBookingChanges = (
    original: BookingWithRelations,
    updated: Partial<BookingWithRelations>
): string[] => {
    const changes: string[] = [];

    if (updated.title && updated.title !== original.title) {
        changes.push('title');
    }

    if (updated.start_time && updated.start_time !== original.start_time) {
        changes.push('start time');
    }

    if (updated.end_time && updated.end_time !== original.end_time) {
        changes.push('end time');
    }

    if (updated.room_id && updated.room_id !== original.room_id) {
        changes.push('room');
    }

    if (updated.description !== undefined && updated.description !== original.description) {
        changes.push('description');
    }

    return changes;
};