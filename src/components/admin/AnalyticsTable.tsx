import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {
    RoomUtilizationData,
    DepartmentUsageData
} from '@/types/booking';

interface AnalyticsTableProps {
    roomUtilization?: RoomUtilizationData[];
    departmentUsage?: DepartmentUsageData[];
    popularRooms?: { room_id: string; room_name: string; booking_count: number }[];
    isLoading: boolean;
}

export const AnalyticsTable: React.FC<AnalyticsTableProps> = ({
    roomUtilization,
    departmentUsage,
    popularRooms,
    isLoading
}) => {
    // Sort data for better display
    const sortedRoomUtilization = roomUtilization?.sort((a, b) => b.utilization_percentage - a.utilization_percentage) || [];
    const sortedDepartmentUsage = departmentUsage?.sort((a, b) => b.booking_count - a.booking_count) || [];
    const sortedPopularRooms = popularRooms?.sort((a, b) => b.booking_count - a.booking_count) || [];

    // Helper function to get utilization color
    const getUtilizationColor = (percentage: number) => {
        if (percentage >= 80) return 'text-red-600';
        if (percentage >= 60) return 'text-yellow-600';
        if (percentage >= 40) return 'text-blue-600';
        return 'text-green-600';
    };

    // Helper function to get utilization badge variant
    const getUtilizationBadge = (percentage: number) => {
        if (percentage >= 80) return 'destructive';
        if (percentage >= 60) return 'default';
        if (percentage >= 40) return 'secondary';
        return 'outline';
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>
                    Comprehensive breakdown of room usage, department activity, and booking patterns
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="rooms" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="rooms">Room Utilization</TabsTrigger>
                        <TabsTrigger value="departments">Department Usage</TabsTrigger>
                        <TabsTrigger value="popular">Popular Rooms</TabsTrigger>
                    </TabsList>

                    {/* Room Utilization Table */}
                    <TabsContent value="rooms" className="space-y-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Room Name</TableHead>
                                        <TableHead className="text-center">Bookings</TableHead>
                                        <TableHead className="text-center">Hours Booked</TableHead>
                                        <TableHead className="text-center">Utilization</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedRoomUtilization.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No room utilization data available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedRoomUtilization.map((room) => (
                                            <TableRow key={room.room_id}>
                                                <TableCell className="font-medium">
                                                    {room.room_name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {room.booking_count}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {Math.round(room.total_hours_booked * 10) / 10}h
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center space-x-2">
                                                        <Progress
                                                            value={room.utilization_percentage}
                                                            className="w-16 h-2"
                                                        />
                                                        <span className={`text-sm font-medium ${getUtilizationColor(room.utilization_percentage)}`}>
                                                            {Math.round(room.utilization_percentage)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getUtilizationBadge(room.utilization_percentage)}>
                                                        {room.utilization_percentage >= 80 ? 'High' :
                                                            room.utilization_percentage >= 60 ? 'Medium' :
                                                                room.utilization_percentage >= 40 ? 'Low' : 'Very Low'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Department Usage Table */}
                    <TabsContent value="departments" className="space-y-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Department</TableHead>
                                        <TableHead className="text-center">Total Bookings</TableHead>
                                        <TableHead className="text-center">Total Hours</TableHead>
                                        <TableHead className="text-center">Avg Duration</TableHead>
                                        <TableHead className="text-center">Activity Level</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedDepartmentUsage.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No department usage data available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedDepartmentUsage.map((dept, index) => {
                                            const avgDuration = dept.booking_count > 0 ?
                                                Math.round((dept.total_hours / dept.booking_count) * 10) / 10 : 0;
                                            const maxBookings = Math.max(...sortedDepartmentUsage.map(d => d.booking_count));
                                            const activityPercentage = maxBookings > 0 ? (dept.booking_count / maxBookings) * 100 : 0;

                                            return (
                                                <TableRow key={dept.department}>
                                                    <TableCell className="font-medium">
                                                        {dept.department}
                                                        {index === 0 && (
                                                            <Badge variant="secondary" className="ml-2">
                                                                Most Active
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {dept.booking_count}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {Math.round(dept.total_hours * 10) / 10}h
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {avgDuration}h
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center space-x-2">
                                                            <Progress
                                                                value={activityPercentage}
                                                                className="w-16 h-2"
                                                            />
                                                            <span className="text-sm text-muted-foreground">
                                                                {Math.round(activityPercentage)}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Popular Rooms Table */}
                    <TabsContent value="popular" className="space-y-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Room Name</TableHead>
                                        <TableHead className="text-center">Booking Count</TableHead>
                                        <TableHead className="text-center">Popularity</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedPopularRooms.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No popular rooms data available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedPopularRooms.slice(0, 10).map((room, index) => {
                                            const maxBookings = Math.max(...sortedPopularRooms.map(r => r.booking_count));
                                            const popularityPercentage = maxBookings > 0 ? (room.booking_count / maxBookings) * 100 : 0;

                                            return (
                                                <TableRow key={room.room_id}>
                                                    <TableCell className="font-medium">
                                                        #{index + 1}
                                                        {index < 3 && (
                                                            <span className="ml-2">
                                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {room.room_name}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {room.booking_count}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center space-x-2">
                                                            <Progress
                                                                value={popularityPercentage}
                                                                className="w-16 h-2"
                                                            />
                                                            <span className="text-sm text-muted-foreground">
                                                                {Math.round(popularityPercentage)}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant={
                                                                index === 0 ? 'default' :
                                                                    index < 3 ? 'secondary' : 'outline'
                                                            }
                                                        >
                                                            {index === 0 ? 'Top Choice' :
                                                                index < 3 ? 'Popular' : 'Active'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};