export interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: number;
  amenities: string[];
  description?: string;
  image?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  userEmail: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  status: 'confirmed' | 'pending' | 'checked-in' | 'cancelled';
  checkedInAt?: Date;
  createdAt: Date;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  booking?: Booking;
}

export interface RoomAvailability {
  roomId: string;
  date: string;
  slots: TimeSlot[];
}