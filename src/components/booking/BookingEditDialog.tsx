import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { format, addDays, isAfter } from "date-fns";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingWithRelations } from "@/types/booking";
import { useBookingConflicts, useUpdateBooking } from "@/hooks/useBookings";
import { toast } from "sonner";

// Zod validation schema (same as BookingForm)
const bookingEditSchema = z.object({
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
}).refine((data) => {
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);
    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    return durationMinutes >= 15 && durationMinutes <= 480; // 15 minutes to 8 hours
}, {
    message: "Meeting duration must be between 15 minutes and 8 hours",
    path: ["endTime"],
});

type BookingEditValues = z.infer<typeof bookingEditSchema>;

interface BookingEditDialogProps {
    booking: BookingWithRelations | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export const BookingEditDialog = ({ booking, open, onOpenChange, onSuccess }: BookingEditDialogProps) => {
    const [conflictCheckEnabled, setConflictCheckEnabled] = useState(false);
    const updateBookingMutation = useUpdateBooking();

    const form = useForm<BookingEditValues>({
        resolver: zodResolver(bookingEditSchema),
        defaultValues: {
            title: "",
            description: "",
            date: format(new Date(), "yyyy-MM-dd"),
            startTime: "09:00",
            endTime: "10:00",
            attendees: "",
        },
    });

    // Reset form when booking changes
    useEffect(() => {
        if (booking) {
            const startDate = new Date(booking.start_time);
            const endDate = new Date(booking.end_time);

            form.reset({
                title: booking.title,
                description: booking.description || "",
                date: format(startDate, "yyyy-MM-dd"),
                startTime: format(startDate, "HH:mm"),
                endTime: format(endDate, "HH:mm"),
                attendees: booking.attendees?.join(", ") || "",
            });
        }
    }, [booking, form]);

    const watchedValues = form.watch();
    const { date, startTime, endTime } = watchedValues;

    // Real-time conflict detection
    const startDateTime = date && startTime ? `${date}T${startTime}:00` : "";
    const endDateTime = date && endTime ? `${date}T${endTime}:00` : "";

    const { data: conflicts, isLoading: isCheckingConflicts } = useBookingConflicts(
        booking?.room_id || "",
        startDateTime,
        endDateTime,
        booking?.id // Exclude current booking from conflict check
    );

    const hasConflicts = conflicts && conflicts.length > 0;

    // Enable conflict checking after initial render
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => setConflictCheckEnabled(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setConflictCheckEnabled(false);
        }
    }, [open]);

    // Generate time slots (8 AM to 6 PM in 30-minute intervals)
    const timeSlots = Array.from({ length: 20 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8;
        const minute = i % 2 === 0 ? "00" : "30";
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;
        const displayTime = format(new Date(`2000-01-01T${timeValue}`), "h:mm a");
        return { value: timeValue, label: displayTime };
    });

    const handleFormSubmit = async (values: BookingEditValues) => {
        if (!booking) return;

        if (hasConflicts && conflictCheckEnabled) {
            toast.error("Cannot update booking due to conflicts");
            return;
        }

        try {
            const attendeesList = values.attendees
                ? values.attendees.split(',').map(email => email.trim()).filter(Boolean)
                : [];

            await updateBookingMutation.mutateAsync({
                id: booking.id,
                updates: {
                    title: values.title,
                    description: values.description || "",
                    start_time: `${values.date}T${values.startTime}:00`,
                    end_time: `${values.date}T${values.endTime}:00`,
                    attendees: attendeesList,
                }
            });

            toast.success("Booking updated successfully");
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error("Failed to update booking");
        }
    };

    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Edit Booking - {booking.room?.name}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        {/* Conflict Detection Alert */}
                        {conflictCheckEnabled && hasConflicts && (
                            <Alert className="border-destructive bg-destructive/10">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    This time slot conflicts with an existing booking.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Success indicator when no conflicts */}
                        {conflictCheckEnabled && !hasConflicts && !isCheckingConflicts && startDateTime && endDateTime && (
                            <Alert className="border-green-500 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">
                                    Time slot is available!
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Title *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Team standup, Client presentation..."
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
                                            <Input
                                                type="date"
                                                min={format(new Date(), "yyyy-MM-dd")}
                                                max={format(addDays(new Date(), 90), "yyyy-MM-dd")}
                                                {...field}
                                            />
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
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select start time" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {timeSlots.map((slot) => (
                                                    <SelectItem key={slot.value} value={slot.value}>
                                                        {slot.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select end time" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {timeSlots.map((slot) => (
                                                    <SelectItem key={slot.value} value={slot.value}>
                                                        {slot.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                    <FormLabel>Expected Attendees (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="john@company.com, jane@company.com..."
                                            {...field}
                                        />
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
                                            placeholder="Agenda, special requirements..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Conflict details */}
                        {conflictCheckEnabled && hasConflicts && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="font-medium text-red-800 mb-2">Conflicting Bookings:</h4>
                                <div className="space-y-2">
                                    {conflicts.map((conflict) => (
                                        <div key={conflict.id} className="text-sm text-red-700">
                                            <strong>{conflict.title}</strong> - {format(new Date(conflict.start_time), "h:mm a")} to {format(new Date(conflict.end_time), "h:mm a")}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={updateBookingMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateBookingMutation.isPending || (conflictCheckEnabled && hasConflicts) || isCheckingConflicts}
                            >
                                {updateBookingMutation.isPending ? (
                                    <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Booking"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};