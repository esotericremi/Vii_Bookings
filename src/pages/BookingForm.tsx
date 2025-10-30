import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, Users, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';
import { useRoom } from '@/hooks/useRooms';
import { useCreateBooking } from '@/hooks/useBookings';
import { format, addMinutes, isAfter, parseISO } from 'date-fns';
import { toast } from 'sonner';

// Validation schema
const bookingSchema = z.object({
    title: z.string().min(1, "Meeting title is required").max(100, "Title must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    attendees: z.string().optional(),
}).refine((data) => {
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);
    return isAfter(endDateTime, startDateTime);
}, {
    message: "End time must be after start time",
    path: ["endTime"],
}).refine((data) => {
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const now = new Date();
    return isAfter(startDateTime, now);
}, {
    message: "Cannot book meetings in the past",
    path: ["date"],
});

type BookingFormData = z.infer<typeof bookingSchema>;

export const BookingForm: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    usePageTitle('Book Room - VII Bookings');

    // Get room ID from search params
    const roomId = searchParams.get('roomId');

    // Get room data
    const { data: room, isLoading: roomLoading, error: roomError } = useRoom(roomId || '');
    const createBooking = useCreateBooking();

    // Get initial values from URL params
    const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
    const initialStartTime = searchParams.get('startTime') || format(addMinutes(new Date(), 30), 'HH:mm');
    const initialEndTime = searchParams.get('endTime') || format(addMinutes(new Date(), 90), 'HH:mm');

    const form = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            title: '',
            description: '',
            date: initialDate,
            startTime: initialStartTime,
            endTime: initialEndTime,
            attendees: '',
        },
    });

    const handleSubmit = async (data: BookingFormData) => {
        if (!room || !user) return;

        setIsSubmitting(true);
        try {
            const startDateTime = new Date(`${data.date}T${data.startTime}`);
            const endDateTime = new Date(`${data.date}T${data.endTime}`);

            await createBooking.mutateAsync({
                room_id: room.id,
                title: data.title,
                description: data.description || '',
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                attendees: data.attendees ? data.attendees.split(',').map(email => email.trim()) : [],
                user_id: user.id,
                status: 'confirmed'
            });

            toast.success('Room booked successfully!', {
                description: `${room.name} has been reserved for ${data.title}`,
            });

            navigate('/my-bookings');
        } catch (error: any) {
            toast.error('Failed to book room', {
                description: error.message || 'Please try again later',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate('/rooms');
    };

    // Loading state
    if (roomLoading) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Rooms
                    </Button>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-64 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    // Error state
    if (roomError || !room) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Rooms
                    </Button>
                </div>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {roomError ? 'Failed to load room details.' : 'Room not found.'} Please select a different room.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Rooms
                </Button>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-foreground">Book a Room</h1>
                <p className="text-muted-foreground mt-1">
                    Reserve {room.name} for your meeting
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Room Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Room Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold">{room.name}</h3>
                            <p className="text-sm text-muted-foreground">{room.location}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Capacity: {room.capacity} people</span>
                        </div>

                        {room.equipment && room.equipment.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Equipment:</p>
                                <div className="flex flex-wrap gap-1">
                                    {room.equipment.map((item, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${room.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">{room.is_active ? 'Available' : 'Unavailable'}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Booking Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Meeting Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Meeting Title *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter meeting title" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Meeting agenda or notes (optional)"
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date *</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Time *</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Time *</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="attendees"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Attendees</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter email addresses separated by commas (optional)"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !room.is_active}
                                        className="flex-1"
                                    >
                                        {isSubmitting ? 'Booking...' : 'Book Room'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};