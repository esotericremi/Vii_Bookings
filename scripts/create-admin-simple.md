# Create Admin User

Since we don't have the service role key setup yet, here's how to create an admin user manually:

## Option 1: Through Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" 
4. Enter:
   - Email: `admin@viibookings.com`
   - Password: `admin123!` (change this after first login)
   - Confirm password
5. After creating the user, go to Table Editor > users table
6. Find the user record and update:
   - `role`: change from `staff` to `admin`
   - `full_name`: `System Administrator`
   - `department`: `IT Administration`

## Option 2: Through SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this SQL (replace the email/password as needed):

```sql
-- First, create the auth user (you'll need to do this through the dashboard)
-- Then update the users table:

UPDATE users 
SET 
  role = 'admin',
  full_name = 'System Administrator',
  department = 'IT Administration'
WHERE email = 'admin@viibookings.com';
```

## Login Credentials

After creation:
- **Email**: admin@viibookings.com
- **Password**: admin123!
- **Role**: admin

⚠️ **Important**: Change the password after first login for security!