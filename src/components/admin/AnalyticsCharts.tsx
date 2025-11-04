import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { formatPeakHours, getTopRooms, getDepartmentEfficiency } from '@/lib/analyticsUtils';
import type {
    BookingAnalytics,
    RoomUtilizationData,
    BookingTrendData,
    DepartmentUsageData
} from '@/types/booking';

interface AnalyticsChartsProps {
    bookingAnalytics?: BookingAnalytics;
    roomUtilization?: RoomUtilizationData[];
    bookingTrends?: BookingTrendData[];
    departmentUsage?: DepartmentUsageData[];
    isLoading: boolean;
}

// Color palette for charts
const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

// Helper function to sanitize chart data
const sanitizeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
};

const sanitizeChartData = (data: any[]): any[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(item)) {
            if (typeof value === 'number') {
                sanitized[key] = sanitizeNumber(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    });
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
    bookingAnalytics,
    roomUtilization,
    bookingTrends,
    departmentUsage,
    isLoading
}) => {
    // Check if we have any data at all
    const hasAnyData = bookingAnalytics && (
        (bookingAnalytics.total_bookings > 0) ||
        (roomUtilization && roomUtilization.length > 0) ||
        (bookingTrends && bookingTrends.length > 0) ||
        (departmentUsage && departmentUsage.length > 0)
    );

    // Prepare data for charts with sanitization
    const peakHoursData = sanitizeChartData(bookingAnalytics ? formatPeakHours(bookingAnalytics.peak_hours || []) : []);
    const topRoomsData = sanitizeChartData(bookingAnalytics ? getTopRooms(bookingAnalytics.popular_rooms || [], 10) : []);
    const departmentEfficiencyData = sanitizeChartData(departmentUsage ? getDepartmentEfficiency(departmentUsage) : []);

    // Prepare utilization data for chart
    const utilizationChartData = sanitizeChartData(roomUtilization?.map(room => ({
        name: room.room_name.length > 15 ? room.room_name.substring(0, 15) + '...' : room.room_name,
        utilization: sanitizeNumber(room.utilization_percentage),
        bookings: sanitizeNumber(room.booking_count),
        hours: Math.round(sanitizeNumber(room.total_hours_booked) * 10) / 10
    })) || []);

    // Prepare booking status pie chart data
    const bookingStatusData = sanitizeChartData(bookingAnalytics ? [
        { name: 'Confirmed', value: sanitizeNumber(bookingAnalytics.confirmed_bookings), color: COLORS[2] },
        { name: 'Cancelled', value: sanitizeNumber(bookingAnalytics.cancelled_bookings), color: COLORS[1] }
    ].filter(item => item.value > 0) : []);

    // Sanitize booking trends data
    const sanitizedBookingTrends = sanitizeChartData(bookingTrends || []);
    const sanitizedDepartmentUsage = sanitizeChartData(departmentUsage || []);

    // Empty state component
    const EmptyStateMessage = ({ message }: { message: string }) => (
        <div className="flex items-center justify-center h-64 text-center">
            <div className="text-muted-foreground">
                <div className="text-lg font-medium mb-2">No Data Available</div>
                <div className="text-sm">{message}</div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-gray-100 animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Show empty state if no data
    if (!hasAnyData) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <EmptyStateMessage message="No rooms or bookings found. Create some rooms and bookings to see analytics data." />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Booking Trends Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Booking Trends</CardTitle>
                    <CardDescription>Daily booking activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            {sanitizedBookingTrends.length > 0 ? (
                                <AreaChart data={sanitizedBookingTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        formatter={(value, name) => [value, name === 'confirmed' ? 'Confirmed' : name === 'cancelled' ? 'Cancelled' : 'Total']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="confirmed"
                                        stackId="1"
                                        stroke={COLORS[2]}
                                        fill={COLORS[2]}
                                        fillOpacity={0.6}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cancelled"
                                        stackId="1"
                                        stroke={COLORS[1]}
                                        fill={COLORS[1]}
                                        fillOpacity={0.6}
                                    />
                                </AreaChart>
                            ) : (
                                <EmptyStateMessage message="No booking trends data available" />
                            )}
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Room Utilization Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Room Utilization</CardTitle>
                        <CardDescription>Utilization percentage by room</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                {utilizationChartData.length > 0 ? (
                                    <BarChart data={utilizationChartData} layout="horizontal">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 10 }}
                                            width={80}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                name === 'utilization' ? `${value}%` : value,
                                                name === 'utilization' ? 'Utilization' : name === 'bookings' ? 'Bookings' : 'Hours'
                                            ]}
                                        />
                                        <Bar dataKey="utilization" fill={COLORS[0]} />
                                    </BarChart>
                                ) : (
                                    <EmptyStateMessage message="No rooms available for utilization analysis" />
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Booking Status Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Booking Status</CardTitle>
                        <CardDescription>Distribution of confirmed vs cancelled bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                {bookingStatusData.length > 0 ? (
                                    <PieChart>
                                        <Pie
                                            data={bookingStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {bookingStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [value, 'Bookings']} />
                                    </PieChart>
                                ) : (
                                    <EmptyStateMessage message="No booking status data available" />
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Peak Hours Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Peak Hours</CardTitle>
                        <CardDescription>Booking activity by hour of day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                {peakHoursData.length > 0 ? (
                                    <BarChart data={peakHoursData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                value,
                                                name === 'count' ? 'Bookings' : 'Percentage'
                                            ]}
                                        />
                                        <Bar dataKey="count" fill={COLORS[4]} />
                                    </BarChart>
                                ) : (
                                    <EmptyStateMessage message="No peak hours data available" />
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Department Usage Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Department Usage</CardTitle>
                        <CardDescription>Booking activity by department</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                {sanitizedDepartmentUsage.length > 0 ? (
                                    <BarChart data={sanitizedDepartmentUsage}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="department"
                                            tick={{ fontSize: 10 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                value,
                                                name === 'booking_count' ? 'Bookings' : 'Hours'
                                            ]}
                                        />
                                        <Bar dataKey="booking_count" fill={COLORS[5]} />
                                    </BarChart>
                                ) : (
                                    <EmptyStateMessage message="No department usage data available" />
                                )}
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Popular Rooms Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Most Popular Rooms</CardTitle>
                    <CardDescription>Top 10 rooms by booking count</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            {topRoomsData.length > 0 ? (
                                <BarChart data={topRoomsData} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="room_name"
                                        tick={{ fontSize: 10 }}
                                        width={120}
                                    />
                                    <Tooltip
                                        formatter={(value) => [value, 'Bookings']}
                                    />
                                    <Bar dataKey="booking_count" fill={COLORS[3]} />
                                </BarChart>
                            ) : (
                                <EmptyStateMessage message="No popular rooms data available" />
                            )}
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};