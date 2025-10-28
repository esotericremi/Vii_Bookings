-- Meeting Room Booking System - Real-time Triggers and Notifications
-- This migration sets up triggers for automatic notifications and real-time updates

-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Function to send booking confirmation notification
CREATE OR REPLACE FUNCTION public.notify_booking_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for booking confirmation
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Booking Confirmed',
    'Your booking for ' || (SELECT name FROM public.rooms WHERE id = NEW.room_id) || 
    ' on ' || to_char(NEW.start_time, 'Mon DD, YYYY at HH12:MI AM') || ' has been confirmed.',
    'booking_confirmed'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send booking cancellation notification
CREATE OR REPLACE FUNCTION public.notify_booking_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Booking Cancelled',
      'Your booking for ' || (SELECT name FROM public.rooms WHERE id = NEW.room_id) || 
      ' on ' || to_char(NEW.start_time, 'Mon DD, YYYY at HH12:MI AM') || ' has been cancelled.',
      'booking_cancelled'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send booking modification notification
CREATE OR REPLACE FUNCTION public.notify_booking_modified()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if booking details changed (not just status)
  IF (OLD.start_time != NEW.start_time OR 
      OLD.end_time != NEW.end_time OR 
      OLD.room_id != NEW.room_id OR
      OLD.title != NEW.title) AND 
      NEW.status = 'confirmed' THEN
    
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Booking Modified',
      'Your booking has been updated. New details: ' || 
      (SELECT name FROM public.rooms WHERE id = NEW.room_id) || 
      ' on ' || to_char(NEW.start_time, 'Mon DD, YYYY at HH12:MI AM'),
      'booking_modified'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send admin override notification
CREATE OR REPLACE FUNCTION public.notify_admin_override()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify if admin override flag is set
  IF NEW.is_admin_override = true AND (OLD.is_admin_override IS NULL OR OLD.is_admin_override = false) THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Admin Override Applied',
      'An administrator has modified your booking for ' || 
      (SELECT name FROM public.rooms WHERE id = NEW.room_id) || 
      ' on ' || to_char(NEW.start_time, 'Mon DD, YYYY at HH12:MI AM'),
      'admin_override'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for booking notifications
CREATE TRIGGER trigger_booking_confirmed
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.notify_booking_confirmed();

CREATE TRIGGER trigger_booking_cancelled
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_cancelled();

CREATE TRIGGER trigger_booking_modified
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_modified();

CREATE TRIGGER trigger_admin_override
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_override();

-- Function to validate booking conflicts before insert/update
CREATE OR REPLACE FUNCTION public.validate_booking_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for conflicts only for confirmed bookings
  IF NEW.status = 'confirmed' THEN
    SELECT COUNT(*)
    INTO conflict_count
    FROM public.bookings
    WHERE 
      room_id = NEW.room_id
      AND status = 'confirmed'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (
        (start_time < NEW.end_time AND end_time > NEW.start_time)
      );
    
    -- Raise exception if conflicts found and not admin override
    IF conflict_count > 0 AND NOT COALESCE(NEW.is_admin_override, false) THEN
      RAISE EXCEPTION 'Booking conflict detected. Room is already booked for the selected time slot.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conflict validation
CREATE TRIGGER trigger_validate_booking_conflicts
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_conflicts();

-- Function to clean up old notifications (keep last 100 per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE id IN (
    SELECT id
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM public.notifications
    ) ranked
    WHERE rn > 100
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to be called by cron for cleanup (if pg_cron is available)
-- This would typically be set up separately in the Supabase dashboard
COMMENT ON FUNCTION public.cleanup_old_notifications() IS 
'Function to clean up old notifications. Should be called periodically via cron job.';