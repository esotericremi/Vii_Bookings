import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

export const AdminSetup: React.FC = () => {
    const { user, userProfile } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [formData, setFormData] = useState({
        full_name: 'System Administrator',
        role: 'admin' as 'admin' | 'staff',
        department: 'IT'
    });

    const createUserProfile = async () => {
        if (!user?.id) {
            setMessage({ type: 'error', text: 'No user ID found' });
            return;
        }

        setIsCreating(true);
        setMessage({ type: 'success', text: 'Creating admin profile...' });

        try {
            // Add timeout protection
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Profile creation timeout after 15 seconds')), 15000);
            });

            // Create new user profile directly (skip existence check to avoid double timeout)
            const insertPromise = supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email!,
                    full_name: formData.full_name,
                    role: formData.role,
                    department: formData.department,
                })
                .select()
                .single();

            const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

            if (error) {
                console.error('Error creating user profile:', error);
                if (error.code === '23505') {
                    setMessage({ type: 'error', text: 'Profile already exists but not loading. Try refreshing the page or check Supabase dashboard.' });
                } else {
                    setMessage({ type: 'error', text: `Failed to create profile: ${error.message}` });
                }
            } else {
                setMessage({ type: 'success', text: 'Admin profile created successfully! Please refresh the page.' });
                console.log('Created user profile:', data);
            }
        } catch (error: any) {
            console.error('Profile creation error:', error);
            setMessage({ type: 'error', text: `Profile creation failed: ${error.message}` });
        } finally {
            setIsCreating(false);
        }
    };

    const checkDatabase = async () => {
        setMessage({ type: 'success', text: 'Testing database connection...' });

        try {
            // Add timeout protection
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000);
            });

            // Test basic database connection and look for users
            const queryPromise = supabase
                .from('users')
                .select('id, email, full_name, role')
                .limit(10);

            const { data: allUsers, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

            if (error) {
                console.error('Database query error:', error);
                setMessage({ type: 'error', text: `Database connection failed: ${error.message}` });
            } else {
                console.log('All users in database:', allUsers);

                // Look for current user by email
                const currentUserByEmail = allUsers?.find((u: any) => u.email === user?.email);

                if (currentUserByEmail) {
                    setMessage({
                        type: 'success',
                        text: `Found user by email! DB ID: ${currentUserByEmail.id}, Auth ID: ${user?.id}. ${currentUserByEmail.id === user?.id ? 'IDs match!' : 'ID MISMATCH!'}`
                    });
                } else {
                    setMessage({
                        type: 'error',
                        text: `User with email ${user?.email} not found in database. Found ${allUsers?.length || 0} users total.`
                    });
                }
            }
        } catch (error: any) {
            console.error('Database test error:', error);
            setMessage({ type: 'error', text: `Database test failed: ${error.message}` });
        }
    };

    if (userProfile) {
        return (
            <Card className="mb-4 border-green-200 bg-green-50">
                <CardHeader>
                    <CardTitle className="text-sm">✅ Admin Profile Loaded</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">Your admin profile is working correctly!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-4 border-red-200 bg-red-50">
            <CardHeader>
                <CardTitle className="text-sm">🚨 Admin Profile Missing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm">
                    Your user profile is missing from the database. Create it now to access admin features.
                </p>

                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button
                        onClick={createUserProfile}
                        disabled={isCreating}
                        className="flex-1"
                    >
                        {isCreating ? 'Creating...' : 'Create Admin Profile'}
                    </Button>
                    <Button
                        onClick={checkDatabase}
                        variant="outline"
                    >
                        Test DB
                    </Button>
                    <Button
                        onClick={() => {
                            const sql = `INSERT INTO users (id, email, full_name, role, department, created_at, updated_at) 
VALUES ('${user?.id}', '${user?.email}', '${formData.full_name}', '${formData.role}', '${formData.department}', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  updated_at = NOW();`;

                            navigator.clipboard.writeText(sql);
                            setMessage({ type: 'success', text: 'SQL copied to clipboard! Go to Supabase Dashboard > SQL Editor and paste this.' });
                        }}
                        variant="secondary"
                        size="sm"
                    >
                        Copy SQL
                    </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                    <p><strong>User ID:</strong> {user?.id}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                </div>
            </CardContent>
        </Card>
    );
};