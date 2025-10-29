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

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
    bookingAnalytics,
    roomUtilization,
    bookingTrends,
    departmentUsage,
    isLoading
}) => {
    // Prepare data for charts
    const peakHoursData = bookingAnalytics ? formatPeakHours(bookingAnalytics.peak_hours) : [];
    const topRoomsData = bookingAnalytics ? getTopRooms(bookingAnalytics.popular_rooms, 10) : [];
    const departmentEfficiencyData = departmentUsage ? getDepartmentEfficiency(departmentUsage) : [];

    // Prepare utilization data for chart
    const utilizationChartData = roomUtilization?.map(room => ({
        name: room.room_name.length > 15 ? room.room_name.substring(0, 15) + '...' : room.room_name,
        utilization: Math.round(room.utilization_percentage),
        bookings: room.booking_count,
        hours: Math.round(room.total_hours_booked * 10) / 10
    })) || [];

    // Prepare booking status pie chart data
    const bookingStatusData = bookingAnalytics ? [
        { name: 'Confirmed', value: bookingAnalytics.confirmed_bookings, color: COLORS[2] },
        { name: 'Cancelled', value: bookingAnalytics.cancelled_bookings, color: COLORS[1] }
    ] : [];

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
                            <AreaChart data={bookingTrends}>
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
                                <BarChart data={departmentUsage}>
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
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};