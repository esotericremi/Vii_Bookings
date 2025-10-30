import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useSystemSettings, useUpdateSystemSettings, useAllUsers, useUpdateUserRole } from '@/hooks/useSystemSettings';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Users, Palette, Clock, Shield } from 'lucide-react';
import { SystemSettingsFormData, UserManagementData } from '@/types/settings';

// Form validation schema
const systemSettingsSchema = z.object({
    max_booking_duration: z.number().min(15).max(1440), // 15 minutes to 24 hours
    advance_notice_hours: z.number().min(0).max(168), // 0 to 7 days
    buffer_time_minutes: z.number().min(0).max(60), // 0 to 1 hour
    company_name: z.string().min(1).max(100),
    company_logo_url: z.string().url().optional().or(z.literal('')),
    theme_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
});

export const SystemSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('booking-rules');

    const { data: settings, isLoading: settingsLoading, error: settingsError } = useSystemSettings();
    const { data: users, isLoading: usersLoading } = useAllUsers();
    const updateSettings = useUpdateSystemSettings();
    const updateUserRole = useUpdateUserRole();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        watch
    } = useForm<SystemSettingsFormData>({
        resolver: zodResolver(systemSettingsSchema),
        defaultValues: settings || {
            max_booking_duration: 480,
            advance_notice_hours: 0,
            buffer_time_minutes: 0,
            company_name: 'Company',
            company_logo_url: '',
            theme_color: '#ff304f'
        }
    });

    // Reset form when settings data loads
    React.useEffect(() => {
        if (settings) {
            reset({
                max_booking_duration: settings.max_booking_duration,
                advance_notice_hours: settings.advance_notice_hours,
                buffer_time_minutes: settings.buffer_time_minutes,
                company_name: settings.company_name,
                company_logo_url: settings.company_logo_url || '',
                theme_color: settings.theme_color
            });
        }
    }, [settings, reset]);

    const onSubmit = (data: SystemSettingsFormData) => {
        updateSettings.mutate({
            ...data,
            company_logo_url: data.company_logo_url || null
        });
    };

    const handleRoleChange = (userId: string, newRole: 'staff' | 'admin') => {
        updateUserRole.mutate({ id: userId, role: newRole });
    };

    if (settingsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    if (settingsError) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-destructive">Failed to load system settings</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">System Settings</h1>
                <p className="text-muted-foreground">
                    Configure booking rules, branding, and user permissions
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="booking-rules" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Booking Rules
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Branding
                    </TabsTrigger>
                    <TabsTrigger value="user-management" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Management
                    </TabsTrigger>
                    <TabsTrigger value="system" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        System
                    </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <TabsContent value="booking-rules" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Booking Rules Configuration
                                </CardTitle>
                                <CardDescription>
                                    Set limits and requirements for room bookings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_booking_duration">
                                            Maximum Booking Duration (minutes)
                                        </Label>
                                        <Input
                                            id="max_booking_duration"
                                            type="number"
                                            min="15"
                                            max="1440"
                                            {...register('max_booking_duration', { valueAsNumber: true })}
                                        />
                                        {errors.max_booking_duration && (
                                            <p className="text-sm text-destructive">
                                                {errors.max_booking_duration.message}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Current: {watch('max_booking_duration')} minutes
                                            ({Math.floor(watch('max_booking_duration') / 60)}h {watch('max_booking_duration') % 60}m)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="advance_notice_hours">
                                            Advance Notice Required (hours)
                                        </Label>
                                        <Input
                                            id="advance_notice_hours"
                                            type="number"
                                            min="0"
                                            max="168"
                                            {...register('advance_notice_hours', { valueAsNumber: true })}
                                        />
                                        {errors.advance_notice_hours && (
                                            <p className="text-sm text-destructive">
                                                {errors.advance_notice_hours.message}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Users must book at least {watch('advance_notice_hours')} hours in advance
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="buffer_time_minutes">
                                            Buffer Time Between Bookings (minutes)
                                        </Label>
                                        <Input
                                            id="buffer_time_minutes"
                                            type="number"
                                            min="0"
                                            max="60"
                                            {...register('buffer_time_minutes', { valueAsNumber: true })}
                                        />
                                        {errors.buffer_time_minutes && (
                                            <p className="text-sm text-destructive">
                                                {errors.buffer_time_minutes.message}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Automatic gap between consecutive bookings
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="branding" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5" />
                                    Company Branding
                                </CardTitle>
                                <CardDescription>
                                    Customize the appearance and branding of your booking system
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="company_name">Company Name</Label>
                                        <Input
                                            id="company_name"
                                            {...register('company_name')}
                                        />
                                        {errors.company_name && (
                                            <p className="text-sm text-destructive">
                                                {errors.company_name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="theme_color">Theme Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="theme_color"
                                                type="color"
                                                className="w-16 h-10 p-1"
                                                {...register('theme_color')}
                                            />
                                            <Input
                                                type="text"
                                                placeholder="#3b82f6"
                                                {...register('theme_color')}
                                            />
                                        </div>
                                        {errors.theme_color && (
                                            <p className="text-sm text-destructive">
                                                {errors.theme_color.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="company_logo_url">Company Logo URL</Label>
                                        <Input
                                            id="company_logo_url"
                                            type="url"
                                            placeholder="https://example.com/logo.png"
                                            {...register('company_logo_url')}
                                        />
                                        {errors.company_logo_url && (
                                            <p className="text-sm text-destructive">
                                                {errors.company_logo_url.message}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Leave empty to use default logo
                                        </p>
                                    </div>
                                </div>

                                {watch('company_logo_url') && (
                                    <div className="space-y-2">
                                        <Label>Logo Preview</Label>
                                        <div className="border rounded-lg p-4 bg-muted/50">
                                            <img
                                                src={watch('company_logo_url')}
                                                alt="Company Logo Preview"
                                                className="max-h-16 max-w-48 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => reset()}
                            disabled={!isDirty}
                        >
                            Reset Changes
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isDirty || updateSettings.isPending}
                        >
                            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>

                <TabsContent value="user-management" className="space-y-4">
                    <UserManagementTab
                        users={users || []}
                        isLoading={usersLoading}
                        onRoleChange={handleRoleChange}
                        isUpdating={updateUserRole.isPending}
                    />
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                    <SystemInfoTab settings={settings} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

// User Management Tab Component
interface UserManagementTabProps {
    users: UserManagementData[];
    isLoading: boolean;
    onRoleChange: (userId: string, role: 'staff' | 'admin') => void;
    isUpdating: boolean;
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({
    users,
    isLoading,
    onRoleChange,
    isUpdating
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'staff' | 'admin'>('all');

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    User Role Management
                </CardTitle>
                <CardDescription>
                    Manage user roles and permissions
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border rounded-md"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as 'all' | 'staff' | 'admin')}
                    >
                        <option value="all">All Roles</option>
                        <option value="staff">Staff Only</option>
                        <option value="admin">Admin Only</option>
                    </select>
                </div>

                <div className="space-y-2">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="font-medium">{user.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        {user.department && (
                                            <p className="text-sm text-muted-foreground">
                                                {user.department}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                    {user.role}
                                </Badge>
                                <select
                                    value={user.role}
                                    onChange={(e) => onRoleChange(user.id, e.target.value as 'staff' | 'admin')}
                                    disabled={isUpdating}
                                    className="px-2 py-1 border rounded text-sm"
                                >
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No users found matching your criteria
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// System Info Tab Component
interface SystemInfoTabProps {
    settings: any;
}

const SystemInfoTab: React.FC<SystemInfoTabProps> = ({ settings }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Information
                </CardTitle>
                <CardDescription>
                    Current system configuration and status
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Settings Last Updated</Label>
                        <p className="text-sm">
                            {settings?.updated_at
                                ? new Date(settings.updated_at).toLocaleString()
                                : 'Never'
                            }
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Settings Created</Label>
                        <p className="text-sm">
                            {settings?.created_at
                                ? new Date(settings.created_at).toLocaleString()
                                : 'Unknown'
                            }
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label>Current Configuration Summary</Label>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                        <p><strong>Max Booking Duration:</strong> {settings?.max_booking_duration} minutes</p>
                        <p><strong>Advance Notice:</strong> {settings?.advance_notice_hours} hours</p>
                        <p><strong>Buffer Time:</strong> {settings?.buffer_time_minutes} minutes</p>
                        <p><strong>Company Name:</strong> {settings?.company_name}</p>
                        <p><strong>Theme Color:</strong>
                            <span
                                className="inline-block w-4 h-4 rounded ml-2 border"
                                style={{ backgroundColor: settings?.theme_color }}
                            />
                            {settings?.theme_color}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};