-- Manual Admin User Creation SQL Script
-- Run this in your Supabase SQL Editor after creating the user through the Auth UI

-- Step 1: First create the user through Supabase Dashboard > Authentication > Users
-- Email: admin@viibookings.com
-- Password: admin123!

-- Step 2: Then run this SQL to update their profile to admin role
-- Replace 'admin@viibookings.com' with the actual email if different

UPDATE users 
SET 
  role = 'admin',
  full_name = 'System Administrator',
  department = 'IT Administration',
  updated_at = NOW()
WHERE email = 'admin@viibookings.com';

-- Verify the update worked
SELECT id, email, full_name, role, department, created_at, updated_at 
FROM users 
WHERE email = 'admin@viibookings.com';

-- If no rows are returned, you may need to insert the profile manually:
-- (Only run this if the SELECT above returns no results)

/*
INSERT INTO users (id, email, full_name, role, department)
SELECT 
  auth.users.id,
  'admin@viibookings.com',
  'System Administrator',
  'admin',
  'IT Administration'
FROM auth.users 
WHERE auth.users.email = 'admin@viibookings.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'System Administrator',
  department = 'IT Administration',
  updated_at = NOW();
*/