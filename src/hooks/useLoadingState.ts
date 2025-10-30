import { useState, useCallback, useRef, useEffect } from 'react';
import { useNetworkStatus } from '@/components/shared/NetworkStatusProvider';

interface LoadingState {
    isLoading: boolean;
    loadingText: string;
    progress?: number;
    stage?: string;
}

interface LoadingOptions {
    initialText?: string;
    showProgress?: boolean;
    stages?: string[];
    minDuration?: number; // Minimum loading duration to prevent flashing
}

export const useLoadingState = (options: LoadingOptions = {}) => {
    const {
        initialText = 'Loading...',
        showProgress = false,
        stages = [],
        minDuration = 300
    } = options;

    const { isOffline, isSlowConnection } = useNetworkStatus();
    const [state, setState] = useState<LoadingState>({
        isLoading: false,
        loadingText: initialText,
        progress: showProgress ? 0 : undefined,
        stage: stages.length > 0 ? stages[0] : undefined,
    });

    const startTimeRef = useRef<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startLoading = useCallback((text?: string) => {
        startTimeRef.current = Date.now();
        setState({
            isLoading: true,
            loadingText: text || initialText,
            progress: showProgress ? 0 : undefined,
            stage: stages.length > 0 ? stages[0] : undefined,
        });
    }, [initialText, showProgress, stages]);

    const updateProgress = useCallback((progress: number, stage?: string) => {
        setState(prev => ({
            ...prev,
            progress: showProgress ? Math.max(0, Math.min(100, progress)) : undefined,
            stage: stage || prev.stage,
        }));
    }, [showProgress]);

    const updateText = useCallback((text: string) => {
        setState(prev => ({
            ...prev,
            loadingText: text,
        }));
    }, []);

    const updateStage = useCallback((stageIndex: number) => {
        if (stages.length > 0 && stageIndex >= 0 && stageIndex < stages.length) {
            setState(prev => ({
                ...prev,
                stage: stages[stageIndex],
                progress: showProgress ? (stageIndex / stages.length) * 100 : prev.progress,
            }));
        }
    }, [stages, showProgress]);

    const stopLoading = useCallback(() => {
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : minDuration;
        const remainingTime = Math.max(0, minDuration - elapsed);

        if (remainingTime > 0) {
            // Ensure minimum loading duration to prevent flashing
            timeoutRef.current = setTimeout(() => {
                setState({
                    isLoading: false,
                    loadingText: initialText,
                    progress: showProgress ? 0 : undefined,
                    stage: stages.length > 0 ? stages[0] : undefined,
                });
            }, remainingTime);
        } else {
            setState({
                isLoading: false,
                loadingText: initialText,
                progress: showProgress ? 0 : undefined,
                stage: stages.length > 0 ? stages[0] : undefined,
            });
        }
    }, [initialText, showProgress, stages, minDuration]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Adjust loading text based on network status
    const getContextualLoadingText = useCallback(() => {
        if (isOffline) {
            return 'Waiting for connection...';
        }
        if (isSlowConnection) {
            return `${state.loadingText} (slow connection)`;
        }
        return state.loadingText;
    }, [state.loadingText, isOffline, isSlowConnection]);

    return {
        ...state,
        loadingText: getContextualLoadingText(),
        startLoading,
        stopLoading,
        updateProgress,
        updateText,
        updateStage,
        isOffline,
        isSlowConnection,
    };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = () => {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    const setLoading = useCallback((key: string, isLoading: boolean) => {
        setLoadingStates(prev => ({
            ...prev,
            [key]: isLoading,
        }));
    }, []);

    const isAnyLoading = Object.values(loadingStates).some(Boolean);
    const getLoadingKeys = () => Object.keys(loadingStates).filter(key => loadingStates[key]);

    return {
        loadingStates,
        setLoading,
        isAnyLoading,
        getLoadingKeys,
    };
};

// Hook for sequential loading operations
export const useSequentialLoading = (operations: Array<{
    key: string;
    label: string;
    operation: () => Promise<any>;
}>) => {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [results, setResults] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, Error>>({});
    const [isRunning, setIsRunning] = useState(false);

    const execute = useCallback(async () => {
        setIsRunning(true);
        setCurrentIndex(0);
        setResults({});
        setErrors({});

        for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];
            setCurrentIndex(i);

            try {
                const result = await operation.operation();
                setResults(prev => ({ ...prev, [operation.key]: result }));
            } catch (error) {
                setErrors(prev => ({ ...prev, [operation.key]: error as Error }));
                // Stop on first error
                break;
            }
        }

        setCurrentIndex(-1);
        setIsRunning(false);
    }, [operations]);

    const currentOperation = currentIndex >= 0 ? operations[currentIndex] : null;
    const progress = operations.length > 0 ? ((currentIndex + 1) / operations.length) * 100 : 0;
    const isComplete = currentIndex === -1 && isRunning === false && Object.keys(results).length > 0;
    const hasErrors = Object.keys(errors).length > 0;

    return {
        execute,
        currentOperation,
        currentIndex,
        progress,
        isRunning,
        isComplete,
        hasErrors,
        results,
        errors,
    };
};

// Hook for debounced loading states (useful for search/filter operations)
export const useDebouncedLoading = (delay: number = 300) => {
    const [isLoading, setIsLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startLoading = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsLoading(true);
    }, []);

    const stopLoading = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsLoading(false);
        }, delay);
    }, [delay]);

    const stopLoadingImmediate = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        isLoading,
        startLoading,
        stopLoading,
        stopLoadingImmediate,
    };
};