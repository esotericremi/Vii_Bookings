import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Grid, List, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoomCard } from '@/components/RoomCard';
import { RoomFilters } from '@/components/booking/RoomFilters';
import { AvailabilityTimeline } from '@/components/booking/AvailabilityTimeline';
import { useRoomsWithAvailability } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { RoomFilter } from '@/types/room';

export const RoomSelection = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState<RoomFilter>({});
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    // Get rooms with availability
    const {
        data: rooms = [],
        isLoading: roomsLoading,
        error: roomsError,
    } = useRoomsWithAvailability(filters, selectedDate.toISOString().split('T')[0]);

    // Get bookings for the selected date and room (for timeline view)
    const {
        data: bookings = [],
        isLoading: bookingsLoading,
    } = useBookings({
        roomId: selectedRoomId || undefined,
        startDate: selectedDate.toISOString().split('T')[0],
        endDate: selectedDate.toISOString().split('T')[0],
    });

    // Filter rooms based on availability if needed
    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            // Add any additional client-side filtering here if needed
            return true;
        });
    }, [rooms]);

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
            <div className="container mx-auto px-4 py-8">
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
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Select a Room</h1>
                <p className="text-muted-foreground">
                    Find and book the perfect meeting room for your needs
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                    <RoomFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        className="sticky top-4"
                    />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="rooms" className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <TabsList>
                                <TabsTrigger value="rooms">Room Selection</TabsTrigger>
                                <TabsTrigger value="timeline" disabled={!selectedRoomId}>
                                    Timeline View
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                {/* Date Picker */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <input
                                        type="date"
                                        value={selectedDate.toISOString().split('T')[0]}
                                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                        className="px-3 py-2 border rounded-md text-sm"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

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

                        <TabsContent value="rooms" className="space-y-6">
                            {/* Results Summary */}
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
                            </div>

                            {/* Room Grid/List */}
                            {roomsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <LoadingSpinner size="lg" />
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
                                            className={viewMode === 'list' ? 'cursor-pointer' : ''}
                                            onClick={viewMode === 'list' ? () => setSelectedRoomId(room.id) : undefined}
                                        >
                                            <RoomCard
                                                room={room}
                                                onBook={handleBookRoom}
                                                showAvailability={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="timeline" className="space-y-6">
                            {selectedRoom && (
                                <AvailabilityTimeline
                                    roomId={selectedRoom.id}
                                    roomName={selectedRoom.name}
                                    date={selectedDate}
                                    bookings={bookings}
                                    onBookSlot={(startTime, endTime) =>
                                        handleBookTimeSlot(selectedRoom.id, startTime, endTime)
                                    }
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};