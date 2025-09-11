import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { RoomCard } from "@/components/RoomCard";
import { BookingForm } from "@/components/BookingForm";
import { CheckInInterface } from "@/components/CheckInInterface";
import { AdminDashboard } from "@/components/AdminDashboard";
import { CalendarView } from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Room, Booking } from "@/types/room";

const Index = () => {
  const [activeView, setActiveView] = useState('rooms');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const { toast } = useToast();

  // Mock data
  const rooms: Room[] = [
    {
      id: '1',
      name: 'Conference Room A',
      capacity: 12,
      floor: 2,
      amenities: ['Projector', 'Whiteboard', 'Video Call', 'WiFi'],
      description: 'Perfect for team presentations and client meetings',
    },
    {
      id: '2',
      name: 'Meeting Room B',
      capacity: 6,
      floor: 1,
      amenities: ['WiFi', 'Whiteboard'],
      description: 'Ideal for small team meetings and brainstorming sessions',
    },
    {
      id: '3',
      name: 'Huddle Space 1',
      capacity: 4,
      floor: 1,
      amenities: ['WiFi', 'Monitor'],
      description: 'Quick standup meetings and informal discussions',
    },
    {
      id: '4',
      name: 'Executive Boardroom',
      capacity: 16,
      floor: 3,
      amenities: ['Projector', 'Video Call', 'WiFi', 'Coffee'],
      description: 'Premium space for executive meetings and board sessions',
    },
  ];

  const mockBooking = {
    id: '1',
    title: 'Team Standup',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    roomName: 'Conference Room A',
    status: 'pending',
  };

  // Mock bookings data for calendar view
  const mockBookings: Booking[] = [
    {
      id: '1',
      roomId: '1',
      userId: 'user1',
      userEmail: 'engineering.john@company.com',
      title: 'Sprint Planning',
      startTime: new Date(2024, 0, 15, 9, 0),
      endTime: new Date(2024, 0, 15, 10, 30),
      isRecurring: false,
      status: 'confirmed',
      createdAt: new Date(),
    },
    {
      id: '2',
      roomId: '2',
      userId: 'user2',
      userEmail: 'marketing.sarah@company.com',
      title: 'Campaign Review',
      startTime: new Date(2024, 0, 15, 11, 0),
      endTime: new Date(2024, 0, 15, 12, 0),
      isRecurring: false,
      status: 'confirmed',
      createdAt: new Date(),
    },
    {
      id: '3',
      roomId: '3',
      userId: 'user3',
      userEmail: 'sales.mike@company.com',
      title: 'Client Presentation',
      startTime: new Date(2024, 0, 15, 14, 0),
      endTime: new Date(2024, 0, 15, 15, 30),
      isRecurring: false,
      status: 'confirmed',
      createdAt: new Date(),
    },
    {
      id: '4',
      roomId: '4',
      userId: 'user4',
      userEmail: 'hr.lisa@company.com',
      title: 'All Hands Meeting',
      startTime: new Date(2024, 0, 16, 10, 0),
      endTime: new Date(2024, 0, 16, 11, 0),
      isRecurring: true,
      status: 'confirmed',
      createdAt: new Date(),
    },
    {
      id: '5',
      roomId: '1',
      userId: 'user5',
      userEmail: 'finance.david@company.com',
      title: 'Budget Review',
      startTime: new Date(2024, 0, 16, 15, 0),
      endTime: new Date(2024, 0, 16, 16, 30),
      isRecurring: false,
      status: 'confirmed',
      createdAt: new Date(),
    },
  ];

  const adminStats = {
    totalBookings: 24,
    activeBookings: 8,
    utilizationRate: 76,
    ghostBookings: 3,
    popularRooms: [
      { name: 'Conference Room A', bookings: 12 },
      { name: 'Meeting Room B', bookings: 8 },
      { name: 'Huddle Space 1', bookings: 6 },
    ],
    peakHours: [
      { time: '9:00 AM', bookings: 8 },
      { time: '2:00 PM', bookings: 6 },
      { time: '10:00 AM', bookings: 5 },
    ],
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCapacity = capacityFilter === 'all' || 
      (capacityFilter === 'small' && room.capacity <= 6) ||
      (capacityFilter === 'medium' && room.capacity > 6 && room.capacity <= 12) ||
      (capacityFilter === 'large' && room.capacity > 12);
    
    return matchesSearch && matchesCapacity;
  });

  const handleBookRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
    }
  };

  const handleBookingSubmit = (bookingData: any) => {
    console.log('Booking submitted:', bookingData);
    toast({
      title: "Room booked successfully! 🎉",
      description: "Calendar invite sent. We've got your back!",
    });
    setSelectedRoom(null);
    setActiveView('bookings');
  };

  const handleCheckIn = (bookingId: string) => {
    console.log('Checked in:', bookingId);
  };

  const handleExtend = (bookingId: string, minutes: number) => {
    console.log('Extended booking:', bookingId, minutes);
  };

  const handleEndEarly = (bookingId: string) => {
    console.log('Ended early:', bookingId);
  };

  const renderContent = () => {
    if (selectedRoom) {
      return (
        <div className="max-w-4xl mx-auto">
          <BookingForm
            room={selectedRoom}
            onSubmit={handleBookingSubmit}
            onCancel={() => setSelectedRoom(null)}
          />
        </div>
      );
    }

    switch (activeView) {
      case 'rooms':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Find Your Perfect Room</h2>
                <p className="text-muted-foreground">Book a space that fits your team and needs</p>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="small">1-6 people</SelectItem>
                    <SelectItem value="medium">7-12 people</SelectItem>
                    <SelectItem value="large">13+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, index) => (
                <div key={room.id} style={{ animationDelay: `${index * 100}ms` }}>
                  <RoomCard
                    room={room}
                    isAvailable={Math.random() > 0.3} // Mock availability
                    nextAvailable={Math.random() > 0.5 ? "2:30 PM" : undefined}
                    onBook={handleBookRoom}
                  />
                </div>
              ))}
            </div>

            {filteredRooms.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No rooms match your search criteria</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setCapacityFilter('all');
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">My Bookings</h2>
              <p className="text-muted-foreground">Manage your upcoming meetings</p>
            </div>
            
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Team Standup</CardTitle>
                    <Badge className="bg-success">Confirmed</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Conference Room A • Today 9:00-10:00 AM</p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'checkin':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Check In to Your Meeting</h2>
              <p className="text-muted-foreground">Confirm your presence to keep your room</p>
            </div>
            
            <CheckInInterface
              booking={mockBooking}
              onCheckIn={handleCheckIn}
              onExtend={handleExtend}
              onEndEarly={handleEndEarly}
            />
          </div>
        );

      case 'calendar':
        return (
          <CalendarView
            rooms={rooms}
            bookings={mockBookings}
          />
        );

      case 'admin':
        return (
          <AdminDashboard
            stats={adminStats}
            onOverrideBooking={(id) => console.log('Override:', id)}
            onManageRoom={(id) => console.log('Manage:', id)}
          />
        );

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        activeView={activeView}
        onViewChange={setActiveView}
        notificationCount={3}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;