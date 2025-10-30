import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Shield, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ErrorType, classifyError } from '@/lib/queryClient';
import { useNetworkStatus } from './NetworkStatusProvider';

interface ErrorDisplayProps {
    error: Error | null;
    onRetry?: () => void;
    onDismiss?: () => void;
    className?: string;
    variant?: 'alert' | 'card' | 'inline' | 'toast';
    showDetails?: boolean;
    retryable?: boolean;
    title?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    error,
    onRetry,
    onDismiss,
    className,
    variant = 'alert',
    showDetails = false,
    retryable = true,
    title
}) => {
    const { isOffline, retryConnection } = useNetworkStatus();

    if (!error) return null;

    const classifiedError = classifyError(error);
    const isNetworkError = classifiedError.type === ErrorType.NETWORK_ERROR ||
        classifiedError.type === ErrorType.OFFLINE_ERROR;

    const getErrorIcon = () => {
        switch (classifiedError.type) {
            case ErrorType.NETWORK_ERROR:
            case ErrorType.OFFLINE_ERROR:
                return isOffline ? WifiOff : Wifi;
            case ErrorType.PERMISSION_DENIED:
                return Shield;
            case ErrorType.BOOKING_CONFLICT:
                return Clock;
            default:
                return AlertTriangle;
        }
    };

    const getErrorColor = () => {
        switch (classifiedError.type) {
            case ErrorType.NETWORK_ERROR:
            case ErrorType.OFFLINE_ERROR:
                return 'text-orange-600';
            case ErrorType.PERMISSION_DENIED:
                return 'text-red-600';
            case ErrorType.BOOKING_CONFLICT:
                return 'text-yellow-600';
            case ErrorType.VALIDATION_ERROR:
                return 'text-blue-600';
            default:
                return 'text-red-600';
        }
    };

    const getErrorBgColor = () => {
        switch (classifiedError.type) {
            case ErrorType.NETWORK_ERROR:
            case ErrorType.OFFLINE_ERROR:
                return 'bg-orange-50 border-orange-200';
            case ErrorType.PERMISSION_DENIED:
                return 'bg-red-50 border-red-200';
            case ErrorType.BOOKING_CONFLICT:
                return 'bg-yellow-50 border-yellow-200';
            case ErrorType.VALIDATION_ERROR:
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-red-50 border-red-200';
        }
    };

    const getErrorTitle = () => {
        if (title) return title;

        switch (classifiedError.type) {
            case ErrorType.NETWORK_ERROR:
                return 'Network Error';
            case ErrorType.OFFLINE_ERROR:
                return 'Offline';
            case ErrorType.PERMISSION_DENIED:
                return 'Access Denied';
            case ErrorType.BOOKING_CONFLICT:
                return 'Booking Conflict';
            case ErrorType.VALIDATION_ERROR:
                return 'Validation Error';
            case ErrorType.NOT_FOUND:
                return 'Not Found';
            case ErrorType.SERVER_ERROR:
                return 'Server Error';
            default:
                return 'Error';
        }
    };

    const getRetryAction = () => {
        if (isNetworkError && isOffline) {
            return {
                label: 'Check Connection',
                action: retryConnection
            };
        }

        if (onRetry && (retryable || classifiedError.retryable)) {
            return {
                label: 'Try Again',
                action: onRetry
            };
        }

        return null;
    };

    const Icon = getErrorIcon();
    const retryAction = getRetryAction();

    if (variant === 'inline') {
        return (
            <div className={cn('flex items-center gap-2 text-sm', getErrorColor(), className)}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{classifiedError.message}</span>
                {retryAction && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={retryAction.action}
                        className="h-6 px-2 text-xs"
                    >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {retryAction.label}
                    </Button>
                )}
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <Card className={cn('border-2', getErrorBgColor(), className)}>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Icon className={cn('h-4 w-4', getErrorColor())} />
                        {getErrorTitle()}
                        <Badge variant="outline" className="text-xs">
                            {classifiedError.type.replace('_', ' ').toLowerCase()}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {classifiedError.message}
                    </p>

                    {showDetails && classifiedError.details && (
                        <>
                            <Separator />
                            <details className="text-xs">
                                <summary className="cursor-pointer font-medium text-muted-foreground mb-2">
                                    Technical Details
                                </summary>
                                <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted p-2 rounded">
                                    {JSON.stringify(classifiedError.details, null, 2)}
                                </pre>
                            </details>
                        </>
                    )}

                    <div className="flex gap-2">
                        {retryAction && (
                            <Button
                                size="sm"
                                onClick={retryAction.action}
                                className="flex items-center gap-1"
                            >
                                <RefreshCw className="h-3 w-3" />
                                {retryAction.label}
                            </Button>
                        )}
                        {onDismiss && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onDismiss}
                            >
                                Dismiss
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Default alert variant
    return (
        <Alert className={cn('border-2', getErrorBgColor(), className)}>
            <Icon className={cn('h-4 w-4', getErrorColor())} />
            <AlertTitle className="flex items-center gap-2">
                {getErrorTitle()}
                <Badge variant="outline" className="text-xs">
                    {classifiedError.type.replace('_', ' ').toLowerCase()}
                </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
                <p>{classifiedError.message}</p>

                {showDetails && classifiedError.details && (
                    <details className="text-xs">
                        <summary className="cursor-pointer font-medium mb-2">
                            Technical Details
                        </summary>
                        <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                            {JSON.stringify(classifiedError.details, null, 2)}
                        </pre>
                    </details>
                )}

                <div className="flex gap-2">
                    {retryAction && (
                        <Button
                            size="sm"
                            onClick={retryAction.action}
                            className="flex items-center gap-1"
                        >
                            <RefreshCw className="h-3 w-3" />
                            {retryAction.label}
                        </Button>
                    )}
                    {onDismiss && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onDismiss}
                        >
                            Dismiss
                        </Button>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
};

// Specialized error components
export const NetworkErrorDisplay: React.FC<Omit<ErrorDisplayProps, 'error'> & { error?: Error }> = (props) => {
    const { isOffline } = useNetworkStatus();

    const networkError = props.error || new Error(
        isOffline
            ? 'You are currently offline. Please check your internet connection.'
            : 'Network connection failed. Please try again.'
    );

    return (
        <ErrorDisplay
            {...props}
            error={networkError}
            variant="card"
            title={isOffline ? 'Offline' : 'Network Error'}
        />
    );
};

export const BookingConflictDisplay: React.FC<Omit<ErrorDisplayProps, 'error'> & { conflictDetails?: any }> = ({
    conflictDetails,
    ...props
}) => {
    const conflictError = new Error(
        'This time slot is no longer available. Please select a different time.'
    );

    return (
        <ErrorDisplay
            {...props}
            error={conflictError}
            variant="alert"
            title="Booking Conflict"
            retryable={false}
        />
    );
};

export const PermissionErrorDisplay: React.FC<Omit<ErrorDisplayProps, 'error'>> = (props) => {
    const permissionError = new Error(
        'You do not have permission to perform this action. Please contact an administrator if you believe this is an error.'
    );

    return (
        <ErrorDisplay
            {...props}
            error={permissionError}
            variant="alert"
            title="Access Denied"
            retryable={false}
        />
    );
};

// Error boundary fallback component
export const ErrorFallback: React.FC<{
    error: Error;
    resetError: () => void;
}> = ({ error, resetError }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <ErrorDisplay
                    error={error}
                    onRetry={resetError}
                    variant="card"
                    showDetails={process.env.NODE_ENV === 'development'}
                    title="Application Error"
                />
            </div>
        </div>
    );
};