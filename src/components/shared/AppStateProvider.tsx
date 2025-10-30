import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { classifyError, ErrorType } from '@/lib/queryClient';
import { useNetworkStatus } from './NetworkStatusProvider';

// State types
interface LoadingState {
    [key: string]: {
        isLoading: boolean;
        text?: string;
        progress?: number;
        stage?: string;
    };
}

interface ErrorState {
    [key: string]: {
        error: Error;
        timestamp: number;
        retryCount: number;
        context?: any;
    };
}

interface AppState {
    loading: LoadingState;
    errors: ErrorState;
    globalLoading: boolean;
    globalError: Error | null;
}

// Action types
type AppAction =
    | { type: 'SET_LOADING'; key: string; isLoading: boolean; text?: string; progress?: number; stage?: string }
    | { type: 'SET_ERROR'; key: string; error: Error; context?: any }
    | { type: 'CLEAR_ERROR'; key: string }
    | { type: 'RETRY_ERROR'; key: string }
    | { type: 'SET_GLOBAL_LOADING'; isLoading: boolean }
    | { type: 'SET_GLOBAL_ERROR'; error: Error | null }
    | { type: 'CLEAR_ALL_ERRORS' }
    | { type: 'CLEAR_ALL_LOADING' };

// Initial state
const initialState: AppState = {
    loading: {},
    errors: {},
    globalLoading: false,
    globalError: null,
};

// Reducer
const appStateReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_LOADING':
            return {
                ...state,
                loading: {
                    ...state.loading,
                    [action.key]: {
                        isLoading: action.isLoading,
                        text: action.text,
                        progress: action.progress,
                        stage: action.stage,
                    },
                },
            };

        case 'SET_ERROR':
            return {
                ...state,
                errors: {
                    ...state.errors,
                    [action.key]: {
                        error: action.error,
                        timestamp: Date.now(),
                        retryCount: state.errors[action.key]?.retryCount || 0,
                        context: action.context,
                    },
                },
            };

        case 'CLEAR_ERROR':
            const { [action.key]: removedError, ...remainingErrors } = state.errors;
            return {
                ...state,
                errors: remainingErrors,
            };

        case 'RETRY_ERROR':
            if (state.errors[action.key]) {
                return {
                    ...state,
                    errors: {
                        ...state.errors,
                        [action.key]: {
                            ...state.errors[action.key],
                            retryCount: state.errors[action.key].retryCount + 1,
                        },
                    },
                };
            }
            return state;

        case 'SET_GLOBAL_LOADING':
            return {
                ...state,
                globalLoading: action.isLoading,
            };

        case 'SET_GLOBAL_ERROR':
            return {
                ...state,
                globalError: action.error,
            };

        case 'CLEAR_ALL_ERRORS':
            return {
                ...state,
                errors: {},
                globalError: null,
            };

        case 'CLEAR_ALL_LOADING':
            return {
                ...state,
                loading: {},
                globalLoading: false,
            };

        default:
            return state;
    }
};

// Context
interface AppStateContextType {
    state: AppState;

    // Loading methods
    setLoading: (key: string, isLoading: boolean, options?: {
        text?: string;
        progress?: number;
        stage?: string;
    }) => void;
    isLoading: (key: string) => boolean;
    getLoadingState: (key: string) => LoadingState[string] | undefined;
    isAnyLoading: () => boolean;
    clearAllLoading: () => void;

    // Error methods
    setError: (key: string, error: Error, context?: any) => void;
    clearError: (key: string) => void;
    retryError: (key: string) => void;
    getError: (key: string) => ErrorState[string] | undefined;
    hasError: (key: string) => boolean;
    hasAnyError: () => boolean;
    clearAllErrors: () => void;

    // Global state methods
    setGlobalLoading: (isLoading: boolean) => void;
    setGlobalError: (error: Error | null) => void;

    // Utility methods
    withLoading: <T>(key: string, operation: () => Promise<T>, options?: {
        text?: string;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        showSuccessToast?: boolean;
        showErrorToast?: boolean;
    }) => Promise<T>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
};

