import { supabase } from '@/lib/supabase';
import { RealtimeService } from '@/lib/realtimeService';

export const runHealthCheck = async () => {
    console.log('🔍 Running VII Bookings Health Check...');

    const results = {
        supabase: false,
        auth: false,
        database: false,
        realtime: false,
        errors: [] as string[]
    };

    try {
        // Test Supabase connection
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('rooms').select('count').limit(1);
        if (error) {
            results.errors.push(`Supabase connection failed: ${error.message}`);
        } else {
            results.supabase = true;
            results.database = true;
            console.log('✅ Supabase connection successful');
        }
    } catch (error) {
        results.errors.push(`Supabase connection error: ${error}`);
        console.error('❌ Supabase connection failed:', error);
    }

    try {
        // Test Auth
        console.log('Testing authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            results.errors.push(`Auth check failed: ${error.message}`);
        } else {
            results.auth = !!session;
            console.log(session ? '✅ User authenticated' : '⚠️ No active session');
        }
    } catch (error) {
        results.errors.push(`Auth error: ${error}`);
        console.error('❌ Auth check failed:', error);
    }

    try {
        // Test Realtime
        console.log('Testing realtime connection...');
        const realtimeStatus = RealtimeService.getConnectionStatus();
        const healthCheck = RealtimeService.performHealthCheck();

        results.realtime = realtimeStatus === 'connected';
        console.log(`Realtime status: ${realtimeStatus}`);
        console.log('Realtime health:', healthCheck);

        if (realtimeStatus !== 'connected') {
            results.errors.push(`Realtime not connected: ${realtimeStatus}`);
        } else {
            console.log('✅ Realtime connection active');
        }
    } catch (error) {
        results.errors.push(`Realtime error: ${error}`);
        console.error('❌ Realtime check failed:', error);
    }

    // Summary
    console.log('\n📊 Health Check Summary:');
    console.log(`Supabase: ${results.supabase ? '✅' : '❌'}`);
    console.log(`Auth: ${results.auth ? '✅' : '⚠️'}`);
    console.log(`Database: ${results.database ? '✅' : '❌'}`);
    console.log(`Realtime: ${results.realtime ? '✅' : '⚠️'}`);

    if (results.errors.length > 0) {
        console.log('\n❌ Errors found:');
        results.errors.forEach(error => console.log(`  - ${error}`));
    } else {
        console.log('\n🎉 All systems operational!');
    }

    return results;
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).runVIIBookingsHealthCheck = runHealthCheck;
}