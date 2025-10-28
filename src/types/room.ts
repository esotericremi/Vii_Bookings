import { Tables } from './database';

// Core room types from database
export type Room = Tables<'rooms'>;
export type RoomInsert = Tables<'rooms'>['Insert'];
export type RoomUpdate = Tables<'rooms'>['Update'];

// Extended room interface with computed properties
export interface RoomWithAvailability extends Room {
  is_available?: boolean;
  current_booking?: Booking;
  next_available_time?: string;
}

// Room form data interface
export interface RoomFormData {
  name: string;
  capacity: number;
  location: string;
  floor: string;
  equipment?: string[];
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

// Room filter interface
export interface RoomFilter {
  capacity_min?: number;
  capacity_max?: number;
  floor?: string;
  equipment?: string[];
  location?: string;
  search?: string;
  is_active?: boolean;
}

// Room utilization interface
export interface RoomUtilization {
  room_id: string;
  room_name: string;
  total_hours_booked: number;
  total_hours_available: number;
  utilization_percentage: number;
  booking_count: number;
}

// Import types for relations
import type { Booking } from './booking';