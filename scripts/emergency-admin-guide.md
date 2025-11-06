# Emergency Admin Mode Guide

## Quick Fix for Database Connection Issues

If you're experiencing persistent database timeouts and losing your admin role, you can use the **Emergency Admin Mode** as a temporary solution.

## How to Use Emergency Admin Mode

### Option 1: Using the Debug Component (Recommended)
1. Go to your Dashboard
2. Look for the orange "Admin Role Debug Info" card at the top
3. Click the **"Emergency Admin"** button
4. The page will reload and you'll have admin access

### Option 2: Using Browser Console
```javascript
// Enable emergency admin mode
window.authDebug.enableEmergencyAdminMode('your-user-id', 'your-email@example.com');
location.reload();

// Disable emergency admin mode
window.authDebug.disableEmergencyAdminMode('your-user-id');
location.reload();
```

## What Emergency Mode Does

- **Creates a local admin profile** that bypasses database calls
- **Gives you immediate admin access** even when the database is unreachable
- **Shows a red "🚨 EMERGENCY" badge** to indicate you're in emergency mode
- **Works completely offline** - no database connection needed

## When to Use Emergency Mode

✅ **Use when:**
- Database connections are timing out consistently
- You need immediate admin access to fix system issues
- Network connectivity to Supabase is poor
- You're troubleshooting authentication problems

❌ **Don't use when:**
- Database is working normally
- You're not experiencing connection issues
- For permanent admin access (fix the database instead)

## How to Exit Emergency Mode

1. Click **"Disable Emergency"** in the debug component, OR
2. Use the browser console command above, OR
3. Clear your browser's localStorage

## Important Notes

- **Emergency mode is temporary** - it only affects your local browser
- **Data is stored locally** - clearing browser data will remove it
- **Other users are not affected** - this only impacts your session
- **Database writes still require connection** - you can view admin features but may not be able to save changes

## Troubleshooting the Root Cause

While in emergency mode, you can:

1. **Check system status** in the Management tab
2. **Verify database connectivity** using the debug tools
3. **Monitor connection health** in the browser console
4. **Contact your Supabase provider** if issues persist

## Normal Operation Recovery

Once your database connection is restored:

1. **Disable emergency mode**
2. **Clear your auth cache** using the "Clear Cache" button
3. **Refresh the page** to load your real profile from the database
4. **Verify normal operation** by checking the debug component shows a green status

## Prevention

The updated system now includes:
- **Aggressive caching** - profiles are cached for 30 minutes
- **Background refresh** - cache updates happen in the background
- **Connection health monitoring** - automatic fallback to cache when database is unreachable
- **Faster timeouts** - 5-second timeouts instead of 12 seconds for quicker fallback

This should prevent most admin role loss issues in the future.