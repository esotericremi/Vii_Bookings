import { Calendar, Clock, MapPin, Users, Wifi, Monitor, Coffee, Presentation, Phone, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealTimeAvailability } from "@/hooks/useRealTimeAvailability";
import { useRealTimeSync } from "@/components/shared/RealTimeSyncProvider";
import type { RoomWithAvailability } from "@/types/room";

interface RoomCardProps {
  room: RoomWithAvailability;
  onBook: (roomId: string) => void;
  onSelect?: (roomId: string) => void;
  isSelected?: boolean;
  showAvailability?: boolean;
  enableRealTime?: boolean;
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

export const RoomCard = ({ room, onBook, onSelect, isSelected = false, showAvailability = true, enableRealTime = true }: RoomCardProps) => {
  const { isConnected, lastUpdate } = useRealTimeAvailability({
    roomId: enableRealTime ? room.id : null,
    onAvailabilityChange: (roomId, isAvailable) => {
      // Room availability changed
    }
  });

  // Enhanced real-time sync information
  const { connectionStatus, syncUpdates } = useRealTimeSync();

  // Check if this room has recent sync updates
  const recentRoomUpdates = syncUpdates.filter(update =>
    update.roomId === room.id &&
    Date.now() - update.timestamp.getTime() < 30000 // Last 30 seconds
  );

  const isAvailable = room.is_available ?? true;
  const nextAvailable = room.next_available_time;
  const hasRecentUpdates = recentRoomUpdates.length > 0;

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
          <div className="flex flex-col items-end gap-2">
            {showAvailability && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={isAvailable ? "default" : "secondary"}
                  className={`
                    ${isAvailable
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                    }
                    ${hasRecentUpdates ? "animate-pulse" : ""}
                  `}
                >
                  {isAvailable ? "Available" : "Occupied"}
                </Badge>
                {hasRecentUpdates && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Live
                  </Badge>
                )}
              </div>
            )}
            {enableRealTime && (
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
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

        <div className="flex gap-2">
          <Button
            onClick={() => onBook(room.id)}
            disabled={!isAvailable}
            className={`
              flex-1 transition-all duration-200 
              ${isAvailable
                ? "bg-gradient-primary hover:shadow-lg hover:scale-105 transform"
                : "opacity-50 cursor-not-allowed"
              }
            `}
          >
            {isAvailable ? "Book Now" : "Occupied"}
          </Button>

          {onSelect && (
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(room.id)}
              className="px-3"
            >
              {isSelected ? "✓" : "Select"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};