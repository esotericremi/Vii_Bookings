import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Calendar, Clock, Users, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Room } from "@/types/room";
import { BookingFormData } from "@/types/booking";
import { useBookingConflicts } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { format, addMinutes, isAfter, addDays } from "date-fns";

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

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  room: Room;
  onSubmit: (bookingData: BookingFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialStartTime?: string;
  initialEndTime?: string;
}

export const BookingForm = ({ room, onSubmit, onCancel, isSubmitting = false, initialStartTime, initialEndTime }: BookingFormProps) => {
  const [conflictCheckEnabled, setConflictCheckEnabled] = useState(false);

  // Parse initial times if provided
  const getInitialValues = () => {
    let date = format(new Date(), "yyyy-MM-dd");
    let startTime = "09:00";
    let endTime = "10:00";

    if (initialStartTime) {
      const startDate = new Date(initialStartTime);
      date = format(startDate, "yyyy-MM-dd");
      startTime = format(startDate, "HH:mm");
    }

    if (initialEndTime) {
      const endDate = new Date(initialEndTime);
      endTime = format(endDate, "HH:mm");
    }

    return { date, startTime, endTime };
  };

  const initialValues = getInitialValues();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: initialValues.date,
      startTime: initialValues.startTime,
      endTime: initialValues.endTime,
      attendees: "",
    },
  });

  const watchedValues = form.watch();
  const { date, startTime, endTime } = watchedValues;

  // Real-time conflict detection
  const startDateTime = date && startTime ? `${date}T${startTime}:00` : "";
  const endDateTime = date && endTime ? `${date}T${endTime}:00` : "";

  const { data: conflicts, isLoading: isCheckingConflicts } = useBookingConflicts(
    room.id,
    startDateTime,
    endDateTime,
    undefined
  );

  const hasConflicts = conflicts && conflicts.length > 0;

  // Enable conflict checking after initial render to avoid unnecessary API calls
  useEffect(() => {
    const timer = setTimeout(() => setConflictCheckEnabled(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Generate time slots (8 AM to 6 PM in 30-minute intervals)
  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = i % 2 === 0 ? "00" : "30";
    const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;
    const displayTime = format(new Date(`2000-01-01T${timeValue}`), "h:mm a");
    return { value: timeValue, label: displayTime };
  });

  // Find next available slot if there's a conflict
  const findNextAvailableSlot = () => {
    if (!hasConflicts || !date) return null;

    const selectedDate = new Date(`${date}T00:00:00`);
    const currentStart = new Date(`${date}T${startTime}:00`);
    const duration = endTime && startTime ?
      (new Date(`${date}T${endTime}:00`).getTime() - new Date(`${date}T${startTime}:00`).getTime()) / (1000 * 60) : 60;

    // Try to find a slot later in the same day
    for (let i = 0; i < timeSlots.length - 1; i++) {
      const slotStart = new Date(`${date}T${timeSlots[i].value}:00`);
      const slotEnd = addMinutes(slotStart, duration);

      if (isAfter(slotStart, currentStart) && slotEnd.getHours() < 18) {
        return {
          startTime: timeSlots[i].value,
          endTime: format(slotEnd, "HH:mm"),
          date: date
        };
      }
    }

    // Try next day
    const nextDay = addDays(selectedDate, 1);
    return {
      startTime: "09:00",
      endTime: format(addMinutes(new Date(`${format(nextDay, "yyyy-MM-dd")}T09:00:00`), duration), "HH:mm"),
      date: format(nextDay, "yyyy-MM-dd")
    };
  };

  const handleFormSubmit = (values: BookingFormValues) => {
    if (hasConflicts && conflictCheckEnabled) {
      return; // Prevent submission if there are conflicts
    }

    const attendeesList = values.attendees
      ? values.attendees.split(',').map(email => email.trim()).filter(Boolean)
      : [];

    const bookingData: BookingFormData = {
      room_id: room.id,
      title: values.title,
      description: values.description || "",
      start_time: `${values.date}T${values.startTime}:00`,
      end_time: `${values.date}T${values.endTime}:00`,
      attendees: attendeesList,
    };

    onSubmit(bookingData);
  };

  const applyNextAvailableSlot = () => {
    const nextSlot = findNextAvailableSlot();
    if (nextSlot) {
      form.setValue("date", nextSlot.date);
      form.setValue("startTime", nextSlot.startTime);
      form.setValue("endTime", nextSlot.endTime);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto animate-scale-in">
      <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book {room.name}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm opacity-90">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{room.capacity} people</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Floor {room.floor}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Conflict Detection Alert */}
            {conflictCheckEnabled && hasConflicts && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>This time slot conflicts with an existing booking.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyNextAvailableSlot}
                    className="ml-2"
                  >
                    Find Next Available
                  </Button>
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

            <div className="bg-secondary/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Room Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {room.equipment?.map((amenity) => (
                  <Badge key={amenity} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>

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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-success hover:shadow-lg transition-all duration-200"
                disabled={isSubmitting || (conflictCheckEnabled && hasConflicts) || isCheckingConflicts}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Book Room 🚀
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};