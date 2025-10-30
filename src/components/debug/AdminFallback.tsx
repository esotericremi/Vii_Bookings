import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export const AdminFallback: React.FC = () => {
    const { user } = useAuth();

    const enableFallbackAdmin = () => {
        if (!user?.id) return;

        // Store fallback admin profile in localStorage
        const fallbackProfile = {
            id: user.id,
            email: user.email,
            full_name: 'System Administrator',
            role: 'admin',
            department: 'IT',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        localStorage.setItem('fallback_admin_profile', JSON.stringify(fallbackProfile));

        // Force page reload to trigger auth context refresh
        window.location.reload();
    };

    const disableFallbackAdmin = () => {
        localStorage.removeItem('fallback_admin_profile');
        window.location.reload();
    };

    const hasFallback = localStorage.getItem('fallback_admin_profile');

    return (
        <Card className="mb-4 border-purple-200 bg-purple-50">
            <CardHeader>
                <CardTitle className="text-sm">🔄 Admin Fallback Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertDescription>
                        Since your database connection is timing out, you can enable a temporary fallback admin mode
                        that stores your admin profile locally until the database connection is fixed.
                    </AlertDescription>
                </Alert>

                {hasFallback ? (
                    <div className="space-y-2">
                        <p className="text-sm text-green-600 font-medium">✅ Fallback admin mode is ACTIVE</p>
                        <Button onClick={disableFallbackAdmin} variant="outline" size="sm">
                            Disable Fallback Mode
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-sm text-orange-600">⚠️ Fallback admin mode is INACTIVE</p>
                        <Button onClick={enableFallbackAdmin} variant="default" size="sm">
                            Enable Fallback Admin Mode
                        </Button>
                    </div>
                )}

                <div className="text-xs text-muted-foreground">
                    <p><strong>Note:</strong> This is a temporary solution. Fix your Supabase connection for permanent access.</p>
                </div>
            </CardContent>
        </Card>
    );
};