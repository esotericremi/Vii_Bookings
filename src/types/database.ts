export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string;
                    avatar_url: string | null;
                    role: 'staff' | 'admin';
                    department: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name: string;
                    avatar_url?: string | null;
                    role?: 'staff' | 'admin';
                    department?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string;
                    avatar_url?: string | null;
                    role?: 'staff' | 'admin';
                    department?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            rooms: {
                Row: {
                    id: string;
                    name: string;
                    capacity: number;
                    location: string;
                    floor: string;
                    equipment: string[];
                    description: string | null;
                    image_url: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    capacity: number;
                    location: string;
                    floor: string;
                    equipment?: string[];
                    description?: string | null;
                    image_url?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    capacity?: number;
                    location?: string;
                    floor?: string;
                    equipment?: string[];
                    description?: string | null;
                    image_url?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            bookings: {
                Row: {
                    id: string;
                    room_id: string;
                    user_id: string;
                    title: string;
                    description: string | null;
                    start_time: string;
                    end_time: string;
                    attendees: string[];
                    status: 'confirmed' | 'cancelled' | 'pending';
                    is_admin_override: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    room_id: string;
                    user_id: string;
                    title: string;
                    description?: string | null;
                    start_time: string;
                    end_time: string;
                    attendees?: string[];
                    status?: 'confirmed' | 'cancelled' | 'pending';
                    is_admin_override?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    room_id?: string;
                    user_id?: string;
                    title?: string;
                    description?: string | null;
                    start_time?: string;
                    end_time?: string;
                    attendees?: string[];
                    status?: 'confirmed' | 'cancelled' | 'pending';
                    is_admin_override?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            system_settings: {
                Row: {
                    id: string;
                    max_booking_duration: number;
                    advance_notice_hours: number;
                    buffer_time_minutes: number;
                    company_name: string;
                    company_logo_url: string | null;
                    theme_color: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    max_booking_duration?: number;
                    advance_notice_hours?: number;
                    buffer_time_minutes?: number;
                    company_name?: string;
                    company_logo_url?: string | null;
                    theme_color?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    max_booking_duration?: number;
                    advance_notice_hours?: number;
                    buffer_time_minutes?: number;
                    company_name?: string;
                    company_logo_url?: string | null;
                    theme_color?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    message: string;
                    type: 'booking_confirmed' | 'booking_cancelled' | 'booking_modified' | 'admin_override' | 'system_error';
                    is_read: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    message: string;
                    type: 'booking_confirmed' | 'booking_cancelled' | 'booking_modified' | 'admin_override' | 'system_error';
                    is_read?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    message?: string;
                    type?: 'booking_confirmed' | 'booking_cancelled' | 'booking_modified' | 'admin_override' | 'system_error';
                    is_read?: boolean;
                    created_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

// Type helpers for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];