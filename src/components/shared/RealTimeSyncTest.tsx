import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Zap, Clock, Users, AlertTriangle } from 'lucide-react';
import { useRealTimeSync } from './RealTimeSyncProvider';
import { useRealtimeConnectionStatus } from '@/hooks/useRealTimeAvailability';
import { useAuth } from '@/hooks/useAuth';

export const RealTimeSyncTest: React.FC = () => {
    const { userProfile } = useAuth();
    const [testResults, setTestResults] = useState<Array<{
        test: string;
        status: 'pending' | 'success' | 'error';
        message: string;
        timestamp: Date;
    }>>([]);

    const {
        connectionStatus,
        isConnected,
        lastUpdate,
        syncUpdates,
        adminNotifications,
        reconnect
    } = useRealTimeSync();

    const {
        status: detailedStatus,
        healthCheck,
        detailedStatus: connectionDetails,
        isMonitoringEnabled
    } = useRealtimeConnectionStatus();

    const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
        setTestResults(prev => [
            { test, status, message, timestamp: new Date() },
            ...prev.slice(0, 9) // Keep last 10 results
        ]);
    };

    const runConnectionTest = () => {
        addTestResult(
            'Connection Status',
            isConnected ? 'success' : 'error',
            isConnected ? 'Real-time connection is active' : 'Connection failed or disconnected'
        );
    };

    const runSyncTest = () => {
        const recentUpdates = syncUpdates.filter(update =>
            Date.now() - update.timestamp.getTime() < 60000 // Last minute
        );

        addTestResult(
            'Sync Updates',
            recentUpdates.length > 0 ? 'success' : 'error',
            recentUpdates.length > 0
                ? `${recentUpdates.length} sync updates in the last minute`
                : 'No recent sync updates detected'
        );
    };

    const runAdminNotificationTest = () => {
        if (userProfile?.role !== 'admin') {
            addTestResult(
                'Admin Notifications',
                'error',
                'User is not an admin - admin notifications not available'
            );
            return;
        }

        const recentNotifications = adminNotifications.filter(notification =>
            Date.now() - notification.timestamp.getTime() < 300000 // Last 5 minutes
        );

        addTestResult(
            'Admin Notifications',
            'success',
            `${recentNotifications.length} admin notifications in the last 5 minutes`
        );
    };

    const runHealthCheckTest = () => {
        if (!healthCheck) {
            addTestResult('Health Check', 'error', 'Health check data not available');
            return;
        }

        const healthScore = healthCheck.totalSubscriptions > 0
            ? (healthCheck.connectedSubscriptions / healthCheck.totalSubscriptions) * 100
            : 0;

        addTestResult(
            'Health Check',
            healthScore >= 80 ? 'success' : 'error',
            `Connection health: ${Math.round(healthScore)}% (${healthCheck.connectedSubscriptions}/${healthCheck.totalSubscriptions} connected)`
        );
    };

    const runAllTests = () => {
        setTestResults([]);
        setTimeout(() => runConnectionTest(), 100);
        setTimeout(() => runSyncTest(), 200);
        setTimeout(() => runAdminNotificationTest(), 300);
        setTimeout(() => runHealthCheckTest(), 400);
    };

    useEffect(() => {
        // Run initial tests after component mounts
        const timer = setTimeout(runAllTests, 1000);
        return () => clearTimeout(timer);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-600 bg-green-100';
            case 'error': return 'text-red-600 bg-red-100';
            default: return 'text-yellow-600 bg-yellow-100';
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Real-time Sync Test Dashboard
                    {isConnected && <Zap className="h-4 w-4 text-green-500 animate-pulse" />}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                        <span>Status: {connectionStatus}</span>
                    </div>
                    {lastUpdate && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
                        </div>
                    )}
                    {isMonitoringEnabled && (
                        <Badge variant="outline" className="text-xs">
                            Auto-monitoring enabled
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Test Controls */}
                <div className="flex gap-2">
                    <Button onClick={runAllTests} size="sm">
                        Run All Tests
                    </Button>
                    <Button onClick={runConnectionTest} variant="outline" size="sm">
                        Test Connection
                    </Button>
                    <Button onClick={runSyncTest} variant="outline" size="sm">
                        Test Sync
                    </Button>
                    {userProfile?.role === 'admin' && (
                        <Button onClick={runAdminNotificationTest} variant="outline" size="sm">
                            Test Admin Notifications
                        </Button>
                    )}
                    <Button onClick={reconnect} variant="outline" size="sm">
                        Reconnect
                    </Button>
                </div>

                <Separator />

                {/* Test Results */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium">Test Results</h3>
                    {testResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No test results yet. Click "Run All Tests" to start.</p>
                    ) : (
                        <div className="space-y-2">
                            {testResults.map((result, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Badge className={getStatusColor(result.status)}>
                                            {result.status}
                                        </Badge>
                                        <div>
                                            <span className="font-medium text-sm">{result.test}</span>
                                            <p className="text-xs text-muted-foreground">{result.message}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {result.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Live Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Sync Updates</span>
                        </div>
                        <p className="text-2xl font-bold">{syncUpdates.length}</p>
                        <p className="text-xs text-muted-foreground">Total updates received</p>
                    </div>

                    {userProfile?.role === 'admin' && (
                        <div className="p-4 rounded-lg bg-muted">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium">Admin Notifications</span>
                            </div>
                            <p className="text-2xl font-bold">{adminNotifications.length}</p>
                            <p className="text-xs text-muted-foreground">Total notifications</p>
                        </div>
                    )}

                    <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Connections</span>
                        </div>
                        <p className="text-2xl font-bold">
                            {healthCheck ? `${healthCheck.connectedSubscriptions}/${healthCheck.totalSubscriptions}` : '0/0'}
                        </p>
                        <p className="text-xs text-muted-foreground">Active subscriptions</p>
                    </div>
                </div>

                {/* Recent Sync Updates */}
                {syncUpdates.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Recent Sync Updates</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {syncUpdates.slice(0, 10).map((update, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 rounded border text-xs">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {update.eventType}
                                            </Badge>
                                            <span>Room {update.roomId.slice(0, 8)}...</span>
                                            <span className={update.isAvailable ? 'text-green-600' : 'text-red-600'}>
                                                {update.isAvailable ? 'Available' : 'Occupied'}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {update.source}
                                            </Badge>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {update.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};