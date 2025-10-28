import { supabase } from '@/lib/supabase';

/**
 * Utility functions to check Supabase configuration and setup
 */

export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.error('Supabase connection error:', error);
            return { success: false, error: error.message };
        }
        return { success: true, message: 'Supabase connection successful' };
    } catch (error) {
        console.error('Supabase connection error:', error);
        return { success: false, error: 'Failed to connect to Supabase' };
    }
};

export const checkRequiredTables = async () => {
    const requiredTables = ['users', 'rooms', 'bookings', 'system_settings', 'notifications'];
    const results: Record<string, boolean> = {};

    for (const table of requiredTables) {
        try {
            const { error } = await supabase.from(table).select('*').limit(1);
            results[table] = !error;
            if (error) {
                console.error(`Table ${table} check failed:`, error);
            }
        } catch (error) {
            console.error(`Table ${table} check failed:`, error);
            results[table] = false;
        }
    }

    return results;
};

export const checkEmailConfirmationStatus = async (email: string, password: string) => {
    try {
        // Try to sign up with a test email
        const testEmail = `test-${Date.now()}@example.com`;
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: 'testpassword123',
        });

        if (error) {
            return {
                success: false,
                error: error.message,
                emailConfirmationRequired: null
            };
        }

        // If we get a session immediately, email confirmation is disabled
        const emailConfirmationRequired = !data.session && !!data.user;

        // Clean up the test user
        if (data.user) {
            await supabase.auth.admin.deleteUser(data.user.id);
        }

        return {
            success: true,
            emailConfirmationRequired,
            message: emailConfirmationRequired
                ? 'Email confirmation is ENABLED - users must verify their email before signing in'
                : 'Email confirmation is DISABLED - users can sign in immediately after registration'
        };
    } catch (error) {
        console.error('Email confirmation check failed:', error);
        return {
            success: false,
            error: 'Failed to check email confirmation status',
            emailConfirmationRequired: null
        };
    }
};

export const runSupabaseHealthCheck = async () => {
    console.log('🔍 Running Supabase Health Check...\n');

    // Check connection
    console.log('1. Checking Supabase connection...');
    const connectionResult = await checkSupabaseConnection();
    console.log(connectionResult.success ? '✅ Connected' : `❌ ${connectionResult.error}`);

    // Check tables
    console.log('\n2. Checking required tables...');
    const tablesResult = await checkRequiredTables();
    Object.entries(tablesResult).forEach(([table, exists]) => {
        console.log(`${exists ? '✅' : '❌'} ${table}`);
    });

    // Check if all tables exist
    const allTablesExist = Object.values(tablesResult).every(exists => exists);

    if (!allTablesExist) {
        console.log('\n⚠️  Some tables are missing. Please run the SQL setup script from SUPABASE_SETUP.md');
    }

    // Summary
    console.log('\n📋 Summary:');
    console.log(`Connection: ${connectionResult.success ? 'OK' : 'FAILED'}`);
    console.log(`Tables: ${allTablesExist ? 'OK' : 'MISSING'}`);

    if (connectionResult.success && allTablesExist) {
        console.log('\n🎉 Supabase setup looks good!');
        console.log('\n💡 If you\'re having login issues after registration:');
        console.log('   1. Go to Supabase Dashboard → Authentication → Settings');
        console.log('   2. Uncheck "Enable email confirmations"');
        console.log('   3. Click Save');
    } else {
        console.log('\n🔧 Please fix the issues above before proceeding.');
    }

    return {
        connection: connectionResult.success,
        tables: allTablesExist,
        overall: connectionResult.success && allTablesExist
    };
};

// Helper function to run the health check from browser console
if (typeof window !== 'undefined') {
    (window as any).runSupabaseHealthCheck = runSupabaseHealthCheck;
    console.log('💡 Run runSupabaseHealthCheck() in the browser console to check your Supabase setup');
}