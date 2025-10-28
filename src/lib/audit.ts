import { supabase, getCurrentUser } from './supabase';

// Audit action types
export type AuditAction =
    | 'room_created'
    | 'room_updated'
    | 'room_deleted'
    | 'room_activated'
    | 'room_deactivated'
    | 'booking_created'
    | 'booking_updated'
    | 'booking_cancelled'
    | 'booking_admin_override'
    | 'user_role_changed'
    | 'settings_updated';

// Audit log entry interface
export interface AuditLogEntry {
    id: string;
    user_id: string;
    user_name: string;
    action: AuditAction;
    resource_type: 'room' | 'booking' | 'user' | 'settings';
    resource_id: string;
    resource_name: string;
    details: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

// Create audit log entry
export const createAuditLog = async (
    action: AuditAction,
    resourceType: 'room' | 'booking' | 'user' | 'settings',
    resourceId: string,
    resourceName: string,
    details: Record<string, any> = {},
    metadata?: {
        ip_address?: string;
        user_agent?: string;
    }
): Promise<void> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('Cannot create audit log: No authenticated user');
            return;
        }

        // Get user profile for name
        const { data: userProfile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single();

        const auditEntry = {
            user_id: user.id,
            user_name: userProfile?.full_name || user.email || 'Unknown User',
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            resource_name: resourceName,
            details,
            ip_address: metadata?.ip_address,
            user_agent: metadata?.user_agent,
            created_at: new Date().toISOString(),
        };

        // In a real implementation, you would store this in an audit_logs table
        // For now, we'll log to console and could store in local storage or send to an external service
        console.log('Audit Log Entry:', auditEntry);

        // You could also store in localStorage for development/demo purposes
        const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        existingLogs.unshift({ ...auditEntry, id: crypto.randomUUID() });

        // Keep only the last 1000 entries
        if (existingLogs.length > 1000) {
            existingLogs.splice(1000);
        }

        localStorage.setItem('audit_logs', JSON.stringify(existingLogs));

    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to avoid breaking the main operation
    }
};

// Get audit logs (from localStorage for demo purposes)
export const getAuditLogs = (filters?: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): AuditLogEntry[] => {
    try {
        const logs: AuditLogEntry[] = JSON.parse(localStorage.getItem('audit_logs') || '[]');

        let filteredLogs = logs;

        if (filters?.userId) {
            filteredLogs = filteredLogs.filter(log => log.user_id === filters.userId);
        }

        if (filters?.action) {
            filteredLogs = filteredLogs.filter(log => log.action === filters.action);
        }

        if (filters?.resourceType) {
            filteredLogs = filteredLogs.filter(log => log.resource_type === filters.resourceType);
        }

        if (filters?.resourceId) {
            filteredLogs = filteredLogs.filter(log => log.resource_id === filters.resourceId);
        }

        if (filters?.startDate) {
            filteredLogs = filteredLogs.filter(log => log.created_at >= filters.startDate!);
        }

        if (filters?.endDate) {
            filteredLogs = filteredLogs.filter(log => log.created_at <= filters.endDate!);
        }

        if (filters?.limit) {
            filteredLogs = filteredLogs.slice(0, filters.limit);
        }

        return filteredLogs;
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return [];
    }
};

// Helper functions for specific audit actions
export const auditRoomCreated = (roomId: string, roomName: string, roomData: any) => {
    return createAuditLog('room_created', 'room', roomId, roomName, {
        capacity: roomData.capacity,
        location: roomData.location,
        floor: roomData.floor,
        equipment: roomData.equipment,
    });
};

export const auditRoomUpdated = (roomId: string, roomName: string, changes: any) => {
    return createAuditLog('room_updated', 'room', roomId, roomName, {
        changes,
    });
};

export const auditRoomDeleted = (roomId: string, roomName: string, roomData: any) => {
    return createAuditLog('room_deleted', 'room', roomId, roomName, {
        capacity: roomData.capacity,
        location: roomData.location,
        floor: roomData.floor,
        had_future_bookings: roomData.had_future_bookings || false,
    });
};

export const auditRoomStatusChanged = (roomId: string, roomName: string, isActive: boolean) => {
    return createAuditLog(
        isActive ? 'room_activated' : 'room_deactivated',
        'room',
        roomId,
        roomName,
        { is_active: isActive }
    );
};

export const auditBookingCreated = (bookingId: string, bookingTitle: string, bookingData: any) => {
    return createAuditLog('booking_created', 'booking', bookingId, bookingTitle, {
        room_id: bookingData.room_id,
        room_name: bookingData.room_name,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
    });
};

export const auditBookingUpdated = (bookingId: string, bookingTitle: string, changes: any) => {
    return createAuditLog('booking_updated', 'booking', bookingId, bookingTitle, {
        changes,
    });
};

export const auditBookingCancelled = (bookingId: string, bookingTitle: string, reason?: string) => {
    return createAuditLog('booking_cancelled', 'booking', bookingId, bookingTitle, {
        reason,
    });
};

export const auditBookingAdminOverride = (bookingId: string, bookingTitle: string, overrideReason: string) => {
    return createAuditLog('booking_admin_override', 'booking', bookingId, bookingTitle, {
        override_reason: overrideReason,
    });
};

// Format audit action for display
export const formatAuditAction = (action: AuditAction): string => {
    const actionMap: Record<AuditAction, string> = {
        room_created: 'Created Room',
        room_updated: 'Updated Room',
        room_deleted: 'Deleted Room',
        room_activated: 'Activated Room',
        room_deactivated: 'Deactivated Room',
        booking_created: 'Created Booking',
        booking_updated: 'Updated Booking',
        booking_cancelled: 'Cancelled Booking',
        booking_admin_override: 'Admin Override',
        user_role_changed: 'Changed User Role',
        settings_updated: 'Updated Settings',
    };

    return actionMap[action] || action;
};

// Get action color for UI display
export const getAuditActionColor = (action: AuditAction): string => {
    const colorMap: Record<AuditAction, string> = {
        room_created: 'text-green-600',
        room_updated: 'text-blue-600',
        room_deleted: 'text-red-600',
        room_activated: 'text-green-600',
        room_deactivated: 'text-orange-600',
        booking_created: 'text-green-600',
        booking_updated: 'text-blue-600',
        booking_cancelled: 'text-red-600',
        booking_admin_override: 'text-purple-600',
        user_role_changed: 'text-indigo-600',
        settings_updated: 'text-gray-600',
    };

    return colorMap[action] || 'text-gray-600';
};