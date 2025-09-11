import { Calendar, Clock, MapPin, Users, Wifi, Monitor, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Room } from "@/types/room";

interface RoomCardProps {
  room: Room;
  isAvailable?: boolean;
  nextAvailable?: string;
  onBook: (roomId: string) => void;
}

const amenityIcons: Record<string, any> = {
  'WiFi': Wifi,
  'Projector': Monitor,
  'Coffee': Coffee,
  'Whiteboard': Monitor,
  'Video Call': Monitor,
};

export const RoomCard = ({ room, isAvailable = true, nextAvailable, onBook }: RoomCardProps) => {
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
                <span>Floor {room.floor}</span>
              </div>
            </div>
          </div>
          <Badge 
            variant={isAvailable ? "default" : "secondary"}
            className={`
              ${isAvailable 
                ? "bg-available text-white hover:bg-available/90" 
                : "bg-occupied text-white"
              }
            `}
          >
            {isAvailable ? "Available" : "Occupied"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {room.description && (
          <p className="text-sm text-muted-foreground">{room.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {room.amenities.map((amenity) => {
            const Icon = amenityIcons[amenity] || Monitor;
            return (
              <div 
                key={amenity} 
                className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-md"
              >
                <Icon className="h-3 w-3" />
                <span>{amenity}</span>
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