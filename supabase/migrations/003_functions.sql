-- Meeting Room Booking System - Database Functions
-- This migration creates utility functions for booking management and conflict detection

-- Function to check for booking conflicts
CREATE OR REPLACE FUNCTION public.check_booking_conflicts(
  p_room_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE(
  booking_id UUID,
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.start_time,
    b.end_time,
    u.email
  FROM public.bookings b
  JOIN public.users u ON b.user_id = u.id
  WHERE 
    b.room_id = p_room_id
    AND b.status = 'confirmed'
    AND (
      (b.start_time < p_end_time AND b.end_time > p_start_time)
    )
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get room availability for a specific date
CREATE OR REPLACE FUNCTION public.get_room_availability(
  p_room_id UUID,
  p_date DATE
)
RETURNS TABLE(
  room_id UUID,
  room_name TEXT,
  is_available BOOLEAN,
  next_available_time TIMESTAMP WITH TIME ZONE,
  current_booking_id UUID,
  current_booking_title TEXT,
  current_booking_end_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  day_start TIMESTAMP WITH TIME ZONE := p_date::TIMESTAMP WITH TIME ZONE;
  day_end TIMESTAMP WITH TIME ZONE := (p_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
BEGIN
  RETURN QUERY
  WITH current_booking AS (
    SELECT 
      b.id,
      b.title,
      b.end_time
    FROM public.bookings b
    WHERE 
      b.room_id = p_room_id
      AND b.status = 'confirmed'
      AND b.start_time <= current_time
      AND b.end_time > current_time
    LIMIT 1
  ),
  next_booking AS (
    SELECT 
      MIN(b.start_time) as next_start
    FROM public.bookings b
    WHERE 
      b.room_id = p_room_id
      AND b.status = 'confirmed'
      AND b.start_time > current_time
      AND b.start_time >= day_start
      AND b.start_time < day_end
  )
  SELECT 
    r.id,
    r.name,
    (cb.id IS NULL) as is_available,
    COALESCE(cb.end_time, nb.next_start) as next_available_time,
    cb.id as current_booking_id,
    cb.title as current_booking_title,
    cb.end_time as current_booking_end_time
  FROM public.rooms r
  LEFT JOIN current_booking cb ON true
  LEFT JOIN next_booking nb ON true
  WHERE r.id = p_room_id AND r.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate room utilization
CREATE OR REPLACE FUNCTION public.calculate_room_utilization(
  p_room_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  room_id UUID,
  room_name TEXT,
  total_bookings BIGINT,
  total_hours_booked NUMERIC,
  total_hours_available NUMERIC,
  utilization_percentage NUMERIC
) AS $$
DECLARE
  total_days INTEGER := (p_end_date - p_start_date) + 1;
  hours_per_day INTEGER := 12; -- Assuming 8 AM to 8 PM availability
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    COALESCE(stats.booking_count, 0) as total_bookings,
    COALESCE(stats.hours_booked, 0) as total_hours_booked,
    (total_days * hours_per_day)::NUMERIC as total_hours_available,
    CASE 
      WHEN total_days * hours_per_day > 0 
      THEN ROUND((COALESCE(stats.hours_booked, 0) / (total_days * hours_per_day)) * 100, 2)
      ELSE 0
    END as utilization_percentage
  FROM public.rooms r
  LEFT JOIN (
    SELECT 
      b.room_id,
      COUNT(*) as booking_count,
      SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600) as hours_booked
    FROM public.bookings b
    WHERE 
      b.status = 'confirmed'
      AND b.start_time::DATE >= p_start_date
      AND b.start_time::DATE <= p_end_date
      AND (p_room_id IS NULL OR b.room_id = p_room_id)
    GROUP BY b.room_id
  ) stats ON r.id = stats.room_id
  WHERE 
    r.is_active = true
    AND (p_room_id IS NULL OR r.id = p_room_id)
  ORDER BY utilization_percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get booking analytics
CREATE OR REPLACE FUNCTION public.get_booking_analytics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  pending_bookings BIGINT,
  peak_hour INTEGER,
  peak_hour_count BIGINT,
  most_popular_room_id UUID,
  most_popular_room_name TEXT,
  most_popular_room_bookings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH booking_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
      COUNT(*) FILTER (WHERE status = 'pending') as pending
    FROM public.bookings
    WHERE 
      created_at::DATE >= p_start_date
      AND created_at::DATE <= p_end_date
  ),
  peak_hours AS (
    SELECT 
      EXTRACT(HOUR FROM start_time) as hour,
      COUNT(*) as count
    FROM public.bookings
    WHERE 
      status = 'confirmed'
      AND start_time::DATE >= p_start_date
      AND start_time::DATE <= p_end_date
    GROUP BY EXTRACT(HOUR FROM start_time)
    ORDER BY count DESC
    LIMIT 1
  ),
  popular_rooms AS (
    SELECT 
      b.room_id,
      r.name,
      COUNT(*) as booking_count
    FROM public.bookings b
    JOIN public.rooms r ON b.room_id = r.id
    WHERE 
      b.status = 'confirmed'
      AND b.start_time::DATE >= p_start_date
      AND b.start_time::DATE <= p_end_date
    GROUP BY b.room_id, r.name
    ORDER BY booking_count DESC
    LIMIT 1
  )
  SELECT 
    bs.total,
    bs.confirmed,
    bs.cancelled,
    bs.pending,
    ph.hour::INTEGER,
    ph.count,
    pr.room_id,
    pr.name,
    pr.booking_count
  FROM booking_stats bs
  CROSS JOIN peak_hours ph
  CROSS JOIN popular_rooms pr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at 
  BEFORE UPDATE ON public.rooms 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON public.bookings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON public.system_settings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();