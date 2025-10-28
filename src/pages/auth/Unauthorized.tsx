import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX } from 'lucide-react';

export const Unauthorized: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldX className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Access Denied
                    </CardTitle>
                    <CardDescription>
                        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button asChild className="w-full">
                        <Link to="/">Go to Home</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/login">Sign In with Different Account</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};