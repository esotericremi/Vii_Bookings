import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Users, Clock, ExternalLink } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { bookingQueries } from '@/lib/queries';
import type { Room } from '@/types/room';
import type { BookingWithRelations } from '@/types/booking';

interface RoomDeletionDialogProps {
    children: React.ReactNode;
    room: Room;
    onConfirm: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
}

export const RoomDeletionDialog: React.FC<RoomDeletionDialogProps> = ({
    children,
    room,
    onConfirm,
    disabled = false,
    loading = false,
}) => {
    const [open, setOpen] = useState(false);
    const [futureBookings, setFutureBookings] = useState<BookingWithRelations[]>([]);
    const [checkingBookings, setCheckingBookings] = useState(false);
    const [bookingsError, setBookingsError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            checkFutureBookings();
        }
    }, [open, room.id]);

    const checkFutureBookings = async () => {
        setCheckingBookings(true);
        setBookingsError(null);

        try {
            const now = new Date().toISOString();
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            const bookings = await bookingQueries.getAll({
                roomId: room.id,
                startDate: now,
                endDate: futureDate.toISOString(),
                status: 'confirmed'
            });

            setFutureBookings(bookings || []);
        } catch (error) {
            console.error('Error checking future bookings:', error);
            setBookingsError('Failed to check future bookings. Please try again.');
        } finally {
            setCheckingBookings(false);
        }
    };

    const handleConfirm = async () => {
        if (futureBookings.length > 0) {
            return; // Prevent deletion if there are future bookings
        }

        try {
            await onConfirm();
            setOpen(false);
        } catch (error) {
            console.error('Error in confirm action:', error);
        }
    };

    const formatDateTime = (dateTime: string) => {
        return new Date(dateTime).toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDuration = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours === 0) {
            return `${minutes}m`;
        } else if (minutes === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${minutes}m`;
        }
    };

    const canDelete = futureBookings.length === 0 && !checkingBookings && !bookingsError;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild disabled={disabled}>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <AlertDialogTitle>Delete Room: {room.name}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left">
                        This action cannot be undone. The room and all its associated data will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    {/* Room Information */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Room Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Location:</span> {room.location}
                                </div>
                                <div>
                                    <span className="font-medium">Floor:</span> {room.floor}
                                </div>
                                <div>
                                    <span className="font-medium">Capacity:</span> {room.capacity} people
                                </div>
                                <div>
                                    <span className="font-medium">Status:</span>{' '}
                                    <Badge variant={room.is_active ? 'default' : 'secondary'}>
                                        {room.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                            {room.equipment && room.equipment.length > 0 && (
                                <div>
                                    <span className="font-medium">Equipment:</span>{' '}
                                    {room.equipment.join(', ')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Future Bookings Check */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Future Bookings Check
                            </CardTitle>
                            <CardDescription>
                                Checking for existing bookings that would be affected by this deletion.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {checkingBookings ? (
                                <div className="flex items-center justify-center py-4">
                                    <LoadingSpinner className="h-6 w-6 mr-2" />
                                    <span>Checking future bookings...</span>
                                </div>
                            ) : bookingsError ? (
                                <div className="text-center py-4">
                                    <p className="text-red-600 mb-2">{bookingsError}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={checkFutureBookings}
                                    >
                                        Retry Check
                                    </Button>
                                </div>
                            ) : futureBookings.length === 0 ? (
                                <div className="text-center py-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2">
                                        <Calendar className="h-6 w-6 text-green-600" />
                                    </div>
                                    <p className="text-green-600 font-medium">No future bookings found</p>
                                    <p className="text-sm text-muted-foreground">
                                        This room is safe to delete.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-center py-2">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-2">
                                            <AlertTriangle className="h-6 w-6 text-red-600" />
                                        </div>
                                        <p className="text-red-600 font-medium">
                                            {futureBookings.length} future booking{futureBookings.length !== 1 ? 's' : ''} found
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            These bookings must be cancelled or moved before deletion.
                                        </p>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {futureBookings.slice(0, 10).map((booking) => (
                                            <Card key={booking.id} className="border-l-4 border-l-red-500">
                                                <CardContent className="pt-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="font-medium">{booking.title}</h4>
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <Users className="h-4 w-4 mr-1" />
                                                                {booking.user?.full_name || 'Unknown User'}
                                                            </div>
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <Clock className="h-4 w-4 mr-1" />
                                                                {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                                                                <span className="ml-2 text-xs">
                                                                    ({getDuration(booking.start_time, booking.end_time)})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline">
                                                            {booking.status}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {futureBookings.length > 10 && (
                                            <p className="text-sm text-muted-foreground text-center">
                                                ... and {futureBookings.length - 10} more booking{futureBookings.length - 10 !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Warning Message */}
                    {!canDelete && !checkingBookings && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                    <h3 className="font-medium text-red-800">Cannot Delete Room</h3>
                                    <p className="text-sm text-red-700 mt-1">
                                        This room has future bookings and cannot be deleted. Please:
                                    </p>
                                    <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                                        <li>Cancel all future bookings, or</li>
                                        <li>Move bookings to another room, or</li>
                                        <li>Wait until all bookings are completed</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={!canDelete || loading}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner className="h-4 w-4 mr-2" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Room'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};