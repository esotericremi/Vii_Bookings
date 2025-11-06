import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, Building2, ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';
import { useBookings } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/hooks/useAuth';
import { BookingWithRelations } from '@/types/booking';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface BookingsDashboardProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export const BookingsDashboard: React.FC<BookingsDashboardProps> = ({
  selectedDate = new Date(),
  onDateChange
}) => {
  const { userProfile } = useAuth();
  const [viewMode, setViewMode] = useState<'day' | 'list'>('day');
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const { data: allBookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useBookings();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();

  const isAdmin = userProfile?.role === 'admin';

  // Filter bookings for the selected date
  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);

  const filteredBookings = useMemo(() => {
    return allBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time);
      const isInDateRange = bookingDate >= dayStart && bookingDate <= dayEnd;

      if (!isInDateRange) return false;

      // Search filter
      const searchMatch = !searchTerm ||
        booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.room?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Room filter
      const roomMatch = roomFilter === 'all' || booking.room_id === roomFilter;

      // Only show confirmed bookings
      const statusMatch = booking.status === 'confirmed';

      // All users can see all confirmed bookings
      const visibilityMatch = true;

      return searchMatch && roomMatch && statusMatch && visibilityMatch;
    });
  }, [allBookings, dayStart, dayEnd, searchTerm, roomFilter, isAdmin, userProfile?.id]);

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    const newDate = addDays(currentDate, direction === 'prev' ? -1 : 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange?.(today);
  };

  const getBookingStatus = (booking: BookingWithRelations) => {
    const now = new Date();
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);

    if (start <= now && end >= now) return 'active';
    if (start > now) return 'upcoming';
    return 'past';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 border-green-500/50 text-green-700';
      case 'upcoming': return 'bg-blue-500/20 border-blue-500/50 text-blue-700';
      case 'past': return 'bg-gray-500/20 border-gray-500/50 text-gray-700';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-700';
    }
  };

  const renderDayView = () => {
    const activeRooms = rooms.filter(room => room.is_active);

    return (
      <div className="space-y-4">
        {activeRooms.map(room => {
          const roomBookings = filteredBookings.filter(booking => booking.room_id === room.id);

          return (
            <Card key={room.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {room.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {room.capacity}
                    <Badge variant="outline">Floor {room.floor}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {roomBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No meetings scheduled
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roomBookings.map(booking => {
                      const status = getBookingStatus(booking);
                      const start = new Date(booking.start_time);
                      const end = new Date(booking.end_time);
                      const isMyBooking = booking.user_id === userProfile?.id;

                      return (
                        <div
                          key={booking.id}
                          className={`p-3 rounded-lg border-l-4 ${getStatusColor(status)} transition-all hover:scale-[1.02] cursor-pointer`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{booking.title}</h4>
                              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="inline w-4 h-4" />
                                  {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                                </div>
                                {!isMyBooking && (
                                  <div className="flex items-center gap-2">
                                    <Users className="inline w-4 h-4" />
                                    Booked by {booking.user?.full_name || booking.user?.email?.split('@')[0] || 'Unknown User'}
                                  </div>
                                )}
                                {booking.description && (
                                  <p className="text-sm">{booking.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                                {status}
                              </Badge>
                              {isMyBooking && (
                                <Badge variant="outline" className="text-xs">
                                  Your Meeting
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {activeRooms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active rooms available</p>
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    const sortedBookings = [...filteredBookings].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    return (
      <div className="space-y-4">
        {sortedBookings.map(booking => {
          const status = getBookingStatus(booking);
          const start = new Date(booking.start_time);
          const end = new Date(booking.end_time);
          const isMyBooking = booking.user_id === userProfile?.id;

          return (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{booking.title}</h3>
                      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status}
                      </Badge>
                      {isMyBooking && (
                        <Badge variant="outline">Your Meeting</Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{booking.room?.name} (Floor {booking.room?.floor})</span>
                      </div>

                      {!isMyBooking && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Booked by {booking.user?.full_name || booking.user?.email?.split('@')[0] || 'Unknown User'}</span>
                        </div>
                      )}

                      {booking.description && (
                        <p className="mt-2 text-sm">{booking.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedBookings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bookings found for {format(currentDate, 'MMMM d, yyyy')}</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (bookingsLoading || roomsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Room Bookings</h2>
          <p className="text-muted-foreground">
            View all room bookings and their details
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchBookings()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Navigation and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDateNavigation('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday} className="min-w-48">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDateNavigation('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList>
            <TabsTrigger value="day" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Day View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings by title, room, or person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={roomFilter} onValueChange={setRoomFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Rooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            {rooms.filter(room => room.is_active).map(room => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {viewMode === 'day' ? renderDayView() : renderListView()}
      </div>
    </div>
  );
};