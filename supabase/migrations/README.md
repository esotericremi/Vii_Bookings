# Database Migrations

This directory contains SQL migration files for the Meeting Room Booking System. These migrations should be run in order to set up the complete database schema.

## Migration Files

### 001_initial_schema.sql
- Creates all core tables (users, rooms, bookings, system_settings, notifications)
- Sets up proper constraints, indexes, and foreign key relationships
- Includes performance optimizations and data integrity checks
- Inserts default system settings

### 002_rls_policies.sql
- Enables Row Level Security (RLS) on all tables
- Creates comprehensive security policies for data access control
- Sets up role-based permissions (staff vs admin)
- Includes automatic user profile creation trigger

### 003_functions.sql
- Creates utility functions for booking management
- Implements conflict detection and room availability checking
- Adds analytics and reporting functions
- Sets up automatic timestamp updates

### 004_realtime_triggers.sql
- Enables real-time subscriptions for live updates
- Creates notification triggers for booking events
- Implements automatic notification creation
- Adds booking conflict validation

## Running Migrations

### Using Supabase CLI

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project (if not already done):
   ```bash
   supabase init
   ```

3. Link to your Supabase project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Run the migrations:
   ```bash
   supabase db push
   ```

### Manual Execution

If you prefer to run migrations manually:

1. Connect to your Supabase database using the SQL editor in the dashboard
2. Execute each migration file in order (001, 002, 003, 004)
3. Verify that all tables, functions, and policies are created successfully

## Verification

After running all migrations, verify the setup by checking:

1. **Tables**: Ensure all 5 tables are created (users, rooms, bookings, system_settings, notifications)
2. **Indexes**: Verify performance indexes are in place
3. **RLS Policies**: Check that Row Level Security is enabled and policies are active
4. **Functions**: Test utility functions work correctly
5. **Triggers**: Verify that notification triggers fire on booking events

## Environment Variables

Make sure your application has the following environment variables set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Default Data

The migrations include:
- Default system settings with reasonable defaults
- Proper constraints to ensure data integrity
- Indexes for optimal query performance

## Security Notes

- All tables have Row Level Security enabled
- Users can only access their own data unless they have admin role
- Admin users have full access to manage all resources
- Automatic user profile creation on signup
- Secure functions with SECURITY DEFINER where appropriate

## Troubleshooting

If you encounter issues:

1. Check that you have the necessary permissions on your Supabase project
2. Ensure the migrations are run in the correct order
3. Verify that the `uuid-ossp` extension is available
4. Check the Supabase logs for any error messages

For more information, refer to the [Supabase documentation](https://supabase.com/docs).