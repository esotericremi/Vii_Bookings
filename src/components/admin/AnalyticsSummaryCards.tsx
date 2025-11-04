import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    TrendingUpIcon,
    UsersIcon,
    ClockIcon,
    BuildingIcon,
    CalendarIcon,
    XCircleIcon,
    BarChart3Icon,
    StarIcon
} from 'lucide-react';

interface AnalyticsSummaryCardsProps {
    summary: {
        totalBookings: number;
        utilizationRate: number;
        cancellationRate: number;
        averageBookingDuration: number;
        overallRoomUtilization: number;
        busiestDay: string;
        mostPopularRoom: string;
        mostActiveDepartment: string;
        peakHour: string;
    };
    isLoading: boolean;
}

export const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({
    summary,
    isLoading
}) => {
    // Helper function to safely format numbers
    const safeNumber = (value: number) => {
        return isNaN(value) || !isFinite(value) ? 0 : value;
    };

    const safeString = (value: string) => {
        return value && value !== 'N/A' ? value : 'No data';
    };

    const cards = [
        {
            title: 'Total Bookings',
            value: safeNumber(summary.totalBookings).toLocaleString(),
            icon: CalendarIcon,
            description: 'Total bookings in period',
            color: 'text-blue-600'
        },
        {
            title: 'Utilization Rate',
            value: `${safeNumber(summary.utilizationRate)}%`,
            icon: TrendingUpIcon,
            description: 'Confirmed vs total bookings',
            color: 'text-green-600'
        },
        {
            title: 'Cancellation Rate',
            value: `${safeNumber(summary.cancellationRate)}%`,
            icon: XCircleIcon,
            description: 'Cancelled bookings rate',
            color: 'text-red-600'
        },
        {
            title: 'Avg Duration',
            value: `${safeNumber(summary.averageBookingDuration)}h`,
            icon: ClockIcon,
            description: 'Average booking length',
            color: 'text-purple-600'
        },
        {
            title: 'Room Utilization',
            value: `${safeNumber(summary.overallRoomUtilization)}%`,
            icon: BuildingIcon,
            description: 'Overall room usage',
            color: 'text-orange-600'
        },
        {
            title: 'Busiest Day',
            value: safeString(summary.busiestDay),
            icon: BarChart3Icon,
            description: 'Most active day of week',
            color: 'text-indigo-600'
        },
        {
            title: 'Popular Room',
            value: safeString(summary.mostPopularRoom),
            icon: StarIcon,
            description: 'Most booked room',
            color: 'text-yellow-600'
        },
        {
            title: 'Active Department',
            value: safeString(summary.mostActiveDepartment),
            icon: UsersIcon,
            description: 'Most bookings by dept',
            color: 'text-teal-600'
        },
        {
            title: 'Peak Hour',
            value: safeString(summary.peakHour),
            icon: ClockIcon,
            description: 'Busiest booking time',
            color: 'text-pink-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, index) => {
                const IconComponent = card.icon;

                return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <IconComponent className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isLoading ? (
                                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                                ) : (
                                    card.value
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};