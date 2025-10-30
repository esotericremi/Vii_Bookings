import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export const SupabaseDebug: React.FC = () => {
    const [envCheck, setEnvCheck] = useState<any>(null);

    const checkEnvironment = () => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const result = {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseAnonKey,
            urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Missing',
            keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing',
            mode: import.meta.env.MODE,
            dev: import.meta.env.DEV
        };

        console.log('Environment check:', result);
        console.log('Full VITE_SUPABASE_URL:', supabaseUrl);
        console.log('Full VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);

        setEnvCheck(result);
    };

    return (
        <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardHeader>
                <CardTitle className="text-sm">🔧 Supabase Environment Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={checkEnvironment} variant="outline" className="w-full">
                    Check Environment Variables
                </Button>

                {envCheck && (
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span>Supabase URL:</span>
                            <Badge variant={envCheck.hasUrl ? 'default' : 'destructive'}>
                                {envCheck.hasUrl ? 'Present' : 'Missing'}
                            </Badge>
                            {envCheck.hasUrl && (
                                <span className="text-xs text-muted-foreground">{envCheck.urlPreview}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span>Anon Key:</span>
                            <Badge variant={envCheck.hasKey ? 'default' : 'destructive'}>
                                {envCheck.hasKey ? 'Present' : 'Missing'}
                            </Badge>
                            {envCheck.hasKey && (
                                <span className="text-xs text-muted-foreground">{envCheck.keyPreview}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span>Mode:</span>
                            <Badge variant="outline">{envCheck.mode}</Badge>
                        </div>

                        {(!envCheck.hasUrl || !envCheck.hasKey) && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Missing environment variables! Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};