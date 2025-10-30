import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { classifyError, ErrorType } from '@/lib/queryClient';
import { useNetworkStatus } from '@/components/shared/NetworkStatusProvider';

interface AsyncOperationState<T = any> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
}

interface AsyncOperationOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    retryable?: boolean;
    maxRetries?: number;
}

export const useAsyncOperation = <T = any>(
    operation: (...args: any[]) => Promise<T>,
    options: AsyncOperationOptions = {}
) => {
    const {
        onSuccess,
        onError,
        showSuccessToast = false,
        showErrorToast = true,
        successMessage = 'Operation completed successfully',
        retryable = true,
        maxRetries = 3
    } = options;

    const { isOffline } = useNetworkStatus();
    const [state, setState] = useState<AsyncOperationState<T>>({
        data: null,
        error: null,
        isLoading: false,
        isSuccess: false,
        isError: false,
    });

    const retryCountRef = useRef(0);
    const operationRef = useRef(operation);
    operationRef.current = operation;

    const reset = useCallback(() => {
        setState({
            data: null,
            error: null,
            isLoading: false,
            isSuccess: false,
            isError: false,
        });
        retryCountRef.current = 0;
    }, []);

    const execute = useCallback(async (...args: any[]) => {
        // Check if offline and operation requires network
        if (isOffline) {
            const offlineError = new Error('Operation cannot be performed while offline');
            setState({
                data: null,
                error: offlineError,
                isLoading: false,
                isSuccess: false,
                isError: true,
            });

            if (showErrorToast) {
                toast({
                    title: 'Offline',
                    description: 'This action requires an internet connection.',
                    variant: 'destructive',
                });
            }

            onError?.(offlineError);
            return;
        }

        setState(prev => ({
            ...prev,
            isLoading: true,
            isError: false,
            error: null,
        }));

        try {
            const result = await operationRef.current(...args);

            setState({
                data: result,
                error: null,
                isLoading: false,
                isSuccess: true,
                isError: false,
            });

            if (showSuccessToast) {
                toast({
                    title: 'Success',
                    description: successMessage,
                });
            }

            onSuccess?.(result);
            retryCountRef.current = 0;
            return result;
        } catch (error: any) {
            const classifiedError = classifyError(error);

            setState({
                data: null,
                error: classifiedError,
                isLoading: false,
                isSuccess: false,
                isError: true,
            });

            // Handle retries for retryable errors
            if (retryable &&
                classifiedError.retryable &&
                retryCountRef.current < maxRetries &&
                [ErrorType.NETWORK_ERROR, ErrorType.SERVER_ERROR].includes(classifiedError.type)) {

                retryCountRef.current++;

                // Exponential backoff delay
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);

                setTimeout(() => {
                    execute(...args);
                }, delay);

                if (showErrorToast && retryCountRef.current === 1) {
                    toast({
                        title: 'Retrying...',
                        description: `Attempt ${retryCountRef.current} of ${maxRetries}`,
                    });
                }

                return;
            }

            // Show error toast if not retrying
            if (showErrorToast) {
                toast({
                    title: 'Error',
                    description: classifiedError.message,
                    variant: 'destructive',
                });
            }

            onError?.(classifiedError);
            throw classifiedError;
        }
    }, [isOffline, showSuccessToast, showErrorToast, successMessage, onSuccess, onError, retryable, maxRetries]);

    const retry = useCallback(() => {
        if (state.isError && retryable) {
            retryCountRef.current = 0;
            // Note: This requires the last arguments to be stored, which is a limitation
            // In practice, you'd call execute() again with the same arguments
            console.warn('retry() called but no arguments stored. Call execute() again instead.');
        }
    }, [state.isError, retryable]);

    return {
        ...state,
        execute,
        retry,
        reset,
        canRetry: state.isError && retryable && retryCountRef.current < maxRetries,
        retryCount: retryCountRef.current,
    };
};

// Specialized hook for form submissions
export const useFormSubmission = <T = any>(
    submitFn: (data: any) => Promise<T>,
    options: AsyncOperationOptions = {}
) => {
    return useAsyncOperation(submitFn, {
        showSuccessToast: true,
        successMessage: 'Form submitted successfully',
        retryable: false, // Forms usually shouldn't auto-retry
        ...options,
    });
};

// Specialized hook for data fetching with retry
export const useDataFetch = <T = any>(
    fetchFn: () => Promise<T>,
    options: AsyncOperationOptions = {}
) => {
    return useAsyncOperation(fetchFn, {
        showErrorToast: false, // Let the UI handle fetch errors
        retryable: true,
        maxRetries: 3,
        ...options,
    });
};

// Hook for handling multiple async operations
export const useBatchAsyncOperation = <T = any>(
    operations: Array<() => Promise<T>>,
    options: AsyncOperationOptions = {}
) => {
    const [state, setState] = useState<AsyncOperationState<T[]>>({
        data: null,
        error: null,
        isLoading: false,
        isSuccess: false,
        isError: false,
    });

    const { isOffline } = useNetworkStatus();

    const execute = useCallback(async () => {
        if (isOffline) {
            const offlineError = new Error('Batch operations cannot be performed while offline');
            setState({
                data: null,
                error: offlineError,
                isLoading: false,
                isSuccess: false,
                isError: true,
            });
            return;
        }

        setState(prev => ({
            ...prev,
            isLoading: true,
            isError: false,
            error: null,
        }));

        try {
            const results = await Promise.all(operations.map(op => op()));

            setState({
                data: results,
                error: null,
                isLoading: false,
                isSuccess: true,
                isError: false,
            });

            options.onSuccess?.(results);
            return results;
        } catch (error: any) {
            const classifiedError = classifyError(error);

            setState({
                data: null,
                error: classifiedError,
                isLoading: false,
                isSuccess: false,
                isError: true,
            });

            if (options.showErrorToast !== false) {
                toast({
                    title: 'Batch Operation Failed',
                    description: classifiedError.message,
                    variant: 'destructive',
                });
            }

            options.onError?.(classifiedError);
            throw classifiedError;
        }
    }, [operations, isOffline, options]);

    return {
        ...state,
        execute,
    };
};