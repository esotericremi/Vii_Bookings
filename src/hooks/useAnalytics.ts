import { useQuery } from '@tanstack/react-query';
import { analyticsQueries } from '@/lib/queries';

// Query keys for analytics
export const analyticsKeys = {
    all: ['analytics'] as const,
    bookingAnalytics: (startDate?: string, endDate?: string) =>
        [...analyticsKeys.all, 'booking-analytics', startDate, endDate] as const,
    roomUtilization: (roomId?: string, startDate?: string, endDate?: string) =>
        [...analyticsKeys.all, 'room-utilization', roomId, startDate, endDate] as const,
    bookingTrends: (startDate?: string, endDate?: string, granularity?: string) =>
        [...analyticsKeys.all, 'booking-trends', startDate, endDate, granularity] as const,
    departmentUsage: (startDate?: string, endDate?: string) =>
        [...analyticsKeys.all, 'department-usage', startDate, endDate] as const,
    peakHours: (startDate?: string, endDate?: string) =>
        [...analyticsKeys.all, 'peak-hours', startDate, endDate] as const,
    roomPopularity: (startDate?: string, endDate?: string) =>
        [...analyticsKeys.all, 'room-popularity', startDate, endDate] as const,
};

// Hook for comprehensive booking analytics
export const useBookingAnalytics = (startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: analyticsKeys.bookingAnalytics(startDate, endDate),
        queryFn: () => analyticsQueries.getBookingAnalytics(startDate, endDate),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
};

// Hook for room utilization data
export const useRoomUtilization = (roomId?: string, startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: analyticsKeys.roomUtilization(roomId, startDate, endDate),
        queryFn: () => analyticsQueries.getRoomUtilization(roomId, startDate, endDate),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

// Hook for booking trends over time
export const useBookingTrends = (
    startDate?: string,
    endDate?: string,
    granularity: 'day' | 'week' | 'month' = 'day'
) => {
    return useQuery({
        queryKey: analyticsKeys.bookingTrends(startDate, endDate, granularity),
        queryFn: () => analyticsQueries.getBookingTrends(startDate, endDate, granularity),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

// Hook for department usage statistics
export const useDepartmentUsage = (startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: analyticsKeys.departmentUsage(startDate, endDate),
        queryFn: () => analyticsQueries.getDepartmentUsage(startDate, endDate),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

// Hook for peak hours analysis
export const usePeakHours = (startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: analyticsKeys.peakHours(startDate, endDate),
        queryFn: async () => {
            const analytics = await analyticsQueries.getBookingAnalytics(startDate, endDate);
            return analytics.peak_hours;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

// Hook for room popularity metrics
export const useRoomPopularity = (startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: analyticsKeys.roomPopularity(startDate, endDate),
        queryFn: async () => {
            const analytics = await analyticsQueries.getBookingAnalytics(startDate, endDate);
            return analytics.popular_rooms;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

// Combined analytics hook for dashboard
export const useAnalyticsDashboard = (startDate?: string, endDate?: string) => {
    const bookingAnalytics = useBookingAnalytics(startDate, endDate);
    const roomUtilization = useRoomUtilization(undefined, startDate, endDate);
    const bookingTrends = useBookingTrends(startDate, endDate, 'day');
    const departmentUsage = useDepartmentUsage(startDate, endDate);

    return {
        bookingAnalytics,
        roomUtilization,
        bookingTrends,
        departmentUsage,
        isLoading: bookingAnalytics.isLoading || roomUtilization.isLoading ||
            bookingTrends.isLoading || departmentUsage.isLoading,
        error: bookingAnalytics.error || roomUtilization.error ||
            bookingTrends.error || departmentUsage.error,
    };
};