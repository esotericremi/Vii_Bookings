import { useState } from "react";
import { Calendar, Users, Settings, Bell, Home, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandedHeader } from "@/components/shared/BrandedHeader";

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  notificationCount: number;
}

export const Navigation = ({ activeView, onViewChange, notificationCount }: NavigationProps) => {
  const navItems = [
    { id: 'rooms', label: 'Rooms', icon: Home },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'calendar', label: 'All Meetings', icon: CalendarDays },
    { id: 'checkin', label: 'Check In', icon: Users },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  return (
    <div className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <BrandedHeader size="md" />
            </div>

            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeView === item.id ? "default" : "ghost"}
                    onClick={() => onViewChange(item.id)}
                    className={`
                      flex items-center gap-2 transition-all duration-200
                      ${activeView === item.id
                        ? "bg-gradient-primary text-white shadow-lg"
                        : "hover:bg-secondary"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              Welcome back! 👋
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                onClick={() => onViewChange(item.id)}
                className={`
                  flex flex-col items-center gap-1 h-auto py-2 text-xs
                  ${activeView === item.id
                    ? "bg-gradient-primary text-white"
                    : ""
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};