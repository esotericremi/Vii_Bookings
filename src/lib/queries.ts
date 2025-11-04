import { supabase } from './supabase';
import type {
    Room,
    Booking,
    User,
    SystemSettings,
    Notification,
    BookingWithRelations,
    RoomWithAvailability,
    BookingFormData,
    CreateNotificationData,
    RoomFilter,
    RealtimePayload
} from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Room queries
export const roomQueries = {
    // Get all active rooms
    getAll: async () => {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data as Room[];
    },

    // Get rooms with filtering and search
    getFiltered: async (filters: RoomFilter = {}) => {
        let query = supabase
            .from('rooms')
            .select('*')
            .eq('is_active', filters.is_active ?? true);

        // Apply capacity filters
        if (filters.capacity_min) {
            query = query.gte('capacity', filters.capacity_min);
        }
        if (filters.capacity_max) {
            query = query.lte('capacity', filters.capacity_max);
        }

        // Apply floor filter
        if (filters.floor) {
            query = query.eq('floor', filters.floor);
        }

        // Apply location filter
        if (filters.location) {
            query = query.eq('location', filters.location);
        }

        // Apply equipment filter (contains any of the specified equipment)
        if (filters.equipment && filters.equipment.length > 0) {
            query = query.overlaps('equipment', filters.equipment);
        }

        // Apply search filter (searches name, location, and description)
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        query = query.order('name');

        const { data, error } = await query;

        if (error) throw error;
        return data as Room[];
    },

    // Get room by ID
    getById: async (id: string) => {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Room;
    },

    // Create new room
    create: async (room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) => {
        const { data, error } = await supabase
            .from('rooms')
            .insert({
                ...room,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as Room;
    },

    // Update room
    update: async (id: string, updates: Partial<Room>) => {
        const { data, error } = await supabase
            .from('rooms')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Room;
    },

    // Delete room
    delete: async (id: string) => {
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Get room availability
    getAvailability: async (roomId: string, date: string) => {
        const { data, error } = await supabase
            .rpc('get_room_availability', {
                p_room_id: roomId,
                p_date: date
            });

        if (error) throw error;
        return data as RoomWithAvailability[];
    },

    // Get unique floors for filtering
    getFloors: async () => {
        const { data, error } = await supabase
            .from('rooms')
            .select('floor')
            .eq('is_active', true);

        if (error) throw error;

        const uniqueFloors = [...new Set(data?.map(room => room.floor) || [])];
        return uniqueFloors.sort();
    },

    // Get unique locations for filtering
    getLocations: async () => {
        const { data, error } = await supabase
            .from('rooms')
            .select('location')
            .eq('is_active', true);

        if (error) throw error;

        const uniqueLocations = [...new Set(data?.map(room => room.location) || [])];
        return uniqueLocations.sort();
    },

    // Get all unique equipment for filtering
    getEquipment: async () => {
        const { data, error } = await supabase
            .from('rooms')
            .select('equipment')
            .eq('is_active', true);

        if (error) throw error;

        const allEquipment = data?.flatMap(room => room.equipment || []) || [];
        const uniqueEquipment = [...new Set(allEquipment)];
        return uniqueEquipment.sort();
    },

    // Real-time subscription for room updates
    subscribe: (callback: (payload: RealtimePayload<Room>) => void): RealtimeChannel => {
        return supabase
            .channel('rooms-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rooms'
                },
                (payload) => {
                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        new: payload.new as Room,
                        old: payload.old as Room,
                        errors: payload.errors
                    });
                }
            )
            .subscribe();
    }
};

