# Authentication Setup

This document describes the Supabase authentication integration for the Meeting Room Booking System.

## Environment Configuration

1. Copy `.env.example` to `.env`
2. Update the following environment variables with your Supabase project details:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Setup

The authentication system expects the following database tables to be created in your Supabase project:

### Users Table
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security
Enable RLS and create policies:
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
```

## Features Implemented

### Authentication Context
- `AuthProvider`: Provides authentication state throughout the app
- `useAuth`: Hook to access authentication state and methods
- Automatic session management and token refresh
- User profile integration

### Protected Routes
- `ProtectedRoute`: Component to protect routes requiring authentication
- Admin role checking for admin-only routes
- Automatic redirect to login for unauthenticated users

### Authentication Pages
- **Login**: Email/password authentication with error handling
- **Register**: User registration with profile creation
- **Unauthorized**: Access denied page for insufficient permissions

### User Profile Component
- Dropdown menu with user information
- Role and department badges
- Sign out functionality

## Usage

### Protecting Routes
```tsx
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### Using Authentication State
```tsx
const { user, userProfile, signIn, signOut, loading } = useAuth();
```

### Checking User Permissions
```tsx
import { authHelpers } from '@/lib/auth';

const isAdmin = await authHelpers.isAdmin();
const userRole = await authHelpers.getUserRole();
```

## Next Steps

1. Set up your Supabase project and configure the environment variables
2. Run the database migrations to create the required tables
3. Configure email templates in Supabase for user registration
4. Set up Row Level Security policies for other tables (rooms, bookings, etc.)