-- Performance optimization indexes for meeting room booking system
-- This migration adds indexes to improve query performance

-- Bookings table indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_time ON public.bookings(user_id, status, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_room_status_time ON public.bookings(room_id, status, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status_time ON public.bookings(status, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON public.bookings(start_time, end_time);

-- Composite index for conflict detection queries
CREATE INDEX IF NOT EXISTS idx_bookings_conflict_detection ON public.bookings(room_id, status, start_time, end_time) 
WHERE status = 'confirmed';

-- Rooms table indexes
CREATE INDEX IF NOT EXISTS idx_rooms_active_name ON public.rooms(is_active, name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rooms_location_floor ON public.rooms(location, floor) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rooms_capacity ON public.rooms(capacity) WHERE is_active = true;

-- Equipment search optimization (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_rooms_equipment_gin ON public.rooms USING GIN(equipment) WHERE is_active = true;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON public.notifications(type, created_at DESC);

-- Partial index for unread notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- System settings doesn't need additional indexes as it's a single-row table

-- Add comments for documentation
COMMENT ON INDEX idx_bookings_user_status_time IS 'Optimizes user booking queries with status filtering';
COMMENT ON INDEX idx_bookings_room_status_time IS 'Optimizes room availability queries';
COMMENT ON INDEX idx_bookings_conflict_detection IS 'Optimizes booking conflict detection queries';
COMMENT ON INDEX idx_rooms_equipment_gin IS 'Optimizes equipment-based room searches using GIN index';
COMMENT ON INDEX idx_notifications_unread IS 'Optimizes unread notification count queries';

-- Analyze tables to update statistics for query planner
ANALYZE public.bookings;
ANALYZE public.rooms;
ANALYZE public.users;
ANALYZE public.notifications;