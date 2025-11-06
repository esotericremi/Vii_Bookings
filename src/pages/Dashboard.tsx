import React, { useState } from 'react';
import { Calendar, Users, Clock, Building2, Plus, TrendingUp, Settings, BarChart3, AlertTriangle, RefreshCw } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import { format, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { BookingsDashboard } from '@/components/dashboard/BookingsDashboard';


const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const [selectedDate] = useState(new Date());
    const isAdmin = userProfile?.role === 'admin';

    usePageTitle('Dashboard - VII Bookings');

    // Get rooms and bookings data
    const { data: rooms = [], isLoading: roomsLoading, refetch: refetchRooms } = useRooms();
    const { data: allBookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useBookings();

    // Filter today's bookings
    const todayStart = startOfDay(selectedDate);
    const todayEnd = endOfDay(selectedDate);
    const todayBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.start_time);
        return bookingDate >= todayStart && bookingDate <= todayEnd;
    });

    // Calculate stats
    const totalRooms = rooms.length;
    const activeRooms = rooms.filter(room => room.is_active).length;
    const todayBookingsCount = todayBookings.filter(booking => booking.status === 'confirmed').length;
    const myBookingsToday = todayBookings.filter(booking =>
        booking.user_id === userProfile?.id && booking.status === 'confirmed'
    ).length;

    // Admin-specific calculations
    const activeBookings = todayBookings.filter(booking => {
        const now = new Date();
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        return booking.status === 'confirmed' && start <= now && end >= now;
    });

    const ghostBookings = todayBookings.filter(booking =>
        booking.status === 'confirmed' &&
        isBefore(new Date(booking.start_time), new Date()) &&
        !booking.checked_in
    ).length;

    const utilizationRate = totalRooms > 0 ? Math.round((activeBookings.length / totalRooms) * 100) : 0;



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
                        {isAdmin && <Badge className="ml-2" variant="default">Admin</Badge>}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <Button variant="outline" size="sm" onClick={() => {
                            refetchBookings();
                            refetchRooms();
                        }}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    )}
                    <Button onClick={() => navigate('/rooms')} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Book a Room
                    </Button>
                </div>
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
                        <CardTitle className="text-sm font-medium">
                            {isAdmin ? "All Bookings Today" : "Today's Bookings"}
                        </CardTitle>
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
                        <CardTitle className="text-sm font-medium">
                            {isAdmin ? "Active Meetings" : "My Bookings Today"}
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {isAdmin ? activeBookings.length : myBookingsToday}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isAdmin ? "Right now" : "Your meetings"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isAdmin ? "Ghost Bookings" : "Utilization"}
                        </CardTitle>
                        {isAdmin ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isAdmin ? 'text-yellow-600' : ''}`}>
                            {isAdmin ? ghostBookings : `${utilizationRate}%`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isAdmin ? "Not checked in" : "Room usage today"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Unified Dashboard Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    {isAdmin && <TabsTrigger value="management">Management</TabsTrigger>}
                    {isAdmin && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
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

                        {isAdmin && (
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/rooms')}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-primary" />
                                        Manage Rooms
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Add, edit, and configure meeting rooms
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
                                {isAdmin ? "Today's Schedule" : "Upcoming Bookings Today"}
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
                                    {upcomingBookings.map((booking) => {
                                        const now = new Date();
                                        const start = new Date(booking.start_time);
                                        const end = new Date(booking.end_time);
                                        const isActive = start <= now && end >= now && booking.status === 'confirmed';
                                        const isMyBooking = booking.user_id === userProfile?.id;

                                        return (
                                            <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{booking.title}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {booking.rooms?.name} • {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                                                        {isAdmin && !isMyBooking && (
                                                            <span className="ml-2">• {booking.users?.full_name}</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isActive && (
                                                        <Badge variant="default" className="bg-green-600">
                                                            Active
                                                        </Badge>
                                                    )}
                                                    <Badge variant={isMyBooking ? 'default' : 'secondary'}>
                                                        {isMyBooking ? 'Your Meeting' : 'Booked'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                </TabsContent>

                <TabsContent value="bookings" className="space-y-6">
                    <BookingsDashboard selectedDate={selectedDate} />
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="management" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Admin Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => navigate('/admin/rooms')}
                                        >
                                            <Building2 className="h-4 w-4 mr-2" />
                                            Manage Rooms
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => navigate('/admin/bookings')}
                                        >
                                            <Calendar className="h-4 w-4 mr-2" />
                                            All Bookings
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => navigate('/admin/analytics')}
                                        >
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            View Analytics
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => navigate('/admin/settings')}
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            System Settings
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>System Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <div className="font-medium">Database Connection</div>
                                                    <div className="text-sm text-muted-foreground">All systems operational</div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-green-600">Healthy</Badge>
                                        </div>

                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${ghostBookings > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                <div>
                                                    <div className="font-medium">Ghost Bookings</div>
                                                    <div className="text-sm text-muted-foreground">{ghostBookings} bookings not checked in</div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={ghostBookings > 0 ? 'text-yellow-600' : 'text-green-600'}>
                                                {ghostBookings > 0 ? 'Attention' : 'Good'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="analytics" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Room Usage Today</span>
                                        <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')}>
                                            Full Analytics
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {roomsLoading ? (
                                        <div className="space-y-3">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="animate-pulse flex justify-between">
                                                    <div className="h-4 bg-muted rounded w-1/3"></div>
                                                    <div className="h-4 bg-muted rounded w-1/4"></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {rooms.slice(0, 5).map((room, index) => {
                                                const roomBookings = todayBookings.filter(b => b.room_id === room.id).length;
                                                return (
                                                    <div key={room.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'}</span>
                                                            <span>{room.name}</span>
                                                        </div>
                                                        <Badge variant="outline">{roomBookings} bookings</Badge>
                                                    </div>
                                                );
                                            })}
                                            {rooms.length === 0 && (
                                                <div className="text-center py-4 text-muted-foreground">
                                                    No rooms available
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Utilization Metrics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Current Utilization</span>
                                            <span className="text-2xl font-bold">{utilizationRate}%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Active Meetings</span>
                                            <span className="text-lg font-semibold text-green-600">{activeBookings.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Total Bookings Today</span>
                                            <span className="text-lg font-semibold">{todayBookingsCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Available Rooms</span>
                                            <span className="text-lg font-semibold">{activeRooms - activeBookings.length}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default Dashboard;