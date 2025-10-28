import React, { useState, useMemo } from 'react';
import { Calendar, Grid, List, Clock, Users, MapPin, Plus, Filter, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, addDays, startOfWeek, isSameDay, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { BookingForm } from '@/components/BookingForm';
import { useRoomsWithAvailability } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import type { Room } from '@/types/room';
import type { BookingWithRelations } from '@/types/booking';

interface TimeSlot {
    time: string;
    hour: number;
    available: boolean;
    booking?: BookingWithRelations;
}

interface DashboardFilters {
    search: string;
    capacity: string;
    floor: string;
    equipment: string;
    dateRange: string;
}

const Dashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null);
    const [showBookingDialog, setShowBookingDialog] = useState(false);

    const [filters, setFilters] = useState<DashboardFilters>({
        search: '',
        capacity: 'all',
        floor: 'all',
        equipment: 'all',
        dateRange: 'today'
    });

    // Get date range based on filter
    const dateRange = useMemo(() => {
        const today = new Date();
        switch (filters.dateRange) {
            case 'today':
                return { start: startOfDay(today), end: endOfDay(today) };
            case 'tomorrow':
                const tomorrow = addDays(today, 1);
                return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
            case 'week':
                const weekStart = startOfWeek(today, { weekStartsOn: 1 });
                return { start: weekStart, end: addDays(weekStart, 6) };
            default:
                return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
        }
    }, [filters.dateRange, selectedDate]);

    // Fetch rooms with availability
    const roomFilters = useMemo(() => ({
        search: filters.search,
        capacity_min: filters.capacity === 'small' ? 1 : filters.capacity === 'medium' ? 7 : filters.capacity === 'large' ? 13 : undefined,
        capacity_max: filters.capacity === 'small' ? 6 : filters.capacity === 'medium' ? 12 : undefined,
        floor: filters.floor !== 'all' ? filters.floor : undefined,
        equipment: filters.equipment !== 'all' ? [filters.equipment] : undefined,
        is_active: true
    }), [filters]);

    const { data: rooms = [], isLoading: roomsLoading, refetch: refetchRooms } = useRoomsWithAvailability(
        roomFilters,
        format(selectedDate, 'yyyy-MM-dd')
    );

    // Fetch bookings for the date range
    const { data: bookings = [], isLoading: bookingsLoading } = useBookings({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
    });

    // Generate time slots for the day (8 AM to 8 PM)
    const timeSlots = useMemo(() => {
        const slots: TimeSlot[] = [];
        for (let hour = 8; hour <= 20; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            slots.push({
                time,
                hour,
                available: true,
                booking: undefined
            });
        }
        return slots;
    }, []);

    // Get bookings for a specific room and date
    const getRoomBookings = (roomId: string, date: Date) => {
        return bookings.filter(booking =>
            booking.room_id === roomId &&
            isSameDay(new Date(booking.start_time), date) &&
            booking.status === 'confirmed'
        ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    };

    // Check if a time slot is available for a room
    const isTimeSlotAvailable = (roomId: string, date: Date, hour: number) => {
        const roomBookings = getRoomBookings(roomId, date);
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        return !roomBookings.some(booking => {
            const bookingStart = new Date(booking.start_time);
            const bookingEnd = new Date(booking.end_time);
            return (
                (bookingStart <= slotStart && bookingEnd > slotStart) ||
                (bookingStart < slotEnd && bookingEnd >= slotEnd) ||
                (bookingStart >= slotStart && bookingEnd <= slotEnd)
            );
        });
    };

    // Handle booking creation from available slot
    const handleSlotClick = (room: Room, hour: number) => {
        if (!isTimeSlotAvailable(room.id, selectedDate, hour)) return;

        const startTime = new Date(selectedDate);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(selectedDate);
        endTime.setHours(hour + 1, 0, 0, 0);

        setSelectedRoom(room);
        setSelectedTimeSlot({
            start: startTime.toISOString(),
            end: endTime.toISOString()
        });
        setShowBookingDialog(true);
    };

    // Handle date navigation
    const navigateDate = (direction: 'prev' | 'next') => {
        const days = filters.dateRange === 'week' ? 7 : 1;
        setSelectedDate(prev => addDays(prev, direction === 'next' ? days : -days));
    };

    // Handle booking form submission
    const handleBookingSubmit = async (bookingData: any) => {
        // This would typically call the booking mutation
        console.log('Booking submitted:', bookingData);
        setShowBookingDialog(false);
        setSelectedRoom(null);
        setSelectedTimeSlot(null);
        // Refetch data to update availability
        refetchRooms();
    };

    // Render calendar view
    const renderCalendarView = () => (
        <div className="space-y-4">
            {/* Date Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setSelectedDate(new Date())}
                        className="min-w-40"
                    >
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="outline" size="icon" onClick={() => refetchRooms()}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(200px,1fr))] gap-1 min-w-max">
                            {/* Time column header */}
                            <div className="p-4 border-b border-r font-medium bg-muted/30">
                                Time
                            </div>

                            {/* Room headers */}
                            {rooms.map(room => (
                                <div key={room.id} className="p-4 border-b border-r bg-muted/30">
                                    <div className="font-medium truncate">{room.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {room.capacity}
                                        <MapPin className="w-3 h-3 ml-2" />
                                        Floor {room.floor}
                                    </div>
                                </div>
                            ))}

                            {/* Time slots */}
                            {timeSlots.map(slot => (
                                <React.Fragment key={slot.time}>
                                    {/* Time label */}
                                    <div className="p-4 border-b border-r text-sm text-muted-foreground bg-muted/10">
                                        {slot.time}
                                    </div>

                                    {/* Room slots */}
                                    {rooms.map(room => {
                                        const isAvailable = isTimeSlotAvailable(room.id, selectedDate, slot.hour);
                                        const roomBookings = getRoomBookings(room.id, selectedDate);
                                        const slotBooking = roomBookings.find(booking => {
                                            const bookingStart = new Date(booking.start_time);
                                            const bookingEnd = new Date(booking.end_time);
                                            const slotStart = new Date(selectedDate);
                                            slotStart.setHours(slot.hour, 0, 0, 0);
                                            const slotEnd = new Date(selectedDate);
                                            slotEnd.setHours(slot.hour + 1, 0, 0, 0);

                                            return bookingStart <= slotStart && bookingEnd > slotStart;
                                        });

                                        return (
                                            <div
                                                key={`${room.id}-${slot.time}`}
                                                className={`
                          p-2 border-b border-r min-h-16 cursor-pointer transition-colors
                          ${isAvailable
                                                        ? 'bg-green-50 hover:bg-green-100 border-green-200'
                                                        : 'bg-red-50 border-red-200'
                                                    }
                        `}
                                                onClick={() => isAvailable && handleSlotClick(room, slot.hour)}
                                            >
                                                {slotBooking ? (
                                                    <div className="text-xs">
                                                        <div className="font-medium truncate text-red-700">
                                                            {slotBooking.title}
                                                        </div>
                                                        <div className="text-red-600">
                                                            {format(new Date(slotBooking.start_time), 'HH:mm')} -
                                                            {format(new Date(slotBooking.end_time), 'HH:mm')}
                                                        </div>
                                                    </div>
                                                ) : isAvailable ? (
                                                    <div className="text-xs text-green-700 font-medium">
                                                        Available
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-red-600">
                                                        Unavailable
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // Render list view
    const renderListView = () => (
        <div className="space-y-4">
            {rooms.map(room => {
                const roomBookings = getRoomBookings(room.id, selectedDate);
                const availableSlots = timeSlots.filter(slot =>
                    isTimeSlotAvailable(room.id, selectedDate, slot.hour)
                );

                return (
                    <Card key={room.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {room.name}
                                        <Badge variant={room.is_available ? 'default' : 'secondary'}>
                                            {room.is_available ? 'Available' : 'Busy'}
                                        </Badge>
                                    </CardTitle>
                                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {room.capacity} people
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {room.location}, Floor {room.floor}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setSelectedRoom(room);
                                        setShowBookingDialog(true);
                                    }}
                                    disabled={availableSlots.length === 0}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Book Room
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Current bookings */}
                            {roomBookings.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">Today's Bookings</h4>
                                    <div className="space-y-2">
                                        {roomBookings.map(booking => (
                                            <div
                                                key={booking.id}
                                                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                                            >
                                                <div>
                                                    <div className="font-medium text-red-900">{booking.title}</div>
                                                    <div className="text-sm text-red-700">
                                                        <Clock className="w-4 h-4 inline mr-1" />
                                                        {format(new Date(booking.start_time), 'HH:mm')} -
                                                        {format(new Date(booking.end_time), 'HH:mm')}
                                                    </div>
                                                </div>
                                                <Badge variant="destructive">Booked</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available time slots */}
                            {availableSlots.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Available Time Slots</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSlots.map(slot => (
                                            <Button
                                                key={slot.time}
                                                variant="outline"
                                                size="sm"
                                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                                onClick={() => handleSlotClick(room, slot.hour)}
                                            >
                                                {slot.time}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {availableSlots.length === 0 && roomBookings.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                    No availability information
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    if (roomsLoading || bookingsLoading) {
        return (
            <Layout activeView="dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                        <p>Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout activeView="dashboard">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
                        <p className="text-muted-foreground">
                            View room availability and book meeting spaces
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Tabs value={viewMode} onValueChange={(value: 'calendar' | 'list') => setViewMode(value)}>
                            <TabsList>
                                <TabsTrigger value="calendar" className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Calendar
                                </TabsTrigger>
                                <TabsTrigger value="list" className="flex items-center gap-2">
                                    <List className="w-4 h-4" />
                                    List
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search rooms..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="pl-10"
                                />
                            </div>

                            <Select
                                value={filters.capacity}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, capacity: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Capacity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sizes</SelectItem>
                                    <SelectItem value="small">1-6 people</SelectItem>
                                    <SelectItem value="medium">7-12 people</SelectItem>
                                    <SelectItem value="large">13+ people</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.floor}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, floor: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Floor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Floors</SelectItem>
                                    <SelectItem value="1">Floor 1</SelectItem>
                                    <SelectItem value="2">Floor 2</SelectItem>
                                    <SelectItem value="3">Floor 3</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.equipment}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, equipment: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Equipment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Equipment</SelectItem>
                                    <SelectItem value="Projector">Projector</SelectItem>
                                    <SelectItem value="Whiteboard">Whiteboard</SelectItem>
                                    <SelectItem value="Video Call">Video Call</SelectItem>
                                    <SelectItem value="WiFi">WiFi</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.dateRange}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Content */}
                {viewMode === 'calendar' ? renderCalendarView() : renderListView()}

                {/* Booking Dialog */}
                <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                Book {selectedRoom?.name}
                            </DialogTitle>
                        </DialogHeader>
                        {selectedRoom && (
                            <BookingForm
                                room={selectedRoom}
                                initialStartTime={selectedTimeSlot?.start}
                                initialEndTime={selectedTimeSlot?.end}
                                onSubmit={handleBookingSubmit}
                                onCancel={() => setShowBookingDialog(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
};

export default Dashboard;