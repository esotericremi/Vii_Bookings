import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AdminDebug: React.FC = () => {
    const { user, userProfile, loading } = useAuth();

    return (
        <Card className="mb-4 border-yellow-200 bg-yellow-50">
            <CardHeader>
                <CardTitle className="text-sm">🔧 Admin Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div>
                    <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
                </div>
                <div>
                    <strong>User ID:</strong> {user?.id || 'Not found'}
                </div>
                <div>
                    <strong>User Email:</strong> {user?.email || 'Not found'}
                </div>
                <div>
                    <strong>Profile Loaded:</strong> {userProfile ? 'Yes' : 'No'}
                </div>
                <div>
                    <strong>Full Name:</strong> {userProfile?.full_name || 'Not found'}
                </div>
                <div>
                    <strong>Role:</strong>
                    <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'} className="ml-2">
                        {userProfile?.role || 'Not found'}
                    </Badge>
                </div>
                <div>
                    <strong>Department:</strong> {userProfile?.department || 'Not set'}
                </div>
                <div>
                    <strong>Is Admin:</strong>
                    <Badge variant={userProfile?.role === 'admin' ? 'default' : 'destructive'} className="ml-2">
                        {userProfile?.role === 'admin' ? 'YES' : 'NO'}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
};