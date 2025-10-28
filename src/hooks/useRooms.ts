import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { roomQueries, bookingQueries } from '@/lib/queries';
import type { Room, RoomFilter, RoomWithAvailability } from '@/types/room';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Query keys
export const roomKeys = {
    all: ['rooms'] as const,
    lists: () => [...roomKeys.all, 'list'] as const,
    list: (filters: RoomFilter) => [...roomKeys.lists(), { filters }] as const,
    details: () => [...roomKeys.all, 'detail'] as const,
    detail: (id: string) => [...roomKeys.details(), id] as const,
    availability: (id: string, date: string) => [...roomKeys.all, 'availability', id, date] as const,
    filters: () => [...roomKeys.all, 'filters'] as const,
};

// Hook to get all rooms with filtering
export const useRooms = (filters: RoomFilter = {}) => {
    return useQuery({
        queryKey: roomKeys.list(filters),
        queryFn: () => roomQueries.getFiltered(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Hook to get a single room
export const useRoom = (id: string) => {
    return useQuery({
        queryKey: roomKeys.detail(id),
        queryFn: () => roomQueries.getById(id),
        enabled: !!id,
    });
};

// Hook to get rooms with real-time availability
export const useRoomsWithAvailability = (filters: RoomFilter = {}, selectedDate?: string) => {
    const { data: rooms, ...roomQuery } = useRooms(filters);
    const [roomsWithAvailability, setRoomsWithAvailability] = useState<RoomWithAvailability[]>([]);

    useEffect(() => {
        if (!rooms || !selectedDate) {
            setRoomsWithAvailability(rooms?.map(room => ({ ...room, is_available: true })) || []);
            return;
        }

        const checkAvailability = async () => {
            const roomsWithStatus = await Promise.all(
                rooms.map(async (room) => {
                    try {
                        // Get current bookings for the room on the selected date
                        const startOfDay = new Date(selectedDate);
                        startOfDay.setHours(0, 0, 0, 0);
                        const endOfDay = new Date(selectedDate);
                        endOfDay.setHours(23, 59, 59, 999);

                        const bookings = await bookingQueries.getByDateRange(
                            startOfDay.toISOString(),
                            endOfDay.toISOString(),
                            room.id
                        );

                        const now = new Date();
                        const currentBooking = bookings.find(booking => {
                            const start = new Date(booking.start_time);
                            const end = new Date(booking.end_time);
                            return now >= start && now <= end;
                        });

                        const nextBooking = bookings
                            .filter(booking => new Date(booking.start_time) > now)
                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

                        return {
                            ...room,
                            is_available: !currentBooking,
                            current_booking: currentBooking,
                            next_available_time: currentBooking && nextBooking
                                ? new Date(currentBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : undefined,
                        };
                    } catch (error) {
                        console.error(`Error checking availability for room ${room.id}:`, error);
                        return { ...room, is_available: true };
                    }
                })
            );

            setRoomsWithAvailability(roomsWithStatus);
        };

        checkAvailability();
    }, [rooms, selectedDate]);

    return {
        ...roomQuery,
        data: roomsWithAvailability,
    };
};

// Hook for real-time room updates
export const useRoomsRealtime = (filters: RoomFilter = {}) => {
    const queryClient = useQueryClient();
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        const realtimeChannel = roomQueries.subscribe((payload) => {
            // Invalidate and refetch room queries when rooms change
            queryClient.invalidateQueries({ queryKey: roomKeys.lists() });

            // Update specific room if we have the ID
            if (payload.new?.id) {
                queryClient.setQueryData(
                    roomKeys.detail(payload.new.id),
                    payload.eventType === 'DELETE' ? null : payload.new
                );
            }
        });

        setChannel(realtimeChannel);

        return () => {
            if (realtimeChannel) {
                realtimeChannel.unsubscribe();
            }
        };
    }, [queryClient]);

    return useRooms(filters);
};

// Hook to get filter options
export const useRoomFilters = () => {
    const floors = useQuery({
        queryKey: [...roomKeys.filters(), 'floors'],
        queryFn: roomQueries.getFloors,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const locations = useQuery({
        queryKey: [...roomKeys.filters(), 'locations'],
        queryFn: roomQueries.getLocations,
        staleTime: 10 * 60 * 1000,
    });

    const equipment = useQuery({
        queryKey: [...roomKeys.filters(), 'equipment'],
        queryFn: roomQueries.getEquipment,
        staleTime: 10 * 60 * 1000,
    });

    return {
        floors: floors.data || [],
        locations: locations.data || [],
        equipment: equipment.data || [],
        isLoading: floors.isLoading || locations.isLoading || equipment.isLoading,
    };
};

// Mutation hooks for room management (admin only)
export const useCreateRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: roomQueries.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
        },
    });
};

export const useUpdateRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Room> }) =>
            roomQueries.update(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
            queryClient.setQueryData(roomKeys.detail(data.id), data);
        },
    });
};

export const useDeleteRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: roomQueries.delete,
        onSuccess: (_, roomId) => {
            queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
            queryClient.removeQueries({ queryKey: roomKeys.detail(roomId) });
        },
    });
};