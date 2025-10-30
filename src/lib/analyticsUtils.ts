import { format, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import type {
    BookingAnalytics,
    RoomUtilizationData,
    BookingTrendData,
    DepartmentUsageData,
    AnalyticsExportData,
    AnalyticsDateRange
} from '@/types/booking';

// Calculate utilization rate with proper handling of edge cases
export const calculateUtilizationRate = (confirmed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((confirmed / total) * 100 * 100) / 100; // Round to 2 decimal places
};

// Calculate trending percentage change
export const calculateTrendingChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
};

// Format peak hours data for display
export const formatPeakHours = (peakHours: { hour: number; count: number }[]): Array<{
    hour: string;
    count: number;
    percentage: number;
}> => {
    const totalBookings = peakHours.reduce((sum, item) => sum + item.count, 0);

    return peakHours.map(item => ({
        hour: format(new Date().setHours(item.hour, 0, 0, 0), 'HH:mm'),
        count: item.count,
        percentage: totalBookings > 0 ? Math.round((item.count / totalBookings) * 100) : 0
    }));
};

// Get top N rooms by booking count
export const getTopRooms = (
    rooms: { room_id: string; room_name: string; booking_count: number }[],
    limit = 5
) => {
    return rooms
        .sort((a, b) => b.booking_count - a.booking_count)
        .slice(0, limit);
};

// Calculate average booking duration
export const calculateAverageBookingDuration = (
    utilization: RoomUtilizationData[]
): number => {
    const totalHours = utilization.reduce((sum, room) => sum + room.total_hours_booked, 0);
    const totalBookings = utilization.reduce((sum, room) => sum + room.booking_count, 0);

    if (totalBookings === 0) return 0;
    return Math.round((totalHours / totalBookings) * 100) / 100;
};

// Get busiest day of week from trends data
export const getBusiestDayOfWeek = (trends: BookingTrendData[]): {
    day: string;
    averageBookings: number;
} => {
    const dayTotals: Record<string, { total: number; count: number }> = {};

    trends.forEach(trend => {
        const date = parseISO(trend.date);
        const dayName = format(date, 'EEEE');

        if (!dayTotals[dayName]) {
            dayTotals[dayName] = { total: 0, count: 0 };
        }

        dayTotals[dayName].total += trend.confirmed;
        dayTotals[dayName].count += 1;
    });

    let busiestDay = { day: 'Monday', averageBookings: 0 };

    Object.entries(dayTotals).forEach(([day, data]) => {
        const average = data.count > 0 ? data.total / data.count : 0;
        if (average > busiestDay.averageBookings) {
            busiestDay = { day, averageBookings: Math.round(average * 100) / 100 };
        }
    });

    return busiestDay;
};

// Calculate cancellation rate
export const calculateCancellationRate = (analytics: BookingAnalytics): number => {
    if (analytics.total_bookings === 0) return 0;
    return Math.round((analytics.cancelled_bookings / analytics.total_bookings) * 100 * 100) / 100;
};

// Get department efficiency (bookings per hour)
export const getDepartmentEfficiency = (departments: DepartmentUsageData[]): Array<{
    department: string;
    efficiency: number; // bookings per hour
    booking_count: number;
    total_hours: number;
}> => {
    return departments.map(dept => ({
        ...dept,
        efficiency: dept.total_hours > 0 ?
            Math.round((dept.booking_count / dept.total_hours) * 100) / 100 : 0
    })).sort((a, b) => b.efficiency - a.efficiency);
};

// Generate summary statistics
export const generateAnalyticsSummary = (
    analytics: BookingAnalytics,
    utilization: RoomUtilizationData[],
    trends: BookingTrendData[],
    departments: DepartmentUsageData[]
) => {
    const averageDuration = calculateAverageBookingDuration(utilization);
    const cancellationRate = calculateCancellationRate(analytics);
    const busiestDay = getBusiestDayOfWeek(trends);
    const topRoom = analytics.popular_rooms[0];
    const topDepartment = departments[0];

    // Calculate overall room utilization
    const overallUtilization = utilization.length > 0 ?
        utilization.reduce((sum, room) => sum + room.utilization_percentage, 0) / utilization.length : 0;

    return {
        totalBookings: analytics.total_bookings,
        utilizationRate: analytics.utilization_rate,
        cancellationRate,
        averageBookingDuration: averageDuration,
        overallRoomUtilization: Math.round(overallUtilization * 100) / 100,
        busiestDay: busiestDay.day,
        mostPopularRoom: topRoom?.room_name || 'N/A',
        mostActiveDepartment: topDepartment?.department || 'N/A',
        peakHour: analytics.peak_hours[0] ?
            format(new Date().setHours(analytics.peak_hours[0].hour, 0, 0, 0), 'HH:mm') : 'N/A'
    };
};

