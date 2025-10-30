import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

// Error types for better error handling
export enum ErrorType {
    NETWORK_ERROR = 'NETWORK_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    BOOKING_CONFLICT = 'BOOKING_CONFLICT',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    NOT_FOUND = 'NOT_FOUND',
    SERVER_ERROR = 'SERVER_ERROR',
    OFFLINE_ERROR = 'OFFLINE_ERROR'
}

export interface AppError extends Error {
    type: ErrorType;
    details?: any;
    retryable: boolean;
    statusCode?: number;
}

// Create a custom error class
export class CustomError extends Error implements AppError {
    type: ErrorType;
    details?: any;
    retryable: boolean;
    statusCode?: number;

    constructor(
        message: string,
        type: ErrorType = ErrorType.SERVER_ERROR,
        retryable: boolean = true,
        details?: any,
        statusCode?: number
    ) {
        super(message);
        this.name = 'CustomError';
        this.type = type;
        this.retryable = retryable;
        this.details = details;
        this.statusCode = statusCode;
    }
}

// Error classification helper
export const classifyError = (error: any): AppError => {
    // Network errors
    if (!navigator.onLine) {
        return new CustomError(
            'You appear to be offline. Please check your internet connection.',
            ErrorType.OFFLINE_ERROR,
            true,
            error
        );
    }

    // Supabase/PostgreSQL errors
    if (error?.code) {
        switch (error.code) {
            case 'PGRST116': // Not found
                return new CustomError(
                    'The requested resource was not found.',
                    ErrorType.NOT_FOUND,
                    false,
                    error,
                    404
                );
            case 'PGRST301': // Permission denied
                return new CustomError(
                    'You do not have permission to perform this action.',
                    ErrorType.PERMISSION_DENIED,
                    false,
                    error,
                    403
                );
            case '23505': // Unique constraint violation
                return new CustomError(
                    'This action would create a conflict. Please check your data.',
                    ErrorType.VALIDATION_ERROR,
                    false,
                    error,
                    409
                );
            case '23503': // Foreign key constraint violation
                return new CustomError(
                    'This action cannot be completed due to related data.',
                    ErrorType.VALIDATION_ERROR,
                    false,
                    error,
                    409
                );
            default:
                return new CustomError(
                    error.message || 'A database error occurred.',
                    ErrorType.SERVER_ERROR,
                    true,
                    error,
                    500
                );
        }
    }

    // HTTP errors
    if (error?.status || error?.statusCode) {
        const status = error.status || error.statusCode;
        switch (status) {
            case 400:
                return new CustomError(
                    'Invalid request. Please check your input.',
                    ErrorType.VALIDATION_ERROR,
                    false,
                    error,
                    400
                );
            case 401:
                return new CustomError(
                    'Authentication required. Please sign in.',
                    ErrorType.PERMISSION_DENIED,
                    false,
                    error,
                    401
                );
            case 403:
                return new CustomError(
                    'You do not have permission to perform this action.',
                    ErrorType.PERMISSION_DENIED,
                    false,
                    error,
                    403
                );
            case 404:
                return new CustomError(
                    'The requested resource was not found.',
                    ErrorType.NOT_FOUND,
                    false,
                    error,
                    404
                );
            case 409:
                return new CustomError(
                    'A conflict occurred. This may be a booking conflict.',
                    ErrorType.BOOKING_CONFLICT,
                    false,
                    error,
                    409
                );
            case 429:
                return new CustomError(
                    'Too many requests. Please wait a moment and try again.',
                    ErrorType.SERVER_ERROR,
                    true,
                    error,
                    429
                );
            case 500:
            case 502:
            case 503:
            case 504:
                return new CustomError(
                    'Server error. Please try again in a moment.',
                    ErrorType.SERVER_ERROR,
                    true,
                    error,
                    status
                );
            default:
                return new CustomError(
                    error.message || 'An unexpected error occurred.',
                    ErrorType.SERVER_ERROR,
                    true,
                    error,
                    status
                );
        }
    }

    // Network/fetch errors
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        return new CustomError(
            'Network error. Please check your internet connection.',
            ErrorType.NETWORK_ERROR,
            true,
            error
        );
    }

    // Booking conflict errors (custom business logic)
    if (error?.message?.toLowerCase().includes('conflict')) {
        return new CustomError(
            error.message || 'A booking conflict was detected.',
            ErrorType.BOOKING_CONFLICT,
            false,
            error,
            409
        );
    }

    // Default error
    return new CustomError(
        error?.message || 'An unexpected error occurred.',
        ErrorType.SERVER_ERROR,
        true,
        error
    );
};

