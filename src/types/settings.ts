import { Tables } from './database';

// Core system settings types from database
export type SystemSettings = Tables<'system_settings'>;
export type SystemSettingsInsert = Tables<'system_settings'>['Insert'];
export type SystemSettingsUpdate = Tables<'system_settings'>['Update'];

// System settings form data interface
export interface SystemSettingsFormData {
    max_booking_duration: number;
    advance_notice_hours: number;
    buffer_time_minutes: number;
    company_name: string;
    company_logo_url?: string;
    theme_color: string;
}

// Default system settings
export const DEFAULT_SYSTEM_SETTINGS: Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'> = {
    max_booking_duration: 480, // 8 hours in minutes
    advance_notice_hours: 0,
    buffer_time_minutes: 0,
    company_name: 'Company',
    company_logo_url: null,
    theme_color: '#ff304f'
};

// User role management types
export interface UserRoleUpdate {
    id: string;
    role: 'staff' | 'admin';
}

export interface UserManagementData {
    id: string;
    email: string;
    full_name: string;
    role: 'staff' | 'admin';
    department: string | null;
    created_at: string;
}