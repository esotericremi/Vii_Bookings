// Database types
export * from './database';

// Entity types
export * from './user';
export * from './room';
export * from './booking';
export * from './notification';
export * from './settings';

// Common utility types
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    count: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface ErrorResponse {
    error: string;
    message: string;
    details?: any;
}

// Form validation types
export interface ValidationError {
    field: string;
    message: string;
}

export interface FormState<T = any> {
    data: T;
    errors: ValidationError[];
    isSubmitting: boolean;
    isValid: boolean;
}

// Real-time subscription types
export interface RealtimePayload<T = any> {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new?: T;
    old?: T;
    errors?: any;
}

// Filter and sort types
export interface SortOption {
    field: string;
    direction: 'asc' | 'desc';
}

export interface FilterOption {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
    value: any;
}

export interface QueryOptions {
    page?: number;
    per_page?: number;
    sort?: SortOption[];
    filters?: FilterOption[];
    search?: string;
}