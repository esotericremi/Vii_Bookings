import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Bell, Moon, Globe, Shield, Palette } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

const Settings: React.FC = () => {
    const { userProfile } = useAuth();
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        bookingReminders: true,
        systemUpdates: false
    });
    const [preferences, setPreferences] = useState({
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY'
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    usePageTitle('Settings - VII Bookings');

    const handleSaveSettings = () => {
        // TODO: Implement settings save functionality
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your application preferences and notifications
                    </p>
                </div>

                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6">
                    {/* Notification Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Choose how you want to be notified about bookings and updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="email-notifications">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive booking confirmations and updates via email
                                    </p>
                                </div>
                                <Switch
                                    id="email-notifications"
                                    checked={notifications.email}
                                    onCheckedChange={(checked) =>
                                        setNotifications(prev => ({ ...prev, email: checked }))
                                    }
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="push-notifications">Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive real-time notifications in the app
                                    </p>
                                </div>
                                <Switch
                                    id="push-notifications"
                                    checked={notifications.push}
                                    onCheckedChange={(checked) =>
                                        setNotifications(prev => ({ ...prev, push: checked }))
                                    }
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="booking-reminders">Booking Reminders</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get reminded about upcoming bookings
                                    </p>
                                </div>
                                <Switch
                                    id="booking-reminders"
                                    checked={notifications.bookingReminders}
                                    onCheckedChange={(checked) =>
                                        setNotifications(prev => ({ ...prev, bookingReminders: checked }))
                                    }
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="system-updates">System Updates</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive notifications about system maintenance and updates
                                    </p>
                                </div>
                                <Switch
                                    id="system-updates"
                                    checked={notifications.systemUpdates}
                                    onCheckedChange={(checked) =>
                                        setNotifications(prev => ({ ...prev, systemUpdates: checked }))
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appearance Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Appearance
                            </CardTitle>
                            <CardDescription>
                                Customize how the application looks and feels
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="theme">Theme</Label>
                                <Select
                                    value={preferences.theme}
                                    onValueChange={(value) =>
                                        setPreferences(prev => ({ ...prev, theme: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="system">System</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Regional Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Regional Settings
                            </CardTitle>
                            <CardDescription>
                                Set your language, timezone, and date format preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Select
                                        value={preferences.language}
                                        onValueChange={(value) =>
                                            setPreferences(prev => ({ ...prev, language: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select
                                        value={preferences.timezone}
                                        onValueChange={(value) =>
                                            setPreferences(prev => ({ ...prev, timezone: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date-format">Date Format</Label>
                                <Select
                                    value={preferences.dateFormat}
                                    onValueChange={(value) =>
                                        setPreferences(prev => ({ ...prev, dateFormat: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select date format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Account Security
                            </CardTitle>
                            <CardDescription>
                                Manage your account security settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Account Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Your account is active and secure
                                    </p>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Active
                                </Badge>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Button variant="outline" className="w-full" disabled>
                                    Change Password
                                    <span className="text-xs text-gray-500 ml-2">(Coming Soon)</span>
                                </Button>
                                <Button variant="outline" className="w-full" disabled>
                                    Two-Factor Authentication
                                    <span className="text-xs text-gray-500 ml-2">(Coming Soon)</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Settings Link */}
                    {userProfile?.role === 'admin' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <SettingsIcon className="h-5 w-5" />
                                    Administrator Settings
                                </CardTitle>
                                <CardDescription>
                                    Access system-wide settings and configurations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.location.href = '/admin/settings'}
                                >
                                    Go to System Settings
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button onClick={handleSaveSettings}>
                            Save Settings
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;