// Booking queries
export const bookingQueries = {
    // Get all bookings with relations and pagination
    getAll: async (filters?: {
        userId?: string;
        roomId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
        includeCount?: boolean;
    }) => {
        let query = supabase
            .from('bookings')
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `, { count: filters?.includeCount ? 'exact' : undefined })
            .order('start_time', { ascending: false }); // Changed to descending for recent first

        if (filters?.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters?.roomId) {
            query = query.eq('room_id', filters.roomId);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.startDate) {
            query = query.gte('start_time', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('end_time', filters.endDate);
        }
        if (filters?.limit && filters?.offset !== undefined) {
            query = query.range(filters.offset, filters.offset + filters.limit - 1);
        } else if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        if (filters?.includeCount) {
            return { data: data as BookingWithRelations[], count: count || 0 };
        }

        return data as BookingWithRelations[];
    },

    // Get bookings count for pagination
    getCount: async (filters?: {
        userId?: string;
        roomId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        let query = supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });

        if (filters?.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters?.roomId) {
            query = query.eq('room_id', filters.roomId);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.startDate) {
            query = query.gte('start_time', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('end_time', filters.endDate);
        }

        const { count, error } = await query;

        if (error) throw error;
        return count || 0;
    },

    // Get booking by ID
    getById: async (id: string) => {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as BookingWithRelations;
    },

    // Create new booking with conflict validation
    create: async (booking: BookingFormData & { user_id: string }) => {
        // First check for conflicts
        const conflicts = await bookingQueries.checkConflicts(
            booking.room_id,
            booking.start_time,
            booking.end_time
        );

        if (conflicts && conflicts.length > 0) {
            throw new Error(`Booking conflict detected. Room is already booked during this time.`);
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert({
                ...booking,
                status: 'confirmed',
                updated_at: new Date().toISOString()
            })
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `)
            .single();

        if (error) throw error;
        return data as BookingWithRelations;
    },

    // Update booking with conflict validation
    update: async (id: string, updates: Partial<Booking>) => {
        // If updating time or room, check for conflicts
        if (updates.start_time || updates.end_time || updates.room_id) {
            const currentBooking = await bookingQueries.getById(id);

            const roomId = updates.room_id || currentBooking.room_id;
            const startTime = updates.start_time || currentBooking.start_time;
            const endTime = updates.end_time || currentBooking.end_time;

            const conflicts = await bookingQueries.checkConflicts(
                roomId,
                startTime,
                endTime,
                id
            );

            if (conflicts && conflicts.length > 0) {
                throw new Error(`Booking conflict detected. Room is already booked during this time.`);
            }
        }

        const { data, error } = await supabase
            .from('bookings')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `)
            .single();

        if (error) throw error;
        return data as BookingWithRelations;
    },

    // Cancel booking
    cancel: async (id: string) => {
        const { data, error } = await supabase
            .from('bookings')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `)
            .single();

        if (error) throw error;
        return data as BookingWithRelations;
    },

    // Enhanced conflict detection
    checkConflicts: async (roomId: string, startTime: string, endTime: string, excludeBookingId?: string) => {
        let query = supabase
            .from('bookings')
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `)
            .eq('room_id', roomId)
            .eq('status', 'confirmed')
            .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

        if (excludeBookingId) {
            query = query.neq('id', excludeBookingId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as BookingWithRelations[];
    },

    // Get upcoming bookings for a user
    getUpcoming: async (userId: string, limit = 10) => {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `)
            .eq('user_id', userId)
            .eq('status', 'confirmed')
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data as BookingWithRelations[];
    },

    // Get past bookings for a user
    getPast: async (userId: string, limit = 10, offset = 0) => {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `)
            .eq('user_id', userId)
            .lt('end_time', now)
            .order('start_time', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data as BookingWithRelations[];
    },

    // Get bookings for a specific date range
    getByDateRange: async (startDate: string, endDate: string, roomId?: string) => {
        let query = supabase
            .from('bookings')
            .select(`
                *,
                room:rooms(*),
                user:users(*)
            `)
            .gte('start_time', startDate)
            .lte('end_time', endDate)
            .eq('status', 'confirmed')
            .order('start_time', { ascending: true });

        if (roomId) {
            query = query.eq('room_id', roomId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as BookingWithRelations[];
    },

    // Real-time subscription for booking updates
    subscribe: (callback: (payload: RealtimePayload<Booking>) => void, filters?: { roomId?: string; userId?: string }): RealtimeChannel => {
        let channel = supabase.channel('bookings-changes');

        if (filters?.roomId) {
            channel = channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `room_id=eq.${filters.roomId}`
                },
                (payload) => {
                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        new: payload.new as Booking,
                        old: payload.old as Booking,
                        errors: payload.errors
                    });
                }
            );
        } else if (filters?.userId) {
            channel = channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `user_id=eq.${filters.userId}`
                },
                (payload) => {
                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        new: payload.new as Booking,
                        old: payload.old as Booking,
                        errors: payload.errors
                    });
                }
            );
        } else {
            channel = channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                },
                (payload) => {
                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        new: payload.new as Booking,
                        old: payload.old as Booking,
                        errors: payload.errors
                    });
                }
            );
        }

        return channel.subscribe();
    }
};

// User queries
export const userQueries = {
    // Get all users
    getAll: async (filters?: { role?: string; department?: string; search?: string }) => {
        let query = supabase
            .from('users')
            .select('*')
            .order('full_name');

        if (filters?.role) {
            query = query.eq('role', filters.role);
        }

        if (filters?.department) {
            query = query.eq('department', filters.department);
        }

        if (filters?.search) {
            query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,department.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as User[];
    },

    // Get user by ID
    getById: async (id: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as User;
    },

    // Get user with booking statistics
    getWithStats: async (id: string) => {
        const user = await userQueries.getById(id);

        // Get booking statistics
        const { data: bookingStats, error: statsError } = await supabase
            .from('bookings')
            .select('status')
            .eq('user_id', id);

        if (statsError) throw statsError;

        const totalBookings = bookingStats?.length || 0;
        const activeBookings = bookingStats?.filter(b => b.status === 'confirmed').length || 0;
        const cancelledBookings = bookingStats?.filter(b => b.status === 'cancelled').length || 0;

        return {
            ...user,
            total_bookings: totalBookings,
            active_bookings: activeBookings,
            cancelled_bookings: cancelledBookings
        };
    },

    // Update user profile
    update: async (id: string, updates: Partial<User>) => {
        const { data, error } = await supabase
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as User;
    },

    // Create user profile (typically called after auth signup)
    create: async (user: Omit<User, 'created_at' | 'updated_at'>) => {
        const { data, error } = await supabase
            .from('users')
            .insert({
                ...user,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as User;
    },

    // Get unique departments for filtering
    getDepartments: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('department')
            .not('department', 'is', null);

        if (error) throw error;

        const uniqueDepartments = [...new Set(data?.map(user => user.department).filter(Boolean) || [])];
        return uniqueDepartments.sort();
    },

    // Get admin users
    getAdmins: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'admin')
            .order('full_name');

        if (error) throw error;
        return data as User[];
    },

    // Update user role (admin only)
    updateRole: async (id: string, role: 'staff' | 'admin') => {
        const { data, error } = await supabase
            .from('users')
            .update({
                role,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as User;
    }
};

// System settings queries
export const settingsQueries = {
    // Get system settings
    get: async () => {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) throw error;
        return data as SystemSettings;
    },

    // Update system settings
    update: async (updates: Partial<SystemSettings>) => {
        const { data, error } = await supabase
            .from('system_settings')
            .update(updates)
            .select()
            .single();

        if (error) throw error;
        return data as SystemSettings;
    }
};

// Notification queries
export const notificationQueries = {
    // Get user notifications with filtering
    getByUserId: async (userId: string, filters?: {
        limit?: number;
        offset?: number;
        type?: string;
        isRead?: boolean;
    }) => {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        if (filters?.offset) {
            query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
        }

        if (filters?.type) {
            query = query.eq('type', filters.type);
        }

        if (filters?.isRead !== undefined) {
            query = query.eq('is_read', filters.isRead);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Notification[];
    },

    // Get unread notification count
    getUnreadCount: async (userId: string) => {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    // Create notification
    create: async (notification: CreateNotificationData) => {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                ...notification,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as Notification;
    },

    // Create multiple notifications (for bulk operations)
    createBulk: async (notifications: CreateNotificationData[]) => {
        const { data, error } = await supabase
            .from('notifications')
            .insert(
                notifications.map(notification => ({
                    ...notification,
                    created_at: new Date().toISOString()
                }))
            )
            .select();

        if (error) throw error;
        return data as Notification[];
    },

    // Mark notification as read
    markAsRead: async (id: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Notification;
    },

    // Mark multiple notifications as read
    markMultipleAsRead: async (ids: string[]) => {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', ids)
            .select();

        if (error) throw error;
        return data as Notification[];
    },

    // Mark all notifications as read for user
    markAllAsRead: async (userId: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    },

    // Delete notification
    delete: async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Delete old notifications (cleanup)
    deleteOld: async (userId: string, daysOld = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)
            .lt('created_at', cutoffDate.toISOString());

        if (error) throw error;
    },

    // Get notification statistics
    getStats: async (userId: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('type, is_read')
            .eq('user_id', userId);

        if (error) throw error;

        const stats = {
            total_notifications: data?.length || 0,
            unread_notifications: data?.filter(n => !n.is_read).length || 0,
            notifications_by_type: {} as Record<string, number>
        };

        data?.forEach(notification => {
            stats.notifications_by_type[notification.type] =
                (stats.notifications_by_type[notification.type] || 0) + 1;
        });

        return stats;
    },

    // Real-time subscription for user notifications
    subscribe: (userId: string, callback: (payload: RealtimePayload<Notification>) => void): RealtimeChannel => {
        return supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    callback({
                        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        new: payload.new as Notification,
                        old: payload.old as Notification,
                        errors: payload.errors
                    });
                }
            )
            .subscribe();
    },

    // Helper function to create booking-related notifications
    createBookingNotification: async (
        userId: string,
        bookingId: string,
        roomName: string,
        type: 'booking_confirmed' | 'booking_cancelled' | 'booking_modified' | 'admin_override',
        additionalMessage?: string
    ) => {
        const messages = {
            booking_confirmed: `Your booking for ${roomName} has been confirmed.`,
            booking_cancelled: `Your booking for ${roomName} has been cancelled.`,
            booking_modified: `Your booking for ${roomName} has been modified.`,
            admin_override: `Your booking for ${roomName} has been modified by an administrator.`
        };

        const titles = {
            booking_confirmed: 'Booking Confirmed',
            booking_cancelled: 'Booking Cancelled',
            booking_modified: 'Booking Modified',
            admin_override: 'Booking Modified by Admin'
        };

        return await notificationQueries.create({
            user_id: userId,
            title: titles[type],
            message: additionalMessage || messages[type],
            type
        });
    }
};

// Analytics queries
export const analyticsQueries = {
    // Get comprehensive booking analytics
    getBookingAnalytics: async (startDate?: string, endDate?: string) => {
        const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const defaultEndDate = endDate || new Date().toISOString();

        // Get basic booking counts
        const { data: bookingCounts, error: countError } = await supabase
            .from('bookings')
            .select('status')
            .gte('created_at', defaultStartDate)
            .lte('created_at', defaultEndDate);

        if (countError) throw countError;

        // Get peak hours data
        const { data: peakHours, error: peakError } = await supabase
            .from('bookings')
            .select('start_time')
            .eq('status', 'confirmed')
            .gte('start_time', defaultStartDate)
            .lte('start_time', defaultEndDate);

        if (peakError) throw peakError;

        // Get popular rooms
        const { data: popularRooms, error: roomError } = await supabase
            .from('bookings')
            .select(`
                room_id,
                room:rooms(name)
            `)
            .eq('status', 'confirmed')
            .gte('start_time', defaultStartDate)
            .lte('start_time', defaultEndDate);

        if (roomError) throw roomError;

        // Process the data
        const totalBookings = bookingCounts?.length || 0;
        const confirmedBookings = bookingCounts?.filter(b => b.status === 'confirmed').length || 0;
        const cancelledBookings = bookingCounts?.filter(b => b.status === 'cancelled').length || 0;

        // Calculate peak hours
        const hourCounts: Record<number, number> = {};
        peakHours?.forEach(booking => {
            const hour = new Date(booking.start_time).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHoursArray = Object.entries(hourCounts)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => b.count - a.count);

        // Calculate popular rooms
        const roomCounts: Record<string, { name: string; count: number }> = {};
        popularRooms?.forEach(booking => {
            const roomId = booking.room_id;
            const roomName = booking.room?.name || 'Unknown Room';
            if (!roomCounts[roomId]) {
                roomCounts[roomId] = { name: roomName, count: 0 };
            }
            roomCounts[roomId].count++;
        });

        const popularRoomsArray = Object.entries(roomCounts)
            .map(([roomId, data]) => ({
                room_id: roomId,
                room_name: data.name,
                booking_count: data.count
            }))
            .sort((a, b) => b.booking_count - a.booking_count);

        const utilizationRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

        return {
            total_bookings: totalBookings || 0,
            confirmed_bookings: confirmedBookings || 0,
            cancelled_bookings: cancelledBookings || 0,
            utilization_rate: isNaN(utilizationRate) ? 0 : Math.round(utilizationRate * 100) / 100,
            peak_hours: peakHoursArray || [],
            popular_rooms: popularRoomsArray || []
        };
    },

    // Get room utilization with detailed metrics
    getRoomUtilization: async (roomId?: string, startDate?: string, endDate?: string) => {
        const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const defaultEndDate = endDate || new Date().toISOString();

        let query = supabase
            .from('bookings')
            .select(`
                room_id,
                start_time,
                end_time,
                room:rooms(name)
            `)
            .eq('status', 'confirmed')
            .gte('start_time', defaultStartDate)
            .lte('end_time', defaultEndDate);

        if (roomId) {
            query = query.eq('room_id', roomId);
        }

        const { data: bookings, error } = await query;

        if (error) throw error;

        // Calculate utilization per room
        const roomUtilization: Record<string, {
            room_id: string;
            room_name: string;
            total_hours_booked: number;
            booking_count: number;
        }> = {};

        bookings?.forEach(booking => {
            const roomId = booking.room_id;
            const roomName = booking.room?.name || 'Unknown Room';
            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);
            const hoursBooked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            if (!roomUtilization[roomId]) {
                roomUtilization[roomId] = {
                    room_id: roomId,
                    room_name: roomName,
                    total_hours_booked: 0,
                    booking_count: 0
                };
            }

            roomUtilization[roomId].total_hours_booked += hoursBooked;
            roomUtilization[roomId].booking_count++;
        });

        // Calculate total available hours (assuming 8 hours per day, 5 days per week)
        const startDateObj = new Date(defaultStartDate);
        const endDateObj = new Date(defaultEndDate);
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
        const workingDays = Math.floor(daysDiff * 5 / 7); // Approximate working days
        const totalAvailableHours = workingDays * 8; // 8 hours per working day

        return Object.values(roomUtilization).map(room => {
            const utilizationPercentage = totalAvailableHours > 0
                ? (room.total_hours_booked / totalAvailableHours) * 100
                : 0;

            return {
                ...room,
                total_hours_available: totalAvailableHours || 0,
                total_hours_booked: isNaN(room.total_hours_booked) ? 0 : room.total_hours_booked,
                booking_count: isNaN(room.booking_count) ? 0 : room.booking_count,
                utilization_percentage: isNaN(utilizationPercentage) ? 0 : Math.round(utilizationPercentage * 100) / 100
            };
        });
    },

    // Get booking trends over time
    getBookingTrends: async (startDate?: string, endDate?: string, granularity: 'day' | 'week' | 'month' = 'day') => {
        const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const defaultEndDate = endDate || new Date().toISOString();

        const { data, error } = await supabase
            .from('bookings')
            .select('created_at, status')
            .gte('created_at', defaultStartDate)
            .lte('created_at', defaultEndDate)
            .order('created_at');

        if (error) throw error;

        // Group bookings by time period
        const trends: Record<string, { confirmed: number; cancelled: number; total: number }> = {};

        data?.forEach(booking => {
            const date = new Date(booking.created_at);
            let key: string;

            switch (granularity) {
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            if (!trends[key]) {
                trends[key] = { confirmed: 0, cancelled: 0, total: 0 };
            }

            trends[key].total++;
            if (booking.status === 'confirmed') {
                trends[key].confirmed++;
            } else if (booking.status === 'cancelled') {
                trends[key].cancelled++;
            }
        });

        return Object.entries(trends)
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => a.date.localeCompare(b.date));
    },

    // Get department usage statistics
    getDepartmentUsage: async (startDate?: string, endDate?: string) => {
        const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const defaultEndDate = endDate || new Date().toISOString();

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                user:users(department),
                start_time,
                end_time
            `)
            .eq('status', 'confirmed')
            .gte('start_time', defaultStartDate)
            .lte('end_time', defaultEndDate);

        if (error) throw error;

        const departmentStats: Record<string, { booking_count: number; total_hours: number }> = {};

        data?.forEach(booking => {
            const department = booking.user?.department || 'Unknown';
            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);
            const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            if (!departmentStats[department]) {
                departmentStats[department] = { booking_count: 0, total_hours: 0 };
            }

            departmentStats[department].booking_count++;
            departmentStats[department].total_hours += hours;
        });

        return Object.entries(departmentStats)
            .map(([department, stats]) => ({
                department,
                booking_count: isNaN(stats.booking_count) ? 0 : stats.booking_count,
                total_hours: isNaN(stats.total_hours) ? 0 : Math.round(stats.total_hours * 100) / 100
            }))
            .sort((a, b) => b.booking_count - a.booking_count);
    }
};