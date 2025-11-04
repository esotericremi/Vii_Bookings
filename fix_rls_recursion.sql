-- Fix infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor to fix the circular reference issue

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;

-- Create a security definer function to check admin role
-- This avoids the circular reference by using a function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policies using the security definer function
CREATE POLICY "Admins can manage all users" 
ON public.users FOR ALL 
USING (public.is_admin());

CREATE POLICY "Admins can manage rooms" 
ON public.rooms FOR ALL 
USING (public.is_admin());

CREATE POLICY "Admins can manage all bookings" 
ON public.bookings FOR ALL 
USING (public.is_admin());

CREATE POLICY "Admins can manage system settings" 
ON public.system_settings FOR ALL 
USING (public.is_admin());

CREATE POLICY "Admins can view all notifications" 
ON public.notifications FOR SELECT 
USING (public.is_admin());

-- Also fix the rooms policy that has a similar issue
DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.rooms;

CREATE POLICY "Anyone can view active rooms" 
ON public.rooms FOR SELECT 
USING (is_active = true OR public.is_admin());

-- Fix bookings policy with similar issue
DROP POLICY IF EXISTS "Users can view all confirmed bookings" ON public.bookings;

CREATE POLICY "Users can view all confirmed bookings" 
ON public.bookings FOR SELECT 
USING (
  status = 'confirmed' 
  OR auth.uid() = user_id 
  OR public.is_admin()
);