// Retry logic based on error type
const shouldRetry = (failureCount: number, error: any): boolean => {
    const classifiedError = classifyError(error);

    // Don't retry non-retryable errors
    if (!classifiedError.retryable) {
        return false;
    }

    // Don't retry after 3 attempts
    if (failureCount >= 3) {
        return false;
    }

    // Retry network and server errors
    return [
        ErrorType.NETWORK_ERROR,
        ErrorType.SERVER_ERROR,
        ErrorType.OFFLINE_ERROR
    ].includes(classifiedError.type);
};

// Retry delay with exponential backoff
const getRetryDelay = (attemptIndex: number): number => {
    return Math.min(1000 * 2 ** attemptIndex, 30000); // Max 30 seconds
};

// Global error handler for queries
const handleQueryError = (error: any, query: any) => {
    const classifiedError = classifyError(error);

    console.error('Query error:', {
        queryKey: query.queryKey,
        error: classifiedError,
        originalError: error
    });

    // Don't show toast for certain error types to avoid spam
    const silentErrors = [
        ErrorType.NOT_FOUND,
        ErrorType.PERMISSION_DENIED
    ];

    if (!silentErrors.includes(classifiedError.type)) {
        toast({
            title: 'Error',
            description: classifiedError.message,
            variant: 'destructive',
        });
    }
};

// Global error handler for mutations
const handleMutationError = (error: any, variables: any, context: any, mutation: any) => {
    const classifiedError = classifyError(error);

    console.error('Mutation error:', {
        mutationKey: mutation.options.mutationKey,
        variables,
        error: classifiedError,
        originalError: error
    });

    // Always show mutation errors as they're user-initiated actions
    toast({
        title: 'Action Failed',
        description: classifiedError.message,
        variant: 'destructive',
    });
};

// Create the enhanced QueryClient
export const createQueryClient = (): QueryClient => {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: handleQueryError,
        }),
        mutationCache: new MutationCache({
            onError: handleMutationError,
        }),
        defaultOptions: {
            queries: {
                // Retry configuration
                retry: shouldRetry,
                retryDelay: getRetryDelay,

                // Enhanced stale time configuration based on data type
                staleTime: 2 * 60 * 1000, // 2 minutes default
                gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)

                // Refetch configuration - optimized for performance
                refetchOnWindowFocus: false, // Disabled to reduce unnecessary requests
                refetchOnReconnect: true,
                refetchOnMount: true,

                // Network mode
                networkMode: 'online',

                // Error handling
                throwOnError: false,

                // Performance optimizations
                refetchInterval: false, // Disable automatic refetching
                refetchIntervalInBackground: false,
            },
            mutations: {
                // Retry configuration for mutations
                retry: (failureCount, error) => {
                    const classifiedError = classifyError(error);

                    // Only retry network errors for mutations, and only once
                    return failureCount < 1 && classifiedError.type === ErrorType.NETWORK_ERROR;
                },
                retryDelay: getRetryDelay,

                // Network mode
                networkMode: 'online',

                // Error handling
                throwOnError: false,
            },
        },
    });
};

// Utility functions for error handling
export const isRetryableError = (error: any): boolean => {
    const classifiedError = classifyError(error);
    return classifiedError.retryable;
};

export const getErrorMessage = (error: any): string => {
    const classifiedError = classifyError(error);
    return classifiedError.message;
};

export const getErrorType = (error: any): ErrorType => {
    const classifiedError = classifyError(error);
    return classifiedError.type;
};