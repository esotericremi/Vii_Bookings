import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { roomQueries } from '@/lib/queries';
import { useNetworkStatus } from '@/components/shared/NetworkStatusProvider';
import { toast } from '@/hooks/use-toast';
import type { Room, RoomFilter } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Query keys for rooms with better cache structure
export const roomKeys = {
    all: ['rooms'] as const,
    lists: () => [...roomKeys.all, 'list'] as const,
    list: (filters: RoomFilter) => [...roomKeys.lists(), { filters }] as const,
    details: () => [...roomKeys.all, 'detail'] as const,
    detail: (id: string) => [...roomKeys.details(), id] as const,
    availability: (roomId: string, date: string) => [...roomKeys.all, 'availability', roomId, date] as const,
    // Static data that changes rarely
    metadata: () => [...roomKeys.all, 'metadata'] as const,
    floors: () => [...roomKeys.metadata(), 'floors'] as const,
    locations: () => [...roomKeys.metadata(), 'locations'] as const,
    equipment: () => [...roomKeys.metadata(), 'equipment'] as const,
};

// Hook to get all rooms with optimized caching
export const useRooms = (filters?: RoomFilter) => {
    const { isOffline } = useNetworkStatus();

    return useQuery({
        queryKey: roomKeys.list(filters || {}),
        queryFn: () => roomQueries.getFiltered(filters),
        staleTime: 10 * 60 * 1000, // 10 minutes - rooms don't change often
        gcTime: 30 * 60 * 1000, // 30 minutes cache time
        enabled: !isOffline,
        retry: (failureCount, error) => {
            if (!navigator.onLine) return false;
            return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};

// Hook to get a single room
export const useRoom = (id: string) => {
    const { isOffline } = useNetworkStatus();

    return useQuery({
        queryKey: roomKeys.detail(id),
        queryFn: () => roomQueries.getById(id),
        staleTime: 15 * 60 * 1000, // 15 minutes - individual rooms change even less
        gcTime: 60 * 60 * 1000, // 1 hour cache time
        enabled: !!id && !isOffline,
    });
};

// Hook to get room availability
export const useRoomAvailability = (roomId: string, date: string) => {
    const { isOffline } = useNetworkStatus();

    return useQuery({
        queryKey: roomKeys.availability(roomId, date),
        queryFn: () => roomQueries.getAvailability(roomId, date),
        staleTime: 30 * 1000, // 30 seconds - availability changes frequently
        gcTime: 2 * 60 * 1000, // 2 minutes cache time
        enabled: !!roomId && !!date && !isOffline,
        refetchInterval: 60 * 1000, // Refetch every minute for availability
    });
};

// Hook to get room floors (cached for long time as it rarely changes)
export const useRoomFloors = () => {
    const { isOffline } = useNetworkStatus();

    return useQuery({
        queryKey: roomKeys.floors(),
        queryFn: () => roomQueries.getFloors(),
        staleTime: 60 * 60 * 1000, // 1 hour - floors rarely change
        gcTime: 24 * 60 * 60 * 1000, // 24 hours cache time
        enabled: !isOffline,
    });
};

// Hook to get room locations (cached for long time)
export const useRoomLocations = () => {
    const { isOffline } = useNetworkStatus();

    return useQuery({
        queryKey: roomKeys.locations(),
        queryFn: () => roomQueries.getLocations(),
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 24 * 60 * 60 * 1000, // 24 hours cache time
        enabled: !isOffline,
    });
};

// Hook to get available equipment (cached for long time)
export const useRoomEquipment = () => {
    const { isOffline } = useNetworkStatus();

    return useQuery({
        queryKey: roomKeys.equipment(),
        queryFn: () => roomQueries.getEquipment(),
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 24 * 60 * 60 * 1000, // 24 hours cache time
        enabled: !isOffline,
    });
};

// Hook for real-time room updates
export const useRoomsRealtime = (filters?: RoomFilter) => {
    const queryClient = useQueryClient();
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        const realtimeChannel = roomQueries.subscribe((payload) => {
            // Invalidate room lists
            queryClient.invalidateQueries({ queryKey: roomKeys.lists() });

            // Update specific room if we have the ID
            if (payload.new?.id) {
                queryClient.setQueryData(
                    roomKeys.detail(payload.new.id),
                    payload.eventType === 'DELETE' ? null : payload.new
                );
            }

            // Invalidate metadata queries if room structure changes
            if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
                queryClient.invalidateQueries({ queryKey: roomKeys.metadata() });
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

// Mutation hooks for room management
export const useCreateRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: roomQueries.create,
        onSuccess: (data) => {
            // Invalidate and refetch room lists
            queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
            // Invalidate metadata as new room might introduce new floors/locations/equipment
            queryClient.invalidateQueries({ queryKey: roomKeys.metadata() });

            toast({
                title: 'Room Created',
                description: `${data.name} has been created successfully.`,
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to Create Room',
                description: error.message || 'An error occurred while creating the room.',
                variant: 'destructive',
            });
        },
    });
};

export const useUpdateRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Room> }) =>
            roomQueries.update(id, updates),
        onSuccess: (data) => {
            // Update the specific room in cache
            queryClient.setQueryData(roomKeys.detail(data.id), data);
            // Invalidate room lists to reflect changes
            queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
            // Invalidate metadata if structural changes
            queryClient.invalidateQueries({ queryKey: roomKeys.metadata() });

            toast({
                title: 'Room Updated',
                description: `${data.name} has been updated successfully.`,
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to Update Room',
                description: error.message || 'An error occurred while updating the room.',
                variant: 'destructive',
            });
        },
    });
};

export const useDeleteRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: roomQueries.delete,
        onSuccess: (_, roomId) => {
            // Remove the room from cache
            queryClient.removeQueries({ queryKey: roomKeys.detail(roomId) });
            // Invalidate room lists
            queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
            // Invalidate metadata
            queryClient.invalidateQueries({ queryKey: roomKeys.metadata() });

            toast({
                title: 'Room Deleted',
                description: 'The room has been deleted successfully.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to Delete Room',
                description: error.message || 'An error occurred while deleting the room.',
                variant: 'destructive',
            });
        },
    });
};

// Hook for managing room filters state
export const useRoomFilters = () => {
    const [filters, setFilters] = useState<RoomFilter>({});

    const updateFilter = useCallback((key: keyof RoomFilter, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    const resetFilter = useCallback((key: keyof RoomFilter) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[key];
            return newFilters;
        });
    }, []);

    return {
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        resetFilter
    };
};

// Hook to get rooms with availability information
export const useRoomsWithAvailability = (date?: string) => {
    const currentDate = date || new Date().toISOString().split('T')[0];
    const { data: rooms = [], isLoading: roomsLoading } = useRooms();

    return useQuery({
        queryKey: [...roomKeys.lists(), 'with-availability', currentDate],
        queryFn: async () => {
            // Get availability for all rooms
            const roomsWithAvailability = await Promise.all(
                rooms.map(async (room) => {
                    try {
                        const availability = await roomQueries.getAvailability(room.id, currentDate);
                        return {
                            ...room,
                            availability: availability || []
                        };
                    } catch (error) {
                        console.error(`Failed to get availability for room ${room.id}:`, error);
                        return {
                            ...room,
                            availability: []
                        };
                    }
                })
            );
            return roomsWithAvailability;
        },
        enabled: !roomsLoading && rooms.length > 0,
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
};