import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { Room } from "@/types/room";
import { BookingWithRelations } from "@/types/booking";

interface CalendarViewProps {
  rooms: Room[];
  bookings: BookingWithRelations[];
}

export const CalendarView = ({ rooms, bookings }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = viewMode === 'week' ? 7 : 1;
    setCurrentDate(prev => addDays(prev, direction === 'next' ? days : -days));
  };

  const getBookingsForRoomAndDay = (roomId: string, date: Date) => {
    return bookings.filter(booking =>
      booking.room_id === roomId &&
      isSameDay(new Date(booking.start_time), date) &&
      booking.status === 'confirmed'
    ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const getTimeSlotPosition = (startTime: Date, endTime: Date) => {
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    const top = ((startHour - 8) / 12) * 100;
    const height = ((endHour - startHour) / 12) * 100;
    return { top: `${Math.max(0, top)}%`, height: `${Math.min(100 - top, height)}%` };
  };

  const getDepartmentColor = (userEmail?: string) => {
    if (!userEmail) return 'bg-gray-500/20 border-gray-500/50 text-gray-700';

    const department = userEmail.split('@')[0].split('.')[0];
    const colors = {
      'engineering': 'bg-blue-500/20 border-blue-500/50 text-blue-700',
      'marketing': 'bg-green-500/20 border-green-500/50 text-green-700',
      'sales': 'bg-purple-500/20 border-purple-500/50 text-purple-700',
      'hr': 'bg-orange-500/20 border-orange-500/50 text-orange-700',
      'finance': 'bg-red-500/20 border-red-500/50 text-red-700',
    };
    return colors[department as keyof typeof colors] || 'bg-gray-500/20 border-gray-500/50 text-gray-700';
  };

  const renderWeekView = () => (
    <div className="grid grid-cols-8 gap-1 h-full">
      {/* Time column */}
      <div className="border-r border-border/50">
        <div className="h-16 border-b border-border/50 flex items-center justify-center text-sm font-medium">
          Time
        </div>
        {hours.map(hour => (
          <div key={hour} className="h-16 border-b border-border/50 flex items-center justify-center text-xs text-muted-foreground">
            {hour}:00
          </div>
        ))}
      </div>

      {/* Days columns */}
      {weekDays.map(day => (
        <div key={day.toISOString()} className="relative">
          <div className="h-16 border-b border-border/50 flex flex-col items-center justify-center bg-muted/30">
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
          </div>

          {/* Time slots */}
          <div className="relative" style={{ height: `${hours.length * 64}px` }}>
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-border/30" />
            ))}

            {/* Bookings for all rooms on this day */}
            {rooms.map((room, roomIndex) => {
              const dayBookings = getBookingsForRoomAndDay(room.id, day);
              return dayBookings.map((booking, bookingIndex) => {
                const position = getTimeSlotPosition(new Date(booking.start_time), new Date(booking.end_time));
                const leftOffset = (roomIndex * 2) % 20; // Stagger bookings

                return (
                  <div
                    key={`${booking.id}-${roomIndex}`}
                    className={`absolute rounded-md border-2 p-1 ${getDepartmentColor(booking.user?.email)} transition-all hover:scale-105 hover:z-10 cursor-pointer`}
                    style={{
                      ...position,
                      left: `${leftOffset}%`,
                      right: `${5 + (roomIndex * 2) % 15}%`,
                      minHeight: '24px',
                    }}
                  >
                    <div className="text-xs font-medium truncate">{booking.title}</div>
                    <div className="text-xs opacity-80 truncate">
                      <MapPin className="inline w-3 h-3 mr-1" />
                      {room.name}
                    </div>
                    <div className="text-xs opacity-70">
                      <Clock className="inline w-3 h-3 mr-1" />
                      {format(new Date(booking.start_time), 'HH:mm')}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDayView = () => (
    <div className="space-y-4">
      {rooms.map(room => {
        const dayBookings = getBookingsForRoomAndDay(room.id, currentDate);

        return (
          <Card key={room.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{room.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {room.capacity}
                  <Badge variant="outline">Floor {room.floor}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dayBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No meetings scheduled
                </div>
              ) : (
                <div className="space-y-2">
                  {dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      className={`p-3 rounded-lg border-l-4 ${getDepartmentColor(booking.user?.email)}`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{booking.title}</h4>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <Clock className="inline w-4 h-4 mr-1" />
                        {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <Users className="inline w-4 h-4 mr-1" />
                        {booking.user?.email?.split('@')[0] || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meeting Calendar</h2>
          <p className="text-muted-foreground">See all department meetings at a glance</p>
        </div>

        <div className="flex gap-2 items-center">
          <Select value={viewMode} onValueChange={(value: 'week' | 'day') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="day">Day View</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            className="min-w-32"
          >
            {viewMode === 'week'
              ? `Week of ${format(weekStart, 'MMM d')}`
              : format(currentDate, 'MMM d, yyyy')
            }
          </Button>

          <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium">Departments:</span>
          {['engineering', 'marketing', 'sales', 'hr', 'finance'].map(dept => (
            <div key={dept} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded border-2 ${getDepartmentColor(`${dept}@company.com`)}`} />
              <span className="text-xs capitalize">{dept}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-auto">
        <CardContent className="p-0">
          {viewMode === 'week' ? renderWeekView() : renderDayView()}
        </CardContent>
      </Card>
    </div>
  );
};