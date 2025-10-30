import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { classifyError, ErrorType } from '@/lib/queryClient';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    level?: 'page' | 'component' | 'global';
    showDetails?: boolean;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
    errorId?: string;
    retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
            errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const classifiedError = classifyError(error);

        console.error('ErrorBoundary caught an error:', {
            error: classifiedError,
            errorInfo,
            errorId: this.state.errorId,
            retryCount: this.state.retryCount,
            level: this.props.level || 'component'
        });

        this.setState({
            error: classifiedError,
            errorInfo,
        });

        // Report error to monitoring service (if available)
        this.reportError(classifiedError, errorInfo);

        // Call the optional onError callback
        if (this.props.onError) {
            this.props.onError(classifiedError, errorInfo);
        }
    }

    reportError = (error: Error, errorInfo: ErrorInfo) => {
        // In a real app, you'd send this to an error reporting service
        // like Sentry, LogRocket, or Bugsnag
        try {
            const errorReport = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                errorId: this.state.errorId,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                level: this.props.level || 'component',
                retryCount: this.state.retryCount,
            };

            // Store in localStorage for debugging
            const existingReports = JSON.parse(localStorage.getItem('error-reports') || '[]');
            existingReports.push(errorReport);
            // Keep only last 10 reports
            if (existingReports.length > 10) {
                existingReports.shift();
            }
            localStorage.setItem('error-reports', JSON.stringify(existingReports));
        } catch (reportingError) {
            console.error('Failed to report error:', reportingError);
        }
    };

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: undefined,
            errorInfo: undefined,
            retryCount: prevState.retryCount + 1
        }));
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleReload = () => {
        window.location.reload();
    };

    getErrorSeverity = () => {
        if (!this.state.error) return 'low';

        const classifiedError = classifyError(this.state.error);

        switch (classifiedError.type) {
            case ErrorType.NETWORK_ERROR:
            case ErrorType.OFFLINE_ERROR:
                return 'medium';
            case ErrorType.PERMISSION_DENIED:
                return 'high';
            case ErrorType.SERVER_ERROR:
                return 'high';
            default:
                return 'medium';
        }
    };

    shouldShowRetry = () => {
        if (!this.state.error) return false;

        const classifiedError = classifyError(this.state.error);
        return classifiedError.retryable && this.state.retryCount < 3;
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const classifiedError = this.state.error ? classifyError(this.state.error) : null;
            const severity = this.getErrorSeverity();
            const showRetry = this.shouldShowRetry();
            const isNetworkError = classifiedError?.type === ErrorType.NETWORK_ERROR ||
                classifiedError?.type === ErrorType.OFFLINE_ERROR;

            // Component-level error (smaller UI)
            if (this.props.level === 'component') {
                return (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800 flex items-center gap-2">
                            Component Error
                            {this.state.errorId && (
                                <Badge variant="outline" className="text-xs">
                                    {this.state.errorId.slice(-6)}
                                </Badge>
                            )}
                        </AlertTitle>
                        <AlertDescription className="text-red-700 mt-2 space-y-3">
                            <p>{classifiedError?.message || 'An unexpected error occurred in this component.'}</p>

                            {showRetry && (
                                <Button
                                    onClick={this.handleRetry}
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-1"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                    Retry ({3 - this.state.retryCount} attempts left)
                                </Button>
                            )}
                        </AlertDescription>
                    </Alert>
                );
            }

            // Page or global level error (full UI)
            const containerClass = this.props.level === 'global'
                ? "min-h-screen bg-gray-50 flex items-center justify-center p-4"
                : "flex items-center justify-center p-8";

            return (
                <div className={containerClass}>
                    <div className="max-w-lg w-full">
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-red-800">
                                    {isNetworkError ? (
                                        navigator.onLine ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5" />
                                    )}
                                    {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
                                    <Badge variant="outline" className="text-xs">
                                        {severity} severity
                                    </Badge>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <p className="text-red-700">
                                    {classifiedError?.message || 'We\'re sorry, but something unexpected happened. The error has been logged and we\'ll look into it.'}
                                </p>

                                {this.state.retryCount > 0 && (
                                    <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
                                        Retry attempt {this.state.retryCount} of 3
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    {showRetry && (
                                        <Button
                                            onClick={this.handleRetry}
                                            className="w-full"
                                            variant="default"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Try Again
                                        </Button>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={this.handleGoHome}
                                            className="flex-1"
                                            variant="outline"
                                        >
                                            <Home className="mr-2 h-4 w-4" />
                                            Go Home
                                        </Button>

                                        <Button
                                            onClick={this.handleReload}
                                            className="flex-1"
                                            variant="outline"
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Reload Page
                                        </Button>
                                    </div>
                                </div>

                                {this.state.errorId && (
                                    <>
                                        <Separator />
                                        <div className="text-xs text-gray-600">
                                            <div className="flex items-center gap-1 mb-1">
                                                <Bug className="h-3 w-3" />
                                                Error ID: {this.state.errorId}
                                            </div>
                                            <p>Please include this ID when reporting the issue.</p>
                                        </div>
                                    </>
                                )}

                                {/* Development error details */}
                                {(process.env.NODE_ENV === 'development' || this.props.showDetails) && this.state.error && (
                                    <>
                                        <Separator />
                                        <details className="text-sm">
                                            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                                                Technical Details {process.env.NODE_ENV === 'development' && '(Development Only)'}
                                            </summary>
                                            <div className="space-y-2 text-xs">
                                                <div>
                                                    <strong>Error Type:</strong>
                                                    <div className="mt-1 p-2 bg-gray-100 rounded">
                                                        {classifiedError?.type || 'Unknown'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong>Error Message:</strong>
                                                    <pre className="mt-1 p-2 bg-gray-100 rounded text-red-600 whitespace-pre-wrap">
                                                        {this.state.error.toString()}
                                                    </pre>
                                                </div>
                                                {this.state.error.stack && (
                                                    <div>
                                                        <strong>Stack Trace:</strong>
                                                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                            {this.state.error.stack}
                                                        </pre>
                                                    </div>
                                                )}
                                                {this.state.errorInfo && (
                                                    <div>
                                                        <strong>Component Stack:</strong>
                                                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                            {this.state.errorInfo.componentStack}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook version for functional components
export const useErrorBoundary = () => {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    const captureError = React.useCallback((error: Error) => {
        setError(error);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return { captureError, resetError };
};