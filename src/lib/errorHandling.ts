import { toast } from '@/hooks/use-toast';
import { ErrorType, classifyError } from './queryClient';

// Global error handler registry
type ErrorHandler = (error: Error, context?: any) => void;
const errorHandlers = new Map<string, ErrorHandler>();

// Register a global error handler
export const registerErrorHandler = (key: string, handler: ErrorHandler) => {
    errorHandlers.set(key, handler);
};

// Unregister an error handler
export const unregisterErrorHandler = (key: string) => {
    errorHandlers.delete(key);
};

// Handle errors globally
export const handleGlobalError = (error: Error, context?: any) => {
    const classifiedError = classifyError(error);

    // Log error
    console.error('Global error:', {
        error: classifiedError,
        context,
        timestamp: new Date().toISOString(),
    });

    // Call registered handlers
    errorHandlers.forEach((handler, key) => {
        try {
            handler(classifiedError, context);
        } catch (handlerError) {
            console.error(`Error handler '${key}' failed:`, handlerError);
        }
    });

    // Default error handling
    if (errorHandlers.size === 0) {
        defaultErrorHandler(classifiedError, context);
    }
};

// Default error handler
const defaultErrorHandler = (error: Error, context?: any) => {
    const classifiedError = classifyError(error);

    // Don't show toasts for certain error types
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

// Error recovery strategies
export const errorRecoveryStrategies = {
    // Retry with exponential backoff
    retryWithBackoff: async (
        operation: () => Promise<any>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ) => {
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                const classifiedError = classifyError(lastError);

                // Don't retry non-retryable errors
                if (!classifiedError.retryable) {
                    throw lastError;
                }

                // Don't retry on last attempt
                if (attempt === maxRetries) {
                    throw lastError;
                }

                // Wait before retrying
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    },

    // Fallback to cached data
    fallbackToCache: async <T>(
        operation: () => Promise<T>,
        getCachedData: () => T | null,
        cacheData: (data: T) => void
    ): Promise<T> => {
        try {
            const result = await operation();
            cacheData(result);
            return result;
        } catch (error) {
            const cachedData = getCachedData();
            if (cachedData) {
                console.warn('Operation failed, using cached data:', error);
                return cachedData;
            }
            throw error;
        }
    },

    // Circuit breaker pattern
    createCircuitBreaker: (
        operation: () => Promise<any>,
        failureThreshold: number = 5,
        resetTimeout: number = 60000
    ) => {
        let failureCount = 0;
        let lastFailureTime = 0;
        let state: 'closed' | 'open' | 'half-open' = 'closed';

        return async () => {
            const now = Date.now();

            // Reset if enough time has passed
            if (state === 'open' && now - lastFailureTime > resetTimeout) {
                state = 'half-open';
                failureCount = 0;
            }

            // Reject immediately if circuit is open
            if (state === 'open') {
                throw new Error('Circuit breaker is open');
            }

            try {
                const result = await operation();

                // Reset on success
                if (state === 'half-open') {
                    state = 'closed';
                }
                failureCount = 0;

                return result;
            } catch (error) {
                failureCount++;
                lastFailureTime = now;

                // Open circuit if threshold reached
                if (failureCount >= failureThreshold) {
                    state = 'open';
                }

                throw error;
            }
        };
    },
};

// Loading state management
export class LoadingStateManager {
    private loadingStates = new Map<string, boolean>();
    private listeners = new Set<(states: Record<string, boolean>) => void>();

    setLoading(key: string, isLoading: boolean) {
        this.loadingStates.set(key, isLoading);
        this.notifyListeners();
    }

    isLoading(key: string): boolean {
        return this.loadingStates.get(key) || false;
    }

    isAnyLoading(): boolean {
        return Array.from(this.loadingStates.values()).some(Boolean);
    }

    getLoadingStates(): Record<string, boolean> {
        return Object.fromEntries(this.loadingStates);
    }

    subscribe(listener: (states: Record<string, boolean>) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        const states = this.getLoadingStates();
        this.listeners.forEach(listener => listener(states));
    }

    clear() {
        this.loadingStates.clear();
        this.notifyListeners();
    }
}

// Global loading state manager instance
export const globalLoadingManager = new LoadingStateManager();

// Utility functions for common error scenarios
export const errorUtils = {
    // Handle form validation errors
    handleFormErrors: (error: any, setFieldError?: (field: string, message: string) => void) => {
        const classifiedError = classifyError(error);

        if (classifiedError.type === ErrorType.VALIDATION_ERROR && classifiedError.details?.fields) {
            // Handle field-specific errors
            Object.entries(classifiedError.details.fields).forEach(([field, message]) => {
                setFieldError?.(field, message as string);
            });
        } else {
            // Handle general form error
            toast({
                title: 'Form Error',
                description: classifiedError.message,
                variant: 'destructive',
            });
        }
    },

    // Handle booking conflicts
    handleBookingConflict: (error: any, onConflict?: (conflictDetails: any) => void) => {
        const classifiedError = classifyError(error);

        if (classifiedError.type === ErrorType.BOOKING_CONFLICT) {
            onConflict?.(classifiedError.details);
            toast({
                title: 'Booking Conflict',
                description: 'This time slot is no longer available. Please select a different time.',
                variant: 'destructive',
            });
        } else {
            handleGlobalError(error);
        }
    },

    // Handle permission errors
    handlePermissionError: (error: any, onPermissionDenied?: () => void) => {
        const classifiedError = classifyError(error);

        if (classifiedError.type === ErrorType.PERMISSION_DENIED) {
            onPermissionDenied?.();
            toast({
                title: 'Access Denied',
                description: 'You do not have permission to perform this action.',
                variant: 'destructive',
            });
        } else {
            handleGlobalError(error);
        }
    },

    // Handle network errors
    handleNetworkError: (error: any, onRetry?: () => void) => {
        const classifiedError = classifyError(error);

        if ([ErrorType.NETWORK_ERROR, ErrorType.OFFLINE_ERROR].includes(classifiedError.type)) {
            toast({
                title: 'Connection Problem',
                description: classifiedError.message,
                variant: 'destructive',
                action: onRetry ? {
                    altText: 'Retry',
                    onClick: onRetry,
                } : undefined,
            });
        } else {
            handleGlobalError(error);
        }
    },
};

// Error boundary helpers
export const createErrorBoundaryHandler = (context: string) => {
    return (error: Error, errorInfo: any) => {
        handleGlobalError(error, { context, errorInfo });
    };
};

// Performance monitoring for error handling
export const performanceMonitor = {
    measureErrorHandling: async <T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> => {
        const startTime = performance.now();

        try {
            const result = await operation();
            const duration = performance.now() - startTime;

            console.debug(`Operation '${operationName}' completed in ${duration.toFixed(2)}ms`);
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;

            console.error(`Operation '${operationName}' failed after ${duration.toFixed(2)}ms:`, error);
            throw error;
        }
    },
};

// Initialize default error handlers
registerErrorHandler('default', defaultErrorHandler);

// Global error event listeners
if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        handleGlobalError(new Error(event.reason), { type: 'unhandledrejection' });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
        handleGlobalError(event.error || new Error(event.message), {
            type: 'javascript',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });
}