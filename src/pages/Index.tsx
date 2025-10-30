import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Calendar, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/shared/Logo";

const Index = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  usePageTitle('Home - VII Bookings');

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Logo size="xl" showText={false} />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome to VII Bookings
        </h1>
        <p className="text-lg text-muted-foreground">
          Your smart meeting room booking solution
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/rooms')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Find & Book Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Browse available meeting rooms and make instant bookings
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/my-bookings')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              My Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              View and manage your upcoming meeting reservations
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              View room availability and booking insights
            </p>
          </CardContent>
        </Card>

        {userProfile?.role === 'admin' && (
          <>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/bookings')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Manage Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Oversee all bookings and resolve conflicts
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/rooms')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-red-600" />
                  Manage Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Add, edit, and configure meeting rooms
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/analytics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  View detailed usage statistics and reports
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Book Section */}
      <div className="text-center">
        <Button
          onClick={() => navigate('/rooms')}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Book a Room Now
        </Button>
      </div>
    </div>
  );
};

export default Index;