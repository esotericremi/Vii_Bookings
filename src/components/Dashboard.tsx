import React, { useState, useMemo } from 'react';
import { Calendar, Grid, List, Clock, Users, MapPin, Plus, Filter, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardProps {
    className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ className }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Mock data for demonstration
    const stats = {
        totalRooms: 12,
        availableRooms: 8,
        activeBookings: 4,
        upcomingBookings: 7
    };

    const recentBookings = [
        {
            id: '1',
            title: 'Team Standup',
            room: 'Conference Room A',
            time: '9:00 AM - 10:00 AM',
            status: 'active'
        },
        {
            id: '2',
            title: 'Client Meeting',
            room: 'Meeting Room B',
            time: '2:00 PM - 3:30 PM',
            status: 'upcoming'
        },
        {
            id: '3',
            title: 'Project Review',
            room: 'Huddle Space 1',
            time: '4:00 PM - 5:00 PM',
            status: 'upcoming'
        }
    ];

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRooms}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Now</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.availableRooms}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Meetings</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.activeBookings}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Today</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.upcomingBookings}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent Bookings</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div className="flex-1">
                                    <h4 className="font-medium">{booking.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {booking.room} • {booking.time}
                                    </p>
                                </div>
                                <Badge
                                    variant={booking.status === 'active' ? 'default' : 'secondary'}
                                >
                                    {booking.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button className="h-20 flex flex-col gap-2">
                            <Plus className="h-6 w-6" />
                            Book a Room
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col gap-2">
                            <Search className="h-6 w-6" />
                            Find Available Rooms
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col gap-2">
                            <Calendar className="h-6 w-6" />
                            View Calendar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};