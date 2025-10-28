import { Tables } from './database';

// Core user types from database
export type User = Tables<'users'>;
export type UserInsert = Tables<'users'>['Insert'];
export type UserUpdate = Tables<'users'>['Update'];

// User role enum
export type UserRole = 'staff' | 'admin';

// User profile form data interface
export interface UserProfileFormData {
    full_name: string;
    avatar_url?: string;
    department?: string;
}

// User with booking statistics
export interface UserWithStats extends User {
    total_bookings?: number;
    active_bookings?: number;
    cancelled_bookings?: number;
}

// Auth user interface (from Supabase Auth)
export interface AuthUser {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
    };
    app_metadata?: {
        role?: UserRole;
    };
}

// User session interface
export interface UserSession {
    user: AuthUser;
    profile?: User;
    access_token: string;
    refresh_token: string;
    expires_at?: number;
}