import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Grid, List, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { RoomCard } from '@/components/RoomCard';
import { RoomFilters } from '@/components/booking/RoomFilters';
import { AvailabilityTimeline } from '@/components/booking/AvailabilityTimeline';

import { useRoomsWithAvailability, useRoomsRealtime } from '@/hooks/useRooms';
import { useBookings, useBookingsRealtime } from '@/hooks/useBookings';
import { useGlobalRoomAvailability } from '@/hooks/useRealTimeAvailability';
import { CompactConnectionStatus } from '@/components/shared/ConnectionStatusIndicator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import type { RoomFilter } from '@/types/room';

export const RoomSelection = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    usePageTitle('Room Selection - VII Bookings');
    const [filters, setFilters] = useState<RoomFilter>({});
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { toast } = useToast();

    // Get rooms with availability and real-time updates
    const {
        data: rooms = [],
        isLoading: roomsLoading,
        error: roomsError,
        refetch: refetchRooms,
    } = useRoomsWithAvailability(filters, selectedDate.toISOString().split('T')[0]);

    // Enable real-time updates for rooms
    useRoomsRealtime(filters);

    // Enable global real-time room availability updates
    const { connectionStatus, lastUpdate, availabilityUpdates } = useGlobalRoomAvailability({
        onAvailabilityChange: (roomId, isAvailable, booking, room) => {
            // Show toast notification for availability changes
            if (booking) {
                toast({
                    title: isAvailable ? "Room Available" : "Room Booked",
                    description: `${room?.name || 'A room'} is now ${isAvailable ? 'available' : 'unavailable'}.`,
                    duration: 3000,
                });
            }
        }
    });

    // Get bookings for the selected date and room (for timeline view)
    const {
        data: bookings = [],
        isLoading: bookingsLoading,
        error: bookingsError,
        refetch: refetchBookings,
    } = useBookings({
        roomId: selectedRoomId || undefined,
        startDate: selectedDate.toISOString().split('T')[0],
        endDate: selectedDate.toISOString().split('T')[0],
    });

    // Enable real-time updates for bookings
    useBookingsRealtime({ roomId: selectedRoomId || undefined });

    // Handle manual refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([refetchRooms(), refetchBookings()]);
            toast({
                title: "Data refreshed",
                description: "Room availability has been updated.",
            });
        } catch (error) {
            toast({
                title: "Refresh failed",
                description: "Failed to refresh data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    // Filter rooms based on availability if needed
    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            // Add any additional client-side filtering here if needed
            return true;
        });
    }, [rooms]);

    // Handle errors
    useEffect(() => {
        if (bookingsError) {
            toast({
                title: "Booking data error",
                description: "Failed to load booking information. Some availability data may be inaccurate.",
                variant: "destructive",
            });
        }
    }, [bookingsError, toast]);

    const handleBookRoom = (roomId: string) => {
        // Navigate to booking form with pre-selected room and date
        const params = new URLSearchParams();
        params.set('roomId', roomId);
        params.set('date', selectedDate.toISOString().split('T')[0]);

        // Preserve any existing search params
        searchParams.forEach((value, key) => {
            if (key !== 'roomId' && key !== 'date') {
                params.set(key, value);
            }
        });

        navigate(`/book?${params.toString()}`);
    };

    const handleBookTimeSlot = (roomId: string, startTime: Date, endTime: Date) => {
        const params = new URLSearchParams();
        params.set('roomId', roomId);
        params.set('startTime', startTime.toISOString());
        params.set('endTime', endTime.toISOString());

        navigate(`/book?${params.toString()}`);
    };

    const selectedRoom = selectedRoomId ? rooms.find(room => room.id === selectedRoomId) : null;

    if (roomsError) {
        return (
            <div className="px-4 sm:px-6 lg:px-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load rooms. Please try again later.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Select a Room</h1>
                <p className="text-muted-foreground">
                    Find and book the perfect meeting room for your needs
                </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                {/* Filters Sidebar */}
                <div className="xl:w-80 flex-shrink-0">
                    <Card className="sticky top-4">
                        <CardContent className="pt-6">
                            <RoomFilters
                                filters={filters}
                                onFiltersChange={setFilters}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <Tabs defaultValue="rooms" className="w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <TabsList>
                                <TabsTrigger value="rooms">Room Selection</TabsTrigger>
                                <TabsTrigger value="timeline" disabled={!selectedRoomId}>
                                    Timeline View
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                {/* Date Picker */}
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <input
                                        type="date"
                                        value={selectedDate.toISOString().split('T')[0]}
                                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                        className="px-3 py-2 border rounded-md text-sm flex-1 sm:flex-none"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2">
                                    {/* Connection Status */}
                                    <CompactConnectionStatus />

                                    {/* Refresh Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>

                                    {/* View Mode Toggle */}
                                    <div className="flex items-center border rounded-md">
                                        <Button
                                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('grid')}
                                            className="rounded-r-none"
                                        >
                                            <Grid className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('list')}
                                            className="rounded-l-none"
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <TabsContent value="rooms" className="space-y-6">
                            {/* Results Summary with Real-time Info */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {roomsLoading ? (
                                        <span className="flex items-center gap-2">
                                            <LoadingSpinner size="sm" />
                                            Loading rooms...
                                        </span>
                                    ) : (
                                        `${filteredRooms.length} room${filteredRooms.length !== 1 ? 's' : ''} found`
                                    )}
                                </p>
                                {lastUpdate && connectionStatus === 'connected' && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                        <span>Live updates active</span>
                                        {availabilityUpdates.length > 0 && (
                                            <span>• {availabilityUpdates.length} recent changes</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Room Grid/List */}
                            {roomsLoading ? (
                                <div
                                    className={
                                        viewMode === 'grid'
                                            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                            : 'space-y-4'
                                    }
                                >
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <Card key={index} className="animate-pulse">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-5 w-32" />
                                                        <div className="flex items-center gap-4">
                                                            <Skeleton className="h-4 w-20" />
                                                            <Skeleton className="h-4 w-24" />
                                                        </div>
                                                    </div>
                                                    <Skeleton className="h-6 w-16" />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <Skeleton className="h-4 w-full" />
                                                <div className="flex flex-wrap gap-2">
                                                    <Skeleton className="h-6 w-16" />
                                                    <Skeleton className="h-6 w-20" />
                                                    <Skeleton className="h-6 w-14" />
                                                </div>
                                                <Skeleton className="h-10 w-full" />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : filteredRooms.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
                                        <p className="text-muted-foreground text-center">
                                            Try adjusting your filters or search criteria to find available rooms.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div
                                    className={
                                        viewMode === 'grid'
                                            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                            : 'space-y-4'
                                    }
                                >
                                    {filteredRooms.map((room) => (
                                        <div
                                            key={room.id}
                                            className={`${viewMode === 'list' ? 'cursor-pointer' : ''} ${selectedRoomId === room.id ? 'ring-2 ring-primary' : ''
                                                }`}
                                            onClick={viewMode === 'list' ? () => setSelectedRoomId(room.id) : undefined}
                                        >
                                            <RoomCard
                                                room={room}
                                                onBook={handleBookRoom}
                                                onSelect={() => setSelectedRoomId(room.id)}
                                                isSelected={selectedRoomId === room.id}
                                                showAvailability={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="timeline" className="space-y-6">
                            {selectedRoom ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">{selectedRoom.name}</h3>
                                            <p className="text-sm text-muted-foreground">{selectedRoom.location}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedRoomId(null)}
                                        >
                                            Clear Selection
                                        </Button>
                                    </div>

                                    {
                                        bookingsLoading ? (
                                            <Card>
                                                <CardHeader>
                                                    <Skeleton className="h-6 w-48" />
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {Array.from({ length: 8 }).map((_, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <Skeleton className="h-4 w-24" />
                                                                <Skeleton className="h-5 w-16" />
                                                            </div>
                                                            <Skeleton className="h-8 w-16" />
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        ) : bookingsError ? (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Failed to load booking timeline. Please try refreshing the page.
                                                </AlertDescription>
                                            </Alert>
                                        ) : (
                                            <AvailabilityTimeline
                                                roomId={selectedRoom.id}
                                                roomName={selectedRoom.name}
                                                date={selectedDate}
                                                bookings={bookings}
                                                onBookSlot={(startTime, endTime) =>
                                                    handleBookTimeSlot(selectedRoom.id, startTime, endTime)
                                                }
                                            />
                                        )
                                    }
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Select a room</h3>
                                        <p className="text-muted-foreground text-center">
                                            Choose a room from the list to view its availability timeline.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};