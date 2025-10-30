import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables:');
    console.error('- VITE_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminUser() {
    const adminEmail = 'admin@viibookings.com';
    const adminPassword = 'admin123!'; // Change this to a secure password
    const adminName = 'System Administrator';

    try {
        console.log('Creating admin user...');

        // First check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(user => user.email === adminEmail);

        let authData;
        if (existingUser) {
            console.log('User already exists, using existing user:', existingUser.id);
            authData = { user: existingUser };
        } else {
            // Create the user in Supabase Auth
            const { data: newAuthData, error: authError } = await supabase.auth.admin.createUser({
                email: adminEmail,
                password: adminPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: adminName
                }
            });

            if (authError) {
                console.error('Error creating auth user:', authError);
                return;
            }

            console.log('Auth user created:', newAuthData.user.id);
            authData = newAuthData;
        }

        // Create or update the user profile in the users table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                email: adminEmail,
                full_name: adminName,
                role: 'admin',
                department: 'IT Administration'
            })
            .select()
            .single();

        if (profileError) {
            console.error('Error creating/updating user profile:', profileError);
            return;
        }

        console.log('User profile created/updated:', profileData);

        console.log('\n✅ Admin user created successfully!');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('⚠️  Please change the password after first login!');

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// Run the script
createAdminUser();