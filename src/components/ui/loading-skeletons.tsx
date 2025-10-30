import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Room card skeleton
export const RoomCardSkeleton: React.FC = () => (
    <Card className="h-full">
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-wrap gap-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
            </div>
            <Skeleton className="h-10 w-full" />
        </CardContent>
    </Card>
);

// Room grid skeleton
export const RoomGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
            <RoomCardSkeleton key={index} />
        ))}
    </div>
);

// Booking table skeleton
export const BookingTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="space-y-4">
        {/* Table header skeleton */}
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-32" />
            </div>
        </div>

        {/* Table rows skeleton */}
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Analytics chart skeleton
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-64" }) => (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-24" />
            </div>
        </CardHeader>
        <CardContent>
            <Skeleton className={`w-full ${height}`} />
        </CardContent>
    </Card>
);

// Stats card skeleton
export const StatsCardSkeleton: React.FC = () => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
            </div>
        </CardContent>
    </Card>
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <StatsCardSkeleton key={index} />
            ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
        </div>
    </div>
);

// Form skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
    <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
        </div>

        <div className="space-y-4">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
        </div>

        <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
        </div>
    </div>
);

// List skeleton
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: items }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
            </div>
        ))}
    </div>
);

// Navigation skeleton
export const NavigationSkeleton: React.FC = () => (
    <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-24" />
            </div>
        ))}
    </div>
);