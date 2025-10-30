import { useState } from "react";
import { BarChart3, Calendar, Users, AlertTriangle, Settings, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookings } from "@/hooks/useBookings";
import { useRooms } from "@/hooks/useRooms";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Fetch real data
  const { data: allBookings, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings();
  const { data: rooms, isLoading: roomsLoading } = useRooms();

  const isLoading = bookingsLoading || roomsLoading;

  // Calculate real stats
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const todayBookings = allBookings?.filter(booking => {
    const bookingDate = new Date(booking.start_time);
    return bookingDate >= todayStart && bookingDate <= todayEnd;
  }) || [];

  const activeBookings = todayBookings.filter(booking => {
    const now = new Date();
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    return booking.status === 'confirmed' && start <= now && end >= now;
  });

  const upcomingBookings = todayBookings.filter(booking => {
    const now = new Date();
    const start = new Date(booking.start_time);
    return booking.status === 'confirmed' && start > now;
  }).slice(0, 5);

  const totalBookings = todayBookings.length;
  const activeCount = activeBookings.length;
  const totalRooms = rooms?.filter(room => room.is_active).length || 0;
  const utilizationRate = totalRooms > 0 ? Math.round((activeCount / totalRooms) * 100) : 0;
  const ghostBookings = todayBookings.filter(booking =>
    booking.status === 'confirmed' &&
    isBefore(new Date(booking.start_time), new Date()) &&
    !booking.checked_in
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button size="sm" className="bg-gradient-primary">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Meetings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">Right now</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ghost Bookings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.ghostBookings}</div>
            <p className="text-xs text-muted-foreground">Not checked in</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Active Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{booking.room}</div>
                      <div className="text-sm text-muted-foreground">{booking.user}</div>
                      <div className="text-sm">{booking.time}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          booking.status === 'active' ? 'default' :
                            booking.status === 'ghost' ? 'destructive' : 'secondary'
                        }
                        className={
                          booking.status === 'active' ? 'bg-success' :
                            booking.status === 'ghost' ? 'bg-occupied' : ''
                        }
                      >
                        {booking.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => onOverrideBooking(booking.id)}>
                        Override
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Rooms 🏆</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.popularRooms.map((room, index) => (
                    <div key={room.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                        <span>{room.name}</span>
                      </div>
                      <Badge variant="outline">{room.bookings} bookings</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.peakHours.map((hour) => (
                    <div key={hour.time} className="flex items-center justify-between">
                      <span>{hour.time}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(hour.bookings / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{hour.bookings}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockIssues.map((issue) => (
                  <div key={issue.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{issue.room}</div>
                      <div className="text-sm text-muted-foreground">{issue.issue}</div>
                      <div className="text-xs text-muted-foreground">
                        Reported by {issue.reporter} • {issue.time}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};