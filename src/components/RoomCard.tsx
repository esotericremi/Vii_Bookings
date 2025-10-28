import { Calendar, Clock, MapPin, Users, Wifi, Monitor, Coffee, Presentation, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoomWithAvailability } from "@/types/room";

interface RoomCardProps {
  room: RoomWithAvailability;
  onBook: (roomId: string) => void;
  showAvailability?: boolean;
}

const equipmentIcons: Record<string, any> = {
  'WiFi': Wifi,
  'Projector': Monitor,
  'Coffee': Coffee,
  'Whiteboard': Presentation,
  'Video Call': Phone,
  'TV': Monitor,
  'Conference Phone': Phone,
};

export const RoomCard = ({ room, onBook, showAvailability = true }: RoomCardProps) => {
  const isAvailable = room.is_available ?? true;
  const nextAvailable = room.next_available_time;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in bg-gradient-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{room.name}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{room.capacity} people</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{room.location} - Floor {room.floor}</span>
              </div>
            </div>
          </div>
          {showAvailability && (
            <Badge
              variant={isAvailable ? "default" : "secondary"}
              className={`
                ${isAvailable
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-red-500 text-white hover:bg-red-600"
                }
              `}
            >
              {isAvailable ? "Available" : "Occupied"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {room.description && (
          <p className="text-sm text-muted-foreground">{room.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {room.equipment?.map((equipment) => {
            const Icon = equipmentIcons[equipment] || Monitor;
            return (
              <div
                key={equipment}
                className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-md"
              >
                <Icon className="h-3 w-3" />
                <span>{equipment}</span>
              </div>
            );
          })}
        </div>

        {!isAvailable && nextAvailable && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Available at {nextAvailable}</span>
          </div>
        )}

        <Button
          onClick={() => onBook(room.id)}
          disabled={!isAvailable}
          className={`
            w-full transition-all duration-200 
            ${isAvailable
              ? "bg-gradient-primary hover:shadow-lg hover:scale-105 transform"
              : "opacity-50 cursor-not-allowed"
            }
          `}
        >
          {isAvailable ? "Book Now" : "Occupied"}
        </Button>
      </CardContent>
    </Card>
  );
};