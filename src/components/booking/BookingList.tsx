import React, { useState } from "react";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { Calendar, Clock, Users, Edit, Trash2, Download, Filter, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookingWithRelations } from "@/types/booking";
import { useUserBookings, useCancelBooking } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LoadingSpinner, LoadingSkeleton } from "@/components/shared/LoadingSpinner";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";
import { useNetworkStatus } from "@/components/shared/NetworkStatusProvider";
import { useAsyncState } from "@/components/shared/AppStateProvider";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

interface BookingListProps {
    onEditBooking?: (booking: BookingWithRelations) => void;
    onExportCalendar?: (bookings: BookingWithRelations[]) => void;
}

export const BookingList = ({ onEditBooking, onExportCalendar }: BookingListProps) => {
    const { user } = useAuth();
    const { isOffline } = useNetworkStatus();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("all");
    const [sortBy, setSortBy] = useState<"date" | "title" | "room">("date");

    const { data: allBookings, isLoading, error, refetch } = useUserBookings(user?.id || "");
    const cancelBookingMutation = useCancelBooking();



    // Enhanced state management for cancel operations
    const cancelState = useAsyncState('cancel-booking');
    const exportState = useAsyncState('export-calendar');

    // Filter and sort bookings
    const filteredBookings = allBookings?.filter((booking) => {
        const now = new Date();
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);

        // Status filter
        let statusMatch = true;
        switch (statusFilter) {
            case "upcoming":
                statusMatch = isAfter(bookingStart, now) && booking.status === "confirmed";
                break;
            case "past":
                statusMatch = isBefore(bookingEnd, now);
                break;
            case "cancelled":
                statusMatch = booking.status === "cancelled";
                break;
            default:
                statusMatch = true;
        }

        // Search filter
        const searchMatch = !searchTerm ||
            booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.room?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.description?.toLowerCase().includes(searchTerm.toLowerCase());

        return statusMatch && searchMatch;
    }) || [];

    // Sort bookings
    const sortedBookings = [...filteredBookings].sort((a, b) => {
        switch (sortBy) {
            case "title":
                return a.title.localeCompare(b.title);
            case "room":
                return (a.room?.name || "").localeCompare(b.room?.name || "");
            case "date":
            default:
                return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        }
    });

    const handleCancelBooking = async (bookingId: string, bookingTitle: string) => {
        await cancelState.execute(
            () => cancelBookingMutation.mutateAsync(bookingId),
            {
                showSuccessToast: true,
                successMessage: `"${bookingTitle}" has been cancelled successfully`,
                showErrorToast: true,
            }
        );
    };

    const handleExportCalendar = async () => {
        await exportState.execute(
            async () => {
                if (onExportCalendar) {
                    onExportCalendar(sortedBookings);
                } else {
                    // Default export functionality
                    const calendarData = sortedBookings.map(booking => ({
                        title: booking.title,
                        start: booking.start_time,
                        end: booking.end_time,
                        location: booking.room?.name,
                        description: booking.description
                    }));

                    const icsContent = generateICSContent(calendarData);
                    downloadICSFile(icsContent, "my-bookings.ics");
                }
            },
            {
                showSuccessToast: true,
                successMessage: "Calendar exported successfully",
                showErrorToast: true,
            }
        );
    };

    const generateICSContent = (bookings: any[]) => {
        const icsHeader = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Meeting Room Booking//EN"
        ].join("\r\n");

        const icsFooter = "END:VCALENDAR";

        const events = bookings.map(booking => {
            const startDate = new Date(booking.start).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
            const endDate = new Date(booking.end).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

            return [
                "BEGIN:VEVENT",
                `DTSTART:${startDate}`,
                `DTEND:${endDate}`,
                `SUMMARY:${booking.title}`,
                `LOCATION:${booking.location || ""}`,
                `DESCRIPTION:${booking.description || ""}`,
                `UID:${booking.start}-${booking.title}@meetingroom.com`,
                "END:VEVENT"
            ].join("\r\n");
        }).join("\r\n");

        return [icsHeader, events, icsFooter].join("\r\n");
    };

    const downloadICSFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getBookingStatus = (booking: BookingWithRelations) => {
        if (booking.status === "cancelled") return "cancelled";

        const now = new Date();
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);

        if (isBefore(bookingEnd, now)) return "past";
        if (isAfter(bookingStart, now)) return "upcoming";
        return "ongoing";
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "upcoming": return "default";
            case "ongoing": return "secondary";
            case "past": return "outline";
            case "cancelled": return "destructive";
            default: return "outline";
        }
    };

    // Show empty state if loading takes too long (fallback)
    const [showFallback, setShowFallback] = React.useState(false);
    React.useEffect(() => {
        if (isLoading) {
            const fallbackTimer = setTimeout(() => {
                setShowFallback(true);
            }, 15000); // 15 seconds
            return () => clearTimeout(fallbackTimer);
        } else {
            setShowFallback(false);
        }
    }, [isLoading]);

    // Enhanced loading state
    if (isLoading && !showFallback) {
        return (
            <div className="w-full">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <LoadingSkeleton variant="text" lines={1} className="w-32" />
                        <LoadingSkeleton variant="button" />
                    </div>
                </div>
                <div className="space-y-6">
                    {/* Filter skeleton */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <LoadingSkeleton variant="text" lines={1} className="flex-1 h-10" />
                        <LoadingSkeleton variant="button" className="w-[180px]" />
                        <LoadingSkeleton variant="button" className="w-[140px]" />
                    </div>

                    {/* Booking cards skeleton */}
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <LoadingSkeleton variant="card" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Enhanced error state
    if (error) {
        return (
            <div className="w-full">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Error Loading Bookings
                    </h2>
                </div>
                <div>
                    <ErrorDisplay
                        error={error}
                        onRetry={refetch}
                        variant="card"
                        title="Failed to load bookings"
                        retryable={!isOffline}
                    />
                </div>
            </div >
        );
    }

    // Fallback state if loading takes too long
    if (showFallback) {
        return (
            <div className="w-full">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            My Bookings
                        </h2>
                    </div>
                </div>
                <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Loading taking longer than expected</h3>
                    <p className="text-muted-foreground mb-4">
                        This might be due to a slow connection or database issue.
                    </p>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            You currently have no bookings to display.
                        </p>
                        <Button onClick={() => window.location.href = '/rooms'} variant="outline">
                            Book a Room
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary level="component">
            <div className="w-full">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            My Bookings
                            {isOffline && (
                                <Badge variant="outline" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Offline
                                </Badge>
                            )}
                        </h2>
                        <div className="flex items-center gap-2">
                            {error && (
                                <Button
                                    onClick={() => refetch()}
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                    Retry
                                </Button>
                            )}
                            <Button
                                onClick={handleExportCalendar}
                                variant="outline"
                                size="sm"
                                disabled={exportState.isLoading || isOffline || !sortedBookings.length}
                            >
                                {exportState.isLoading ? (
                                    <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                Export Calendar
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Filters and Search */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search bookings..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Bookings</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="past">Past</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Sort by Date</SelectItem>
                                <SelectItem value="title">Sort by Title</SelectItem>
                                <SelectItem value="room">Sort by Room</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Booking Tabs */}
                    <Tabs value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="past">Past</TabsTrigger>
                            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                        </TabsList>

                        <TabsContent value={statusFilter} className="mt-6">
                            {sortedBookings.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No bookings found</p>
                                    {searchTerm && (
                                        <p className="text-sm mt-2">Try adjusting your search or filters</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sortedBookings.map((booking) => {
                                        const status = getBookingStatus(booking);
                                        const canEdit = status === "upcoming" && booking.status === "confirmed";
                                        const canCancel = status === "upcoming" && booking.status === "confirmed";

                                        return (
                                            <Card key={booking.id} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="font-semibold">{booking.title}</h3>
                                                                <Badge variant={getStatusBadgeVariant(status)}>
                                                                    {status}
                                                                </Badge>
                                                            </div>

                                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>
                                                                        {format(new Date(booking.start_time), "MMM dd, yyyy")}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4" />
                                                                    <span>
                                                                        {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <Users className="h-4 w-4" />
                                                                    <span>{booking.room?.name} (Floor {booking.room?.floor})</span>
                                                                </div>

                                                                {booking.description && (
                                                                    <p className="mt-2 text-sm">{booking.description}</p>
                                                                )}

                                                                {booking.attendees && booking.attendees.length > 0 && (
                                                                    <div className="mt-2">
                                                                        <span className="text-xs font-medium">Attendees: </span>
                                                                        <span className="text-xs">{booking.attendees.join(", ")}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 ml-4">
                                                            {canEdit && onEditBooking && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => onEditBooking(booking)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            {canCancel && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            disabled={cancelState.isLoading || isOffline}
                                                                        >
                                                                            {cancelState.isLoading ? (
                                                                                <LoadingSpinner size="sm" />
                                                                            ) : (
                                                                                <Trash2 className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to cancel "{booking.title}"? This action cannot be undone.
                                                                                {isOffline && (
                                                                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                                                                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                                                                                        You are currently offline. This action cannot be performed.
                                                                                    </div>
                                                                                )}
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleCancelBooking(booking.id, booking.title)}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                disabled={isOffline}
                                                                            >
                                                                                {isOffline ? 'Cannot Cancel (Offline)' : 'Cancel Booking'}
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </ErrorBoundary >
    );
};