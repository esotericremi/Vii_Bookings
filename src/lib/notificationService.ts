import { supabase } from './supabase';
import { notificationQueries } from './queries';
import type { Booking, BookingWithRelations, User } from '@/types';
import type { CreateNotificationData, NotificationType } from '@/types/notification';

export class NotificationService {
    /**
     * Create a notification for booking confirmation
     */
    static async createBookingConfirmedNotification(
        booking: BookingWithRelations
    ): Promise<void> {
        const message = `Your booking for ${booking.room?.name} on ${new Date(booking.start_time).toLocaleDateString()} from ${new Date(booking.start_time).toLocaleTimeString()} to ${new Date(booking.end_time).toLocaleTimeString()} has been confirmed.`;

        await notificationQueries.create({
            user_id: booking.user_id,
            title: 'Booking Confirmed',
            message,
            type: 'booking_confirmed'
        });
    }

    /**
     * Create a notification for booking cancellation
     */
    static async createBookingCancelledNotification(
        booking: BookingWithRelations,
        cancelledBy?: string
    ): Promise<void> {
        const isAdminCancellation = cancelledBy && cancelledBy !== booking.user_id;
        const message = isAdminCancellation
            ? `Your booking for ${booking.room?.name} on ${new Date(booking.start_time).toLocaleDateString()} has been cancelled by an administrator.`
            : `Your booking for ${booking.room?.name} on ${new Date(booking.start_time).toLocaleDateString()} has been cancelled.`;

        await notificationQueries.create({
            user_id: booking.user_id,
            title: isAdminCancellation ? 'Booking Cancelled by Admin' : 'Booking Cancelled',
            message,
            type: isAdminCancellation ? 'admin_override' : 'booking_cancelled'
        });
    }

    /**
     * Create a notification for booking modification
     */
    static async createBookingModifiedNotification(
        originalBooking: BookingWithRelations,
        updatedBooking: BookingWithRelations,
        modifiedBy?: string
    ): Promise<void> {
        const isAdminModification = modifiedBy && modifiedBy !== originalBooking.user_id;

        // Determine what changed
        const changes: string[] = [];

        if (originalBooking.start_time !== updatedBooking.start_time || originalBooking.end_time !== updatedBooking.end_time) {
            changes.push(`time changed to ${new Date(updatedBooking.start_time).toLocaleTimeString()} - ${new Date(updatedBooking.end_time).toLocaleTimeString()}`);
        }

        if (originalBooking.room_id !== updatedBooking.room_id) {
            changes.push(`room changed to ${updatedBooking.room?.name}`);
        }

        if (originalBooking.title !== updatedBooking.title) {
            changes.push('title updated');
        }

        const changeText = changes.length > 0 ? ` (${changes.join(', ')})` : '';
        const message = isAdminModification
            ? `Your booking for ${updatedBooking.room?.name} on ${new Date(updatedBooking.start_time).toLocaleDateString()} has been modified by an administrator${changeText}.`
            : `Your booking for ${updatedBooking.room?.name} on ${new Date(updatedBooking.start_time).toLocaleDateString()} has been updated${changeText}.`;

        await notificationQueries.create({
            user_id: updatedBooking.user_id,
            title: isAdminModification ? 'Booking Modified by Admin' : 'Booking Modified',
            message,
            type: isAdminModification ? 'admin_override' : 'booking_modified'
        });
    }

    /**
     * Create notifications for admin override actions
     */
    static async createAdminOverrideNotification(
        booking: BookingWithRelations,
        adminUser: User,
        action: 'created' | 'modified' | 'cancelled'
    ): Promise<void> {
        const actionText = {
            created: 'created',
            modified: 'modified',
            cancelled: 'cancelled'
        };

        const message = `Your booking for ${booking.room?.name} on ${new Date(booking.start_time).toLocaleDateString()} has been ${actionText[action]} by administrator ${adminUser.full_name}.`;

        await notificationQueries.create({
            user_id: booking.user_id,
            title: `Booking ${actionText[action].charAt(0).toUpperCase() + actionText[action].slice(1)} by Admin`,
            message,
            type: 'admin_override'
        });
    }

    /**
     * Create system error notifications
     */
    static async createSystemErrorNotification(
        userId: string,
        error: string,
        context?: string
    ): Promise<void> {
        const message = context
            ? `System error occurred while ${context}: ${error}`
            : `System error: ${error}`;

        await notificationQueries.create({
            user_id: userId,
            title: 'System Error',
            message,
            type: 'system_error'
        });
    }

    /**
     * Create booking reminder notifications (for future implementation)
     */
    static async createBookingReminderNotification(
        booking: BookingWithRelations,
        minutesBefore: number = 15
    ): Promise<void> {
        const message = `Reminder: Your meeting in ${booking.room?.name} starts in ${minutesBefore} minutes.`;

        await notificationQueries.create({
            user_id: booking.user_id,
            title: 'Meeting Reminder',
            message,
            type: 'booking_confirmed' // Using existing type for now
        });
    }

    /**
     * Bulk create notifications for multiple users
     */
    static async createBulkNotifications(
        userIds: string[],
        title: string,
        message: string,
        type: NotificationType
    ): Promise<void> {
        const notifications: CreateNotificationData[] = userIds.map(userId => ({
            user_id: userId,
            title,
            message,
            type
        }));

        await notificationQueries.createBulk(notifications);
    }

    /**
     * Clean up old notifications for a user
     */
    static async cleanupOldNotifications(
        userId: string,
        daysOld: number = 30
    ): Promise<void> {
        await notificationQueries.deleteOld(userId, daysOld);
    }

    /**
     * Clean up old notifications for all users (admin function)
     */
    static async cleanupAllOldNotifications(daysOld: number = 30): Promise<void> {
        // Get all users
        const { data: users, error } = await supabase
            .from('users')
            .select('id');

        if (error) {
            console.error('Error fetching users for cleanup:', error);
            return;
        }

        // Clean up notifications for each user
        const cleanupPromises = users?.map(user =>
            this.cleanupOldNotifications(user.id, daysOld)
        ) || [];

        await Promise.allSettled(cleanupPromises);
    }
}