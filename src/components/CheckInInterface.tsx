import { useState, useEffect } from "react";
import { QrCode, CheckCircle, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CheckInProps {
  booking: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    roomName: string;
    status: string;
  };
  onCheckIn: (bookingId: string) => void;
  onExtend: (bookingId: string, minutes: number) => void;
  onEndEarly: (bookingId: string) => void;
}

export const CheckInInterface = ({ booking, onCheckIn, onExtend, onEndEarly }: CheckInProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCheckedIn, setIsCheckedIn] = useState(booking.status === 'checked-in');
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const meetingStart = new Date(booking.startTime);
      const gracePeriod = 10 * 60 * 1000; // 10 minutes in ms
      
      const timeUntilGraceExpiry = (meetingStart.getTime() + gracePeriod) - now.getTime();
      setTimeLeft(Math.max(0, timeUntilGraceExpiry));
    }, 1000);

    return () => clearInterval(interval);
  }, [booking.startTime]);

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    onCheckIn(booking.id);
    toast({
      title: "Checked in successfully! 🎉",
      description: "Enjoy your meeting. We've got your back!",
    });
  };

  const handleExtend = (minutes: number) => {
    onExtend(booking.id, minutes);
    toast({
      title: `Meeting extended by ${minutes} minutes`,
      description: "Your time has been updated successfully.",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto animate-scale-in">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <MapPin className="h-5 w-5" />
          {booking.roomName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{booking.title}</p>
      </CardHeader>

      <CardContent className="space-y-6 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
              {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          {!isCheckedIn && timeLeft > 0 && (
            <div className="text-warning">
              <Badge variant="outline" className="border-warning text-warning">
                Check in within {formatTimeLeft(timeLeft)}
              </Badge>
            </div>
          )}
        </div>

        {!isCheckedIn ? (
          <div className="space-y-4">
            <div className="bg-muted p-6 rounded-lg">
              <QrCode className="h-16 w-16 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Scan QR code or tap below to check in
              </p>
            </div>
            
            <Button
              onClick={handleCheckIn}
              className="w-full bg-gradient-success hover:shadow-lg transition-all duration-200"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Check In Now
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-success/10 p-4 rounded-lg">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success animate-pulse-success" />
              <p className="text-success font-medium">Checked In!</p>
              <p className="text-sm text-muted-foreground">Meeting is active</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleExtend(15)}
                className="text-sm"
              >
                +15 min
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExtend(30)}
                className="text-sm"
              >
                +30 min
              </Button>
            </div>

            <Button
              variant="secondary"
              onClick={() => onEndEarly(booking.id)}
              className="w-full"
            >
              End Meeting Early
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Tip: Rooms are auto-released if not checked in within 10 minutes</p>
        </div>
      </CardContent>
    </Card>
  );
};