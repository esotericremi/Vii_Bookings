import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, DownloadIcon, TrendingUpIcon, UsersIcon, ClockIcon, BuildingIcon, FileTextIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';
import { getDateRangeOptions, generateAnalyticsSummary, downloadCSV, generatePDFReport } from '@/lib/analyticsUtils';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards';
import { AnalyticsTable } from './AnalyticsTable';
import type { AnalyticsExportData } from '@/types/booking';

export const Analytics: React.FC = () => {
    const [selectedDateRange, setSelectedDateRange] = useState('last-30-days');
    const dateRangeOptions = getDateRangeOptions();

    // Get the selected date range and convert to full ISO strings
    const selectedRange = dateRangeOptions.find(option => option.value === selectedDateRange);
    const startDate = selectedRange?.startDate ? selectedRange.startDate + 'T00:00:00.000Z' : undefined;
    const endDate = selectedRange?.endDate ? selectedRange.endDate + 'T23:59:59.999Z' : undefined;



    // Fetch analytics data
    const {
        bookingAnalytics,
        roomUtilization,
        bookingTrends,
        departmentUsage,
        isLoading,
        error
    } = useAnalyticsDashboard(startDate, endDate);

    // Prepare export data
    const getExportData = (): AnalyticsExportData | null => {
        if (!bookingAnalytics.data || !roomUtilization.data || !bookingTrends.data || !departmentUsage.data) {
            return null;
        }

        return {
            bookingAnalytics: bookingAnalytics.data,
            roomUtilization: roomUtilization.data,
            bookingTrends: bookingTrends.data,
            departmentUsage: departmentUsage.data,
            dateRange: {
                startDate: startDate || '',
                endDate: endDate || ''
            },
            generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        };
    };

    // Handle CSV export
    const handleExportCSV = () => {
        const exportData = getExportData();
        if (!exportData) return;

        const filename = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(exportData, filename);
    };

    // Handle PDF export
    const handleExportPDF = () => {
        const exportData = getExportData();
        if (!exportData) return;

        generatePDFReport(exportData);
    };

    // Generate summary data
    const summaryData = React.useMemo(() => {
        if (!bookingAnalytics.data || !roomUtilization.data || !bookingTrends.data || !departmentUsage.data) {
            return null;
        }

        return generateAnalyticsSummary(
            bookingAnalytics.data,
            roomUtilization.data,
            bookingTrends.data,
            departmentUsage.data
        );
    }, [bookingAnalytics.data, roomUtilization.data, bookingTrends.data, departmentUsage.data]);

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-red-600">
                            <p>Error loading analytics data. Please try again later.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Meeting room booking insights and trends
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Date Range Selector */}
                    <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {dateRangeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Export Buttons */}
                    <div className="flex gap-3">

                        <Button
                            onClick={handleExportCSV}
                            variant="outline"
                            disabled={isLoading || !bookingAnalytics.data}
                        >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button
                            onClick={handleExportPDF}
                            variant="outline"
                            disabled={isLoading || !bookingAnalytics.data}
                        >
                            <FileTextIcon className="h-4 w-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>
                </div>
            </header>

            {/* Date Range Display */}
            {selectedRange && (
                <section className="mt-6">
                    <Card className="shadow-sm">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                <span>
                                    Showing data from {format(new Date(selectedRange.startDate), 'MMM dd, yyyy')} to{' '}
                                    {format(new Date(selectedRange.endDate), 'MMM dd, yyyy')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <section className="mt-8">
                        {summaryData ? (
                            <div>
                                <AnalyticsSummaryCards
                                    summary={summaryData}
                                    isLoading={isLoading}
                                />
                            </div>
                        ) : !isLoading ? (
                            <Card className="shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="text-center text-muted-foreground">
                                        <p>No summary data available. Create some rooms and bookings to see analytics.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center">Loading summary...</div>
                        )}
                    </section>

                    {/* Charts Section */}
                    <section className="mt-8">
                        <AnalyticsCharts
                            bookingAnalytics={bookingAnalytics.data}
                            roomUtilization={roomUtilization.data}
                            bookingTrends={bookingTrends.data}
                            departmentUsage={departmentUsage.data}
                            isLoading={isLoading}
                        />
                    </section>

                    {/* Detailed Tables */}
                    <section className="mt-8">
                        <AnalyticsTable
                            roomUtilization={roomUtilization.data}
                            departmentUsage={departmentUsage.data}
                            popularRooms={bookingAnalytics.data?.popular_rooms}
                            isLoading={isLoading}
                        />
                    </section>
                </>
            )}
        </div >
    );
};