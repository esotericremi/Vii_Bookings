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
          <Button variant="outline" size="sm" onClick={() => refetchBookings()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Meetings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Right now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{utilizationRate}%</div>
              <p className="text-xs text-muted-foreground">Current</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ghost Bookings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{ghostBookings}</div>
              <p className="text-xs text-muted-foreground">Not checked in</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Active Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today's Bookings</span>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/bookings')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : todayBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bookings scheduled for today
                </div>
              ) : (
                <div className="space-y-4">
                  {todayBookings.slice(0, 5).map((booking) => {
                    const now = new Date();
                    const start = new Date(booking.start_time);
                    const end = new Date(booking.end_time);
                    const isActive = start <= now && end >= now && booking.status === 'confirmed';
                    const isPast = end < now;
                    const isUpcoming = start > now;

                    return (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{booking.title}</div>
                          <div className="text-sm text-muted-foreground">{booking.room?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                          </div>
                          <div className="text-sm text-muted-foreground">{booking.user?.full_name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              isActive ? 'default' :
                                isPast ? 'outline' :
                                  booking.status === 'cancelled' ? 'destructive' : 'secondary'
                            }
                          >
                            {isActive ? 'Active' : isPast ? 'Completed' : isUpcoming ? 'Upcoming' : booking.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {todayBookings.length > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
                        View {todayBookings.length - 5} more bookings
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Room Usage Today 📊</span>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')}>
                    Full Analytics
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex justify-between">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rooms?.slice(0, 5).map((room, index) => {
                      const roomBookings = todayBookings.filter(b => b.room_id === room.id).length;
                      return (
                        <div key={room.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'}</span>
                            <span>{room.name}</span>
                          </div>
                          <Badge variant="outline">{roomBookings} bookings</Badge>
                        </div>
                      );
                    })}
                    {!rooms?.length && (
                      <div className="text-center py-4 text-muted-foreground">
                        No rooms available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/rooms')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Rooms
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/bookings')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    All Bookings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Database Connection</div>
                      <div className="text-sm text-muted-foreground">All systems operational</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Room Availability Service</div>
                      <div className="text-sm text-muted-foreground">Real-time updates active</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Ghost Bookings</div>
                      <div className="text-sm text-muted-foreground">{ghostBookings} bookings not checked in</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">
                    {ghostBookings > 0 ? 'Attention' : 'Good'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};