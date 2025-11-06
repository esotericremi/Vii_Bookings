import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Shield, Zap } from 'lucide-react';
import { getUserProfile, checkDatabaseHealth } from '@/lib/supabase';
import { verifyAdminRole, clearUserCache } from '@/utils/adminFix';
import { enableEmergencyAdminMode, disableEmergencyAdminMode } from '@/utils/authDebug';

export const AdminRoleDebug: React.FC = () => {
    const { user, userProfile, session, loading } = useAuth();
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshProfile = async () => {
        if (!user?.id) return;

        setIsRefreshing(true);
        try {
            const freshProfile = await getUserProfile(user.id);
            const verification = await verifyAdminRole(user.id);

            setDebugInfo({
                timestamp: new Date().toISOString(),
                freshProfile,
                cachedProfile: userProfile,
                sessionValid: !!session,
                sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null,
                verification
            });
        } catch (error) {
            console.error('Error refreshing profile:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleClearCache = () => {
        if (user?.id) {
            clearUserCache(user.id);
            // Force a page reload to refresh auth state
            window.location.reload();
        }
    };

    const handleEmergencyAdmin = () => {
        if (user?.id && user?.email) {
            const emergencyKey = `emergency_admin_${user.id}`;
            const isEmergencyMode = localStorage.getItem(emergencyKey);

            if (isEmergencyMode) {
                disableEmergencyAdminMode(user.id);
            } else {
                enableEmergencyAdminMode(user.id, user.email);
            }

            // Force a page reload to refresh auth state
            window.location.reload();
        }
    };

    const isEmergencyMode = user?.id ? localStorage.getItem(`emergency_admin_${user.id}`) : null;

    useEffect(() => {
        if (user?.id) {
            refreshProfile();
        }
    }, [user?.id, userProfile?.role]);

    if (!user) {
        return null;
    }

    const isAdmin = userProfile?.role === 'admin';
    const hasRoleIssue = userProfile && !['staff', 'admin'].includes(userProfile.role);

    return (
        <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Admin Role Debug Info
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshProfile}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearCache}
                        >
                            <Shield className="h-3 w-3 mr-1" />
                            Clear Cache
                        </Button>
                        <Button
                            variant={isEmergencyMode ? "destructive" : "default"}
                            size="sm"
                            onClick={handleEmergencyAdmin}
                        >
                            <Zap className="h-3 w-3 mr-1" />
                            {isEmergencyMode ? 'Disable Emergency' : 'Emergency Admin'}
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <strong>Current Status:</strong>
                        <div className="flex items-center gap-2 mt-1">
                            {isAdmin ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                            )}
                            <Badge variant={isAdmin ? 'default' : 'secondary'}>
                                {userProfile?.role || 'No Role'}
                            </Badge>
                            {isEmergencyMode && (
                                <Badge variant="destructive" className="text-xs">
                                    🚨 EMERGENCY
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div>
                        <strong>Loading State:</strong>
                        <div className="mt-1">
                            <Badge variant={loading ? 'destructive' : 'outline'}>
                                {loading ? 'Loading...' : 'Loaded'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div>
                    <strong>User ID:</strong> {user.id}
                </div>

                <div>
                    <strong>Email:</strong> {user.email}
                </div>

                {hasRoleIssue && (
                    <div className="p-2 bg-red-100 border border-red-300 rounded">
                        <strong className="text-red-700">⚠️ Invalid Role Detected:</strong>
                        <div>Role: "{userProfile.role}" (should be "staff" or "admin")</div>
                    </div>
                )}

                {debugInfo && (
                    <details className="mt-3">
                        <summary className="cursor-pointer font-medium">Debug Details</summary>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                            <div><strong>Last Refresh:</strong> {debugInfo.timestamp}</div>
                            <div><strong>Fresh Profile Role:</strong> {debugInfo.freshProfile?.role || 'null'}</div>
                            <div><strong>Cached Profile Role:</strong> {debugInfo.cachedProfile?.role || 'null'}</div>
                            <div><strong>Session Valid:</strong> {debugInfo.sessionValid ? 'Yes' : 'No'}</div>
                            {debugInfo.verification && (
                                <div><strong>DB Verification:</strong> {debugInfo.verification.success ?
                                    `✅ ${debugInfo.verification.isAdmin ? 'Admin' : 'Staff'}` :
                                    `❌ ${debugInfo.verification.error}`}
                                </div>
                            )}
                            {debugInfo.sessionExpiry && (
                                <div><strong>Session Expires:</strong> {debugInfo.sessionExpiry.toLocaleString()}</div>
                            )}
                            <div className="mt-2">
                                <strong>Raw Profile Data:</strong>
                                <pre className="mt-1 text-xs overflow-auto">
                                    {JSON.stringify(debugInfo.freshProfile, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </details>
                )}
            </CardContent>
        </Card>
    );
};