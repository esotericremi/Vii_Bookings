import React from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from './NetworkStatusProvider';
import { Logo } from './Logo';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
    showNetworkStatus?: boolean;
    variant?: 'spinner' | 'dots' | 'pulse';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
    text,
    showNetworkStatus = false,
    variant = 'spinner'
}) => {
    const { isOffline, isSlowConnection } = useNetworkStatus();

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg'
    };

    const renderSpinner = () => {
        switch (variant) {
            case 'dots':
                return (
                    <div className="flex space-x-1">
                        <div className={cn(
                            'rounded-full bg-blue-600 animate-bounce',
                            size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
                        )} style={{ animationDelay: '0ms' }} />
                        <div className={cn(
                            'rounded-full bg-blue-600 animate-bounce',
                            size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
                        )} style={{ animationDelay: '150ms' }} />
                        <div className={cn(
                            'rounded-full bg-blue-600 animate-bounce',
                            size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
                        )} style={{ animationDelay: '300ms' }} />
                    </div>
                );
            case 'pulse':
                return (
                    <div className={cn(
                        'rounded-full bg-blue-600 animate-pulse',
                        sizeClasses[size]
                    )} />
                );
            default:
                return (
                    <Loader2 className={cn(
                        'animate-spin text-blue-600',
                        sizeClasses[size]
                    )} />
                );
        }
    };

    const getLoadingText = () => {
        if (isOffline) {
            return text || 'Waiting for connection...';
        }
        if (isSlowConnection) {
            return text || 'Loading (slow connection)...';
        }
        return text || 'Loading...';
    };

    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <div className="flex items-center gap-2">
                {renderSpinner()}
                {showNetworkStatus && (
                    <div className="flex items-center">
                        {isOffline ? (
                            <WifiOff className="h-4 w-4 text-red-500" />
                        ) : (
                            <Wifi className={cn(
                                'h-4 w-4',
                                isSlowConnection ? 'text-yellow-500' : 'text-green-500'
                            )} />
                        )}
                    </div>
                )}
            </div>
            {text && (
                <p className={cn(
                    'text-muted-foreground text-center',
                    textSizeClasses[size],
                    isOffline && 'text-red-600',
                    isSlowConnection && 'text-yellow-600'
                )}>
                    {getLoadingText()}
                </p>
            )}
        </div>
    );
};

// Skeleton loading component for better UX
interface LoadingSkeletonProps {
    className?: string;
    lines?: number;
    variant?: 'text' | 'card' | 'avatar' | 'button';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    className,
    lines = 3,
    variant = 'text'
}) => {
    const renderSkeleton = () => {
        switch (variant) {
            case 'card':
                return (
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                        </div>
                    </div>
                );
            case 'avatar':
                return (
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                        </div>
                    </div>
                );
            case 'button':
                return (
                    <div className="h-10 bg-gray-200 rounded animate-pulse w-24" />
                );
            default:
                return (
                    <div className="space-y-2">
                        {Array.from({ length: lines }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'h-3 bg-gray-200 rounded animate-pulse',
                                    i === lines - 1 && 'w-2/3' // Last line shorter
                                )}
                            />
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className={cn('animate-pulse', className)}>
            {renderSkeleton()}
        </div>
    );
};

// Full page loading component
interface FullPageLoadingProps {
    text?: string;
    showLogo?: boolean;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
    text = 'Loading...',
    showLogo = true
}) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
                {showLogo && (
                    <div className="mb-8">
                        <Logo size="xl" />
                    </div>
                )}
                <LoadingSpinner
                    size="xl"
                    text={text}
                    showNetworkStatus={true}
                    variant="spinner"
                />
            </div>
        </div>
    );
};

// Inline loading for buttons
interface LoadingButtonProps {
    isLoading: boolean;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const LoadingButton: React.FC<LoadingButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
    isLoading,
    children,
    className,
    disabled,
    size = 'md',
    ...props
}) => {
    const spinnerSize = size === 'sm' ? 'sm' : 'md';

    return (
        <button
            className={cn(
                'relative inline-flex items-center justify-center',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner size={spinnerSize} />
                </div>
            )}
            <span className={cn(isLoading && 'opacity-0')}>
                {children}
            </span>
        </button>
    );
};