// Format data for CSV export
export const formatDataForCSV = (data: AnalyticsExportData): string => {
    const lines: string[] = [];

    // Header
    lines.push('Meeting Room Booking Analytics Report');
    lines.push(`Generated: ${data.generatedAt}`);
    lines.push(`Period: ${data.dateRange.startDate} to ${data.dateRange.endDate}`);
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push(`Total Bookings,${data.bookingAnalytics.total_bookings}`);
    lines.push(`Confirmed Bookings,${data.bookingAnalytics.confirmed_bookings}`);
    lines.push(`Cancelled Bookings,${data.bookingAnalytics.cancelled_bookings}`);
    lines.push(`Utilization Rate,${data.bookingAnalytics.utilization_rate}%`);
    lines.push('');

    // Room Utilization
    lines.push('ROOM UTILIZATION');
    lines.push('Room Name,Booking Count,Hours Booked,Utilization %');
    data.roomUtilization.forEach(room => {
        lines.push(`${room.room_name},${room.booking_count},${room.total_hours_booked},${room.utilization_percentage}%`);
    });
    lines.push('');

    // Department Usage
    lines.push('DEPARTMENT USAGE');
    lines.push('Department,Booking Count,Total Hours');
    data.departmentUsage.forEach(dept => {
        lines.push(`${dept.department},${dept.booking_count},${dept.total_hours}`);
    });
    lines.push('');

    // Booking Trends
    lines.push('BOOKING TRENDS');
    lines.push('Date,Confirmed,Cancelled,Total');
    data.bookingTrends.forEach(trend => {
        lines.push(`${trend.date},${trend.confirmed},${trend.cancelled},${trend.total}`);
    });

    return lines.join('\n');
};

// Download CSV file
export const downloadCSV = (data: AnalyticsExportData, filename = 'analytics-report.csv') => {
    const csvContent = formatDataForCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Generate date range options for analytics
export const getDateRangeOptions = () => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    return [
        {
            label: 'Last 7 days',
            value: 'last-7-days',
            startDate: format(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            endDate: today
        },
        {
            label: 'Last 30 days',
            value: 'last-30-days',
            startDate: format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            endDate: today
        },
        {
            label: 'Last 90 days',
            value: 'last-90-days',
            startDate: format(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            endDate: today
        },
        {
            label: 'This month',
            value: 'this-month',
            startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
            endDate: today
        },
        {
            label: 'Last month',
            value: 'last-month',
            startDate: format(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)), 'yyyy-MM-dd'),
            endDate: format(new Date(now.getFullYear(), now.getMonth(), 0), 'yyyy-MM-dd')
        }
    ];
};

// Generate PDF report using browser print functionality
export const generatePDFReport = (data: AnalyticsExportData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Analytics Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 25px; }
                .section h2 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
                .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                .summary-card h3 { margin: 0 0 10px 0; color: #3b82f6; }
                .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Meeting Room Booking Analytics Report</h1>
                <p>Generated: ${data.generatedAt}</p>
                <p>Period: ${data.dateRange.startDate} to ${data.dateRange.endDate}</p>
            </div>

            <div class="section">
                <h2>Summary</h2>
                <div class="summary-grid">
                    <div class="summary-card">
                        <h3>Total Bookings</h3>
                        <div class="value">${data.bookingAnalytics.total_bookings}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Utilization Rate</h3>
                        <div class="value">${data.bookingAnalytics.utilization_rate}%</div>
                    </div>
                    <div class="summary-card">
                        <h3>Confirmed Bookings</h3>
                        <div class="value">${data.bookingAnalytics.confirmed_bookings}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Cancelled Bookings</h3>
                        <div class="value">${data.bookingAnalytics.cancelled_bookings}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Room Utilization</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Booking Count</th>
                            <th>Hours Booked</th>
                            <th>Utilization %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.roomUtilization.map(room => `
                            <tr>
                                <td>${room.room_name}</td>
                                <td>${room.booking_count}</td>
                                <td>${Math.round(room.total_hours_booked * 10) / 10}h</td>
                                <td>${Math.round(room.utilization_percentage)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>Department Usage</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Booking Count</th>
                            <th>Total Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.departmentUsage.map(dept => `
                            <tr>
                                <td>${dept.department}</td>
                                <td>${dept.booking_count}</td>
                                <td>${Math.round(dept.total_hours * 10) / 10}h</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>Popular Rooms</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Room Name</th>
                            <th>Booking Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.bookingAnalytics.popular_rooms.slice(0, 10).map((room, index) => `
                            <tr>
                                <td>#${index + 1}</td>
                                <td>${room.room_name}</td>
                                <td>${room.booking_count}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Trigger print dialog
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};