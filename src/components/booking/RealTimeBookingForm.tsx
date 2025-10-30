import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { format, addMinutes, isAfter } from 'date-fns';

// Zod validation schema
const bookingFormSchema = z.object({
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
});

interface RealTimeBookingFormProps {
    roomId?: string;
    onSubmit?: (data: any) => void;
    onCancel?: () => void;
}

export const RealTimeBookingForm: React.FC<RealTimeBookingFormProps> = ({
    roomId,
    onSubmit,
    onCancel
}) => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        resolver: zodResolver(bookingFormSchema),
        defaultValues: {
            title: '',
            description: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            startTime: format(addMinutes(new Date(), 30), 'HH:mm'),
            endTime: format(addMinutes(new Date(), 90), 'HH:mm'),
            attendees: '',
        },
    });

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (onSubmit) {
                await onSubmit(data);
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Book a Room
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
                                    <FormLabel>Meeting Title</FormLabel>
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
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Meeting agenda or notes"
                                            className="resize-none"
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
                                        <FormLabel>Date</FormLabel>
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
                                        <FormLabel>Start Time</FormLabel>
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
                                        <FormLabel>End Time</FormLabel>
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
                                    <FormLabel>Attendees (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter email addresses separated by commas"
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
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? 'Booking...' : 'Book Room'}
                            </Button>
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};