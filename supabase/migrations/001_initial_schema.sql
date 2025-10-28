-- Meeting Room Booking System - Initial Schema Migration
-- This migration creates all the necessary tables, constraints, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location TEXT NOT NULL,
  floor TEXT NOT NULL,
  equipment TEXT[] DEFAULT '{}',
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending')),
  is_admin_override BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT no_past_bookings CHECK (start_time > NOW() - INTERVAL '1 hour')
);

-- System settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  max_booking_duration INTEGER DEFAULT 480 CHECK (max_booking_duration > 0), -- 8 hours in minutes
  advance_notice_hours INTEGER DEFAULT 0 CHECK (advance_notice_hours >= 0),
  buffer_time_minutes INTEGER DEFAULT 0 CHECK (buffer_time_minutes >= 0),
  company_name TEXT DEFAULT 'Company' NOT NULL,
  company_logo_url TEXT,
  theme_color TEXT DEFAULT '#3b82f6' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmed', 'booking_cancelled', 'booking_modified', 'admin_override', 'system_error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON public.bookings(room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON public.bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON public.rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_capacity ON public.rooms(capacity);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Create exclusion constraint to prevent overlapping bookings
-- Note: This requires btree_gist extension
DO $$ 
BEGIN
  -- Try to create the exclusion constraint with range types
  BEGIN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT no_overlapping_bookings 
    EXCLUDE USING gist (
      room_id WITH =, 
      tsrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status = 'confirmed');
  EXCEPTION 
    WHEN others THEN
      -- Fallback: Create a regular index if range types are not available
      CREATE INDEX IF NOT EXISTS idx_bookings_overlap_check 
      ON public.bookings(room_id, start_time, end_time)
      WHERE status = 'confirmed';
  END;
END $$;

-- Insert default system settings
INSERT INTO public.system_settings (
  max_booking_duration,
  advance_notice_hours,
  buffer_time_minutes,
  company_name,
  theme_color
) VALUES (
  480, -- 8 hours
  0,   -- No advance notice required
  0,   -- No buffer time
  'Meeting Room Booking System',
  '#3b82f6'
) ON CONFLICT DO NOTHING;