import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { User, Mail, Building, Calendar, Shield } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

const Profile: React.FC = () => {
    const { user, userProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    usePageTitle('Profile - VII Bookings');

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!user || !userProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Profile</h1>
                    <p className="text-muted-foreground">
                        Manage your account information and preferences
                    </p>
                </div>

                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>
                                Your basic account information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={userProfile.avatar_url || ''} />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                                        {getInitials(userProfile.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">{userProfile.full_name}</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                                            {userProfile.role}
                                        </Badge>
                                        {userProfile.department && (
                                            <Badge variant="outline">
                                                {userProfile.department}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={userProfile.full_name}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        <Input
                                            id="email"
                                            value={user.email || ''}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                {userProfile.department && (
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-gray-500" />
                                            <Input
                                                id="department"
                                                value={userProfile.department}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Account Details
                            </CardTitle>
                            <CardDescription>
                                Your account status and information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Account Status</span>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Active
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Role</span>
                                    <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                                        {userProfile.role}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Member Since</span>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(userProfile.created_at)}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Last Updated</span>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(userProfile.updated_at)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">Account Actions</h4>
                                <div className="space-y-2">
                                    <Button variant="outline" className="w-full" disabled>
                                        Change Password
                                        <span className="text-xs text-gray-500 ml-2">(Coming Soon)</span>
                                    </Button>
                                    <Button variant="outline" className="w-full" disabled>
                                        Update Profile Picture
                                        <span className="text-xs text-gray-500 ml-2">(Coming Soon)</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                        <CardDescription>
                            Contact your administrator to update your profile information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertDescription>
                                To update your name, department, or role, please contact your system administrator.
                                Profile updates require administrative approval for security purposes.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;