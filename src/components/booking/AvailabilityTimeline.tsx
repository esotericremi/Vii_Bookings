import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BookingWithRelations } from '@/types/booking';

interface AvailabilityTimelineProps {
    roomId: string;
    roomName: string;
    date: Date;
    bookings: BookingWithRelations[];
    onBookSlot?: (startTime: Date, endTime: Date) => void;
    workingHours?: { start: number; end: number };
    slotDuration?: number; // in minutes
}

interface TimeSlot {
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    booking?: BookingWithRelations;
}

export const AvailabilityTimeline = ({
    roomId,
    roomName,
    date,
    bookings,
    onBookSlot,
    workingHours = { start: 8, end: 18 }, // 8 AM to 6 PM
    slotDuration = 60, // 1 hour slots
}: AvailabilityTimelineProps) => {
    const timeSlots = useMemo(() => {
        const slots: TimeSlot[] = [];
        const startHour = workingHours.start;
        const endHour = workingHours.end;

        // Create time slots for the day
        for (let hour = startHour; hour < endHour; hour += slotDuration / 60) {
            const startTime = new Date(date);
            startTime.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + slotDuration);

            // Check if this slot conflicts with any booking
            const conflictingBooking = bookings.find(booking => {
                const bookingStart = new Date(booking.start_time);
                const bookingEnd = new Date(booking.end_time);

                return (
                    (startTime >= bookingStart && startTime < bookingEnd) ||
                    (endTime > bookingStart && endTime <= bookingEnd) ||
                    (startTime <= bookingStart && endTime >= bookingEnd)
                );
            });

            slots.push({
                startTime,
                endTime,
                isAvailable: !conflictingBooking,
                booking: conflictingBooking,
            });
        }

        return slots;
    }, [date, bookings, workingHours, slotDuration]);

    const formatTime = (time: Date) => {
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isSlotInPast = (startTime: Date) => {
        return startTime < new Date();
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {roomName} - {date.toLocaleDateString()}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {timeSlots.map((slot, index) => {
                        const isPast = isSlotInPast(slot.startTime);
                        const canBook = slot.isAvailable && !isPast && onBookSlot;

                        return (
                            <div
                                key={index}
                                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-colors
                  ${slot.isAvailable && !isPast
                                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                        : slot.booking
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-gray-50 border-gray-200'
                                    }
                  ${isPast ? 'opacity-50' : ''}
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-medium">
                                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </div>

                                    <Badge
                                        variant={slot.isAvailable && !isPast ? 'default' : 'secondary'}
                                        className={`
                      ${slot.isAvailable && !isPast
                                                ? 'bg-green-500 hover:bg-green-600'
                                                : slot.booking
                                                    ? 'bg-red-500 hover:bg-red-600'
                                                    : 'bg-gray-500'
                                            }
                    `}
                                    >
                                        {isPast
                                            ? 'Past'
                                            : slot.isAvailable
                                                ? 'Available'
                                                : 'Booked'
                                        }
                                    </Badge>

                                    {slot.booking && (
                                        <div className="text-sm text-muted-foreground">
                                            {slot.booking.title}
                                            {slot.booking.user && (
                                                <span className="ml-1">
                                                    by {slot.booking.user.full_name}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {canBook && (
                                    <Button
                                        size="sm"
                                        onClick={() => onBookSlot(slot.startTime, slot.endTime)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Book
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {timeSlots.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No time slots available for this date
                    </div>
                )}
            </CardContent>
        </Card>
    );
};