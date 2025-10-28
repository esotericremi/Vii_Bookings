import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Copy, Terminal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { runSupabaseHealthCheck } from '@/utils/supabaseCheck';

interface TroubleshootingHelpProps {
    error?: string;
    onClose?: () => void;
}

export const TroubleshootingHelp: React.FC<TroubleshootingHelpProps> = ({ error, onClose }) => {
    const [healthCheckResult, setHealthCheckResult] = useState<any>(null);
    const [isRunningCheck, setIsRunningCheck] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const runHealthCheck = async () => {
        setIsRunningCheck(true);
        try {
            const result = await runSupabaseHealthCheck();
            setHealthCheckResult(result);
        } catch (error) {
            console.error('Health check failed:', error);
            setHealthCheckResult({ overall: false, error: 'Health check failed' });
        } finally {
            setIsRunningCheck(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const commonIssues = [
        {
            issue: "Email not confirmed",
            description: "User registered but can't sign in",
            solution: "Disable email confirmation in Supabase Dashboard → Authentication → Settings",
            severity: "high"
        },
        {
            issue: "Invalid login credentials",
            description: "Correct email/password but login fails",
            solution: "Check if user exists in Supabase Dashboard → Authentication → Users",
            severity: "medium"
        },
        {
            issue: "Database connection error",
            description: "Can't connect to Supabase",
            solution: "Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file",
            severity: "high"
        },
        {
            issue: "Missing tables",
            description: "Database tables don't exist",
            solution: "Run the SQL setup script from SUPABASE_SETUP.md",
            severity: "high"
        }
    ];

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Authentication Troubleshooting
                    </CardTitle>
                    <CardDescription>
                        Having trouble signing in? Let's diagnose and fix the issue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Current Error:</strong> {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">System Health Check</h3>
                            <Button
                                onClick={runHealthCheck}
                                disabled={isRunningCheck}
                                variant="outline"
                                size="sm"
                            >
                                {isRunningCheck ? 'Checking...' : 'Run Check'}
                            </Button>
                        </div>

                        {healthCheckResult && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {healthCheckResult.overall ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <span className="font-medium">
                                        {healthCheckResult.overall ? 'System OK' : 'Issues Found'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={healthCheckResult.connection ? 'default' : 'destructive'}>
                                            Connection: {healthCheckResult.connection ? 'OK' : 'Failed'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={healthCheckResult.tables ? 'default' : 'destructive'}>
                                            Tables: {healthCheckResult.tables ? 'OK' : 'Missing'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Common Issues & Solutions</CardTitle>
                    <CardDescription>
                        Quick fixes for the most common authentication problems.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {commonIssues.map((item, index) => (
                            <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium">{item.issue}</h4>
                                    <Badge variant={getSeverityColor(item.severity) as any}>
                                        {item.severity}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {item.description}
                                </p>
                                <div className="bg-muted p-3 rounded text-sm">
                                    <strong>Solution:</strong> {item.solution}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-base">Advanced Troubleshooting</CardTitle>
                            <CardDescription>
                                Developer tools and detailed setup instructions
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Browser Console Commands</h4>
                                <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>runSupabaseHealthCheck()</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard('runSupabaseHealthCheck()')}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Open browser console (F12) and run this command for detailed diagnostics.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Environment Variables</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <code className="bg-muted px-2 py-1 rounded">VITE_SUPABASE_URL</code>
                                        <span className="text-muted-foreground">Your Supabase project URL</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-muted px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code>
                                        <span className="text-muted-foreground">Your Supabase anonymous key</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Setup Documentation</h4>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open('/SUPABASE_SETUP.md', '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Setup Guide
                                </Button>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Quick Fix: Disable Email Confirmation</h4>
                                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                                    <li>Go to Supabase Dashboard</li>
                                    <li>Navigate to Authentication → Settings</li>
                                    <li>Scroll to "Email Auth" section</li>
                                    <li>Uncheck "Enable email confirmations"</li>
                                    <li>Click Save</li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {onClose && (
                <div className="flex justify-end">
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                </div>
            )}
        </div>
    );
};