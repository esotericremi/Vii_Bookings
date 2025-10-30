import React, { useState } from 'react';
import { Calendar, Users, Clock, Building2, Plus, TrendingUp } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import { format, startOfDay, endOfDay } from 'date-fns';


const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [selectedDate] = useState(new Date());

    usePageTitle('Dashboard - VII Bookings');

    // Get rooms and bookings data
    const { data: rooms = [], isLoading: roomsLoading } = useRooms();
    const { data: todayBookings = [], isLoading: bookingsLoading } = useBookings({
        startDate: startOfDay(selectedDate).toISOString(),
        endDate: endOfDay(selectedDate).toISOString()
    });

    // Calculate stats
    const totalRooms = rooms.length;
    const activeRooms = rooms.filter(room => room.is_active).length;
    const todayBookingsCount = todayBookings.filter(booking => booking.status === 'confirmed').length;
    const myBookingsToday = todayBookings.filter(booking =>
        booking.user_id === userProfile?.id && booking.status === 'confirmed'
    ).length;



    // Get upcoming bookings for today
    const upcomingBookings = todayBookings
        .filter(booking => {
            const bookingStart = new Date(booking.start_time);
            return bookingStart > new Date() && booking.status === 'confirmed';
        })
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 5);

    return (
        <div className="px-4 sm:px-6 lg:px-8 space-y-6">


            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome back, {userProfile?.full_name?.split(' ')[0] || 'User'}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                </div>
                <Button onClick={() => navigate('/rooms')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Book a Room
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRooms}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeRooms} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayBookingsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Confirmed bookings
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Bookings Today</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myBookingsToday}</div>
                        <p className="text-xs text-muted-foreground">
                            Your meetings
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalRooms > 0 ? Math.round((todayBookingsCount / totalRooms) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Room usage today
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rooms')}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Find & Book Rooms
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Browse available meeting rooms and make instant bookings
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/my-bookings')}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            My Bookings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            View and manage your upcoming meeting reservations
                        </p>
                    </CardContent>
                </Card>

                {userProfile?.role === 'admin' && (
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Admin Dashboard
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Manage rooms, bookings, and view analytics
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Upcoming Bookings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Upcoming Bookings Today
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {bookingsLoading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                            ))}
                        </div>
                    ) : upcomingBookings.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{booking.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {booking.rooms?.name} • {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                                        </p>
                                    </div>
                                    <Badge variant={booking.user_id === userProfile?.id ? 'default' : 'secondary'}>
                                        {booking.user_id === userProfile?.id ? 'Your Meeting' : 'Booked'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No upcoming bookings for today</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => navigate('/rooms')}
                            >
                                Book a Room
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;