// Provider component
interface AppStateProviderProps {
    children: React.ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appStateReducer, initialState);
    const { isOffline } = useNetworkStatus();

    // Loading methods
    const setLoading = useCallback((
        key: string,
        isLoading: boolean,
        options?: { text?: string; progress?: number; stage?: string }
    ) => {
        dispatch({
            type: 'SET_LOADING',
            key,
            isLoading,
            text: options?.text,
            progress: options?.progress,
            stage: options?.stage,
        });
    }, []);

    const isLoading = useCallback((key: string) => {
        return state.loading[key]?.isLoading || false;
    }, [state.loading]);

    const getLoadingState = useCallback((key: string) => {
        return state.loading[key];
    }, [state.loading]);

    const isAnyLoading = useCallback(() => {
        return Object.values(state.loading).some(loading => loading.isLoading) || state.globalLoading;
    }, [state.loading, state.globalLoading]);

    const clearAllLoading = useCallback(() => {
        dispatch({ type: 'CLEAR_ALL_LOADING' });
    }, []);

    // Error methods
    const setError = useCallback((key: string, error: Error, context?: any) => {
        const classifiedError = classifyError(error);
        dispatch({ type: 'SET_ERROR', key, error: classifiedError, context });

        // Log error
        console.error(`Error in ${key}:`, classifiedError, context);
    }, []);

    const clearError = useCallback((key: string) => {
        dispatch({ type: 'CLEAR_ERROR', key });
    }, []);

    const retryError = useCallback((key: string) => {
        dispatch({ type: 'RETRY_ERROR', key });
    }, []);

    const getError = useCallback((key: string) => {
        return state.errors[key];
    }, [state.errors]);

    const hasError = useCallback((key: string) => {
        return !!state.errors[key];
    }, [state.errors]);

    const hasAnyError = useCallback(() => {
        return Object.keys(state.errors).length > 0 || !!state.globalError;
    }, [state.errors, state.globalError]);

    const clearAllErrors = useCallback(() => {
        dispatch({ type: 'CLEAR_ALL_ERRORS' });
    }, []);

    // Global state methods
    const setGlobalLoading = useCallback((isLoading: boolean) => {
        dispatch({ type: 'SET_GLOBAL_LOADING', isLoading });
    }, []);

    const setGlobalError = useCallback((error: Error | null) => {
        dispatch({ type: 'SET_GLOBAL_ERROR', error });
    }, []);

    // Utility method to wrap operations with loading and error handling
    const withLoading = useCallback(
        async (
            key: string,
            operation: () => Promise<any>,
            options?: {
                text?: string;
                onSuccess?: (result: any) => void;
                onError?: (error: Error) => void;
                showSuccessToast?: boolean;
                showErrorToast?: boolean;
            }
        ): Promise<any> => {
            const {
                text = 'Loading...',
                onSuccess,
                onError,
                showSuccessToast = false,
                showErrorToast = true,
            } = options || {};

            // Check if offline for operations that require network
            if (isOffline) {
                const offlineError = new Error('This operation requires an internet connection.');
                setError(key, offlineError);

                if (showErrorToast) {
                    toast({
                        title: 'Offline',
                        description: 'This operation requires an internet connection.',
                        variant: 'destructive',
                    });
                }

                onError?.(offlineError);
                throw offlineError;
            }

            setLoading(key, true, { text });
            clearError(key);

            try {
                const result = await operation();

                if (showSuccessToast) {
                    toast({
                        title: 'Success',
                        description: 'Operation completed successfully.',
                    });
                }

                onSuccess?.(result);
                return result;
            } catch (error) {
                const err = error as Error;
                setError(key, err);

                if (showErrorToast) {
                    const classifiedError = classifyError(err);
                    toast({
                        title: 'Error',
                        description: classifiedError.message,
                        variant: 'destructive',
                    });
                }

                onError?.(err);
                throw err;
            } finally {
                setLoading(key, false);
            }
        },
        [isOffline, setLoading, setError, clearError]
    );

    // Auto-clear old errors (older than 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            Object.entries(state.errors).forEach(([key, errorState]) => {
                if (now - errorState.timestamp > fiveMinutes) {
                    clearError(key);
                }
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [state.errors, clearError]);

    const value: AppStateContextType = {
        state,

        // Loading methods
        setLoading,
        isLoading,
        getLoadingState,
        isAnyLoading,
        clearAllLoading,

        // Error methods
        setError,
        clearError,
        retryError,
        getError,
        hasError,
        hasAnyError,
        clearAllErrors,

        // Global state methods
        setGlobalLoading,
        setGlobalError,

        // Utility methods
        withLoading,
    };

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
};

// Specialized hooks for common patterns
export const useLoadingState = (key: string) => {
    const { isLoading, getLoadingState, setLoading } = useAppState();

    return {
        isLoading: isLoading(key),
        loadingState: getLoadingState(key),
        setLoading: (loading: boolean, options?: { text?: string; progress?: number; stage?: string }) =>
            setLoading(key, loading, options),
    };
};

export const useErrorState = (key: string) => {
    const { hasError, getError, setError, clearError, retryError } = useAppState();

    return {
        hasError: hasError(key),
        error: getError(key),
        setError: (error: Error, context?: any) => setError(key, error, context),
        clearError: () => clearError(key),
        retryError: () => retryError(key),
    };
};

export const useAsyncState = (key: string) => {
    const { withLoading } = useAppState();
    const { isLoading, setLoading } = useLoadingState(key);
    const { hasError, error, clearError } = useErrorState(key);

    return {
        isLoading,
        hasError,
        error,
        execute: (operation: () => Promise<any>, options?: Parameters<typeof withLoading>[2]) =>
            withLoading(key, operation, options),
        setLoading,
        clearError,
    };
};