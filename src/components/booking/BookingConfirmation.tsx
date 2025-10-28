import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Calendar, Clock, Users, MapPin, Mail, ArrowRight, Home, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookingWithRelations } from "@/types/booking";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BookingConfirmationProps {
    booking: BookingWithRelations;
    onCreateAnother?: () => void;
    onViewBookings?: () => void;
    onGoHome?: () => void;
}

export const BookingConfirmation = ({
    booking,
    onCreateAnother,
    onViewBookings,
    onGoHome
}: BookingConfirmationProps) => {
    const navigate = useNavigate();
    const [showAnimation, setShowAnimation] = useState(false);

    // Trigger success animation
    useEffect(() => {
        const timer = setTimeout(() => setShowAnimation(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Show success toast
    useEffect(() => {
        toast.success("Booking confirmed successfully! 🎉", {
            description: `Your meeting "${booking.title}" has been booked.`,
            duration: 5000,
        });
    }, [booking.title]);

    const handleCreateAnother = () => {
        if (onCreateAnother) {
            onCreateAnother();
        } else {
            navigate('/rooms');
        }
    };

    const handleViewBookings = () => {
        if (onViewBookings) {
            onViewBookings();
        } else {
            navigate('/bookings');
        }
    };

    const handleGoHome = () => {
        if (onGoHome) {
            onGoHome();
        } else {
            navigate('/');
        }
    };

    const generateCalendarLink = () => {
        const startDate = new Date(booking.start_time);
        const endDate = new Date(booking.end_time);

        const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
        googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
        googleCalendarUrl.searchParams.set('text', booking.title);
        googleCalendarUrl.searchParams.set('dates',
            `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
        );
        googleCalendarUrl.searchParams.set('location', booking.room?.name || '');
        googleCalendarUrl.searchParams.set('details', booking.description || '');

        return googleCalendarUrl.toString();
    };

    const copyBookingDetails = async () => {
        const details = `
Meeting: ${booking.title}
Date: ${format(new Date(booking.start_time), "EEEE, MMMM dd, yyyy")}
Time: ${format(new Date(booking.start_time), "h:mm a")} - ${format(new Date(booking.end_time), "h:mm a")}
Room: ${booking.room?.name} (Floor ${booking.room?.floor})
${booking.description ? `Description: ${booking.description}` : ''}
${booking.attendees && booking.attendees.length > 0 ? `Attendees: ${booking.attendees.join(', ')}` : ''}
    `.trim();

        try {
            await navigator.clipboard.writeText(details);
            toast.success("Booking details copied to clipboard");
        } catch (error) {
            toast.error("Failed to copy booking details");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Success Animation */}
            <div className={`text-center transition-all duration-1000 ${showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                <div className="relative inline-block">
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
                    <div className="absolute inset-0 h-20 w-20 rounded-full bg-green-500/20 animate-ping" />
                </div>
                <h1 className="text-3xl font-bold text-green-700 mt-4 mb-2">
                    Booking Confirmed! 🎉
                </h1>
                <p className="text-muted-foreground">
                    Your meeting room has been successfully reserved
                </p>
            </div>

            {/* Booking Details Card */}
            <Card className={`transition-all duration-1000 delay-300 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <Calendar className="h-5 w-5" />
                        Booking Details
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Meeting Title */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">{booking.title}</h2>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Confirmed
                        </Badge>
                    </div>

                    <Separator />

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="font-medium">Date</p>
                                    <p className="text-muted-foreground">
                                        {format(new Date(booking.start_time), "EEEE, MMMM dd, yyyy")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="font-medium">Time</p>
                                    <p className="text-muted-foreground">
                                        {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="font-medium">Room</p>
                                    <p className="text-muted-foreground">
                                        {booking.room?.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Floor {booking.room?.floor} • Capacity: {booking.room?.capacity} people
                                    </p>
                                </div>
                            </div>

                            {booking.attendees && booking.attendees.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Attendees</p>
                                        <p className="text-muted-foreground text-sm">
                                            {booking.attendees.join(", ")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {booking.description && (
                        <>
                            <Separator />
                            <div>
                                <p className="font-medium mb-2">Description</p>
                                <p className="text-muted-foreground">{booking.description}</p>
                            </div>
                        </>
                    )}

                    {/* Room Amenities */}
                    {booking.room?.equipment && booking.room.equipment.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <p className="font-medium mb-3">Room Amenities</p>
                                <div className="flex flex-wrap gap-2">
                                    {booking.room.equipment.map((amenity) => (
                                        <Badge key={amenity} variant="outline" className="text-xs">
                                            {amenity}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className={`transition-all duration-1000 delay-500 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Quick Actions</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            onClick={() => window.open(generateCalendarLink(), '_blank')}
                            variant="outline"
                            className="justify-start"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Add to Google Calendar
                        </Button>

                        <Button
                            onClick={copyBookingDetails}
                            variant="outline"
                            className="justify-start"
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Copy Details
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Options */}
            <Card className={`transition-all duration-1000 delay-700 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">What's Next?</h3>

                    <div className="space-y-3">
                        <Button
                            onClick={handleCreateAnother}
                            className="w-full justify-between bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <div className="flex items-center">
                                <Plus className="h-4 w-4 mr-2" />
                                Book Another Room
                            </div>
                            <ArrowRight className="h-4 w-4" />
                        </Button>

                        <Button
                            onClick={handleViewBookings}
                            variant="outline"
                            className="w-full justify-between"
                        >
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                View My Bookings
                            </div>
                            <ArrowRight className="h-4 w-4" />
                        </Button>

                        <Button
                            onClick={handleGoHome}
                            variant="ghost"
                            className="w-full justify-between"
                        >
                            <div className="flex items-center">
                                <Home className="h-4 w-4 mr-2" />
                                Back to Home
                            </div>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Booking ID for Reference */}
            <div className={`text-center text-sm text-muted-foreground transition-all duration-1000 delay-1000 ${showAnimation ? 'opacity-100' : 'opacity-0'}`}>
                <p>Booking ID: <code className="bg-muted px-2 py-1 rounded text-xs">{booking.id}</code></p>
                <p className="mt-1">Keep this ID for your records</p>
            </div>
        </div>
    );
};