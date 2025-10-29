import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
    title: string;
    description?: string;
    type?: ToastType;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
    onDismiss?: () => void;
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        className: 'text-green-600',
        bgClassName: 'bg-green-50 border-green-200',
    },
    error: {
        icon: XCircle,
        className: 'text-red-600',
        bgClassName: 'bg-red-50 border-red-200',
    },
    warning: {
        icon: AlertCircle,
        className: 'text-orange-600',
        bgClassName: 'bg-orange-50 border-orange-200',
    },
    info: {
        icon: Info,
        className: 'text-blue-600',
        bgClassName: 'bg-blue-50 border-blue-200',
    },
};

// Custom toast component
const CustomToast: React.FC<{
    title: string;
    description?: string;
    type: ToastType;
    onDismiss?: () => void;
    action?: ToastOptions['action'];
}> = ({ title, description, type, onDismiss, action }) => {
    const config = toastConfig[type];
    const Icon = config.icon;

    return (
        <div className={cn(
            'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
            config.bgClassName
        )}>
            <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.className)} />

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {title}
                        </h4>
                        {description && (
                            <p className="text-sm text-gray-600">
                                {description}
                            </p>
                        )}
                    </div>

                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {action && (
                    <button
                        onClick={action.onClick}
                        className={cn(
                            'mt-2 text-sm font-medium underline hover:no-underline transition-all',
                            config.className
                        )}
                    >
                        {action.label}
                    </button>
                )}
            </div>
        </div>
    );
};

// Toast utility functions
export const showToast = (options: ToastOptions) => {
    const { title, description, type = 'info', duration = 5000, action, onDismiss } = options;

    return toast.custom(
        (t) => (
            <CustomToast
                title={title}
                description={description}
                type={type}
                action={action}
                onDismiss={() => {
                    toast.dismiss(t);
                    onDismiss?.();
                }}
            />
        ),
        {
            duration,
            position: 'top-right',
        }
    );
};

// Convenience functions for different toast types
export const showSuccessToast = (title: string, description?: string, options?: Partial<ToastOptions>) => {
    return showToast({ title, description, type: 'success', ...options });
};

export const showErrorToast = (title: string, description?: string, options?: Partial<ToastOptions>) => {
    return showToast({ title, description, type: 'error', ...options });
};

export const showWarningToast = (title: string, description?: string, options?: Partial<ToastOptions>) => {
    return showToast({ title, description, type: 'warning', ...options });
};

export const showInfoToast = (title: string, description?: string, options?: Partial<ToastOptions>) => {
    return showToast({ title, description, type: 'info', ...options });
};

// Hook for booking-related notifications
export const useBookingToasts = () => {
    const showBookingConfirmed = (roomName: string, startTime: string) => {
        showSuccessToast(
            'Booking Confirmed',
            `Your booking for ${roomName} at ${startTime} has been confirmed.`
        );
    };

    const showBookingCancelled = (roomName: string) => {
        showInfoToast(
            'Booking Cancelled',
            `Your booking for ${roomName} has been cancelled.`
        );
    };

    const showBookingModified = (roomName: string) => {
        showInfoToast(
            'Booking Modified',
            `Your booking for ${roomName} has been updated.`
        );
    };

    const showBookingConflict = (roomName: string) => {
        showErrorToast(
            'Booking Conflict',
            `The selected time slot for ${roomName} is no longer available. Please choose a different time.`
        );
    };

    const showAdminOverride = (roomName: string) => {
        showWarningToast(
            'Admin Override',
            `An administrator has modified your booking for ${roomName}.`
        );
    };

    return {
        showBookingConfirmed,
        showBookingCancelled,
        showBookingModified,
        showBookingConflict,
        showAdminOverride,
    };
};

// Component for handling real-time notification toasts
export const NotificationToastHandler: React.FC<{ userId?: string }> = ({ userId }) => {
    const bookingToasts = useBookingToasts();

    useEffect(() => {
        if (!userId) return;

        // Subscribe to real-time notifications for toast display
        const channel = supabase
            .channel(`notification-toasts-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const notification = payload.new as any;

                    // Show toast based on notification type
                    switch (notification.type) {
                        case 'booking_confirmed':
                            bookingToasts.showBookingConfirmed(
                                notification.title,
                                notification.message
                            );
                            break;
                        case 'booking_cancelled':
                            bookingToasts.showBookingCancelled(notification.title);
                            break;
                        case 'booking_modified':
                            bookingToasts.showBookingModified(notification.title);
                            break;
                        case 'admin_override':
                            bookingToasts.showAdminOverride(notification.title);
                            break;
                        case 'system_error':
                            showErrorToast(notification.title, notification.message);
                            break;
                        default:
                            showInfoToast(notification.title, notification.message);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, bookingToasts]);

    return null; // This component doesn't render anything
};

// Enhanced booking toasts with real-time conflict detection
export const useEnhancedBookingToasts = () => {
    const basicToasts = useBookingToasts();

    const showRealTimeConflict = (roomName: string) => {
        showErrorToast(
            '⚡ Real-time Conflict Detected',
            `Someone just booked ${roomName} for the selected time. Please choose a different slot.`,
            {
                duration: 8000,
                action: {
                    label: 'Find Alternative',
                    onClick: () => {
                        // This could trigger a callback to find next available slot
                        console.log('Finding alternative slot...');
                    }
                }
            }
        );
    };

    const showAvailabilityUpdate = (roomName: string, isAvailable: boolean) => {
        if (isAvailable) {
            showSuccessToast(
                '✅ Room Available',
                `${roomName} is now available for booking.`,
                { duration: 4000 }
            );
        } else {
            showInfoToast(
                '📅 Room Booked',
                `${roomName} has been booked by another user.`,
                { duration: 4000 }
            );
        }
    };

    const showConnectionStatus = (isConnected: boolean) => {
        if (isConnected) {
            showSuccessToast(
                '🔗 Connected',
                'Real-time updates are now active.',
                { duration: 3000 }
            );
        } else {
            showWarningToast(
                '⚠️ Connection Lost',
                'Real-time updates are temporarily unavailable.',
                { duration: 5000 }
            );
        }
    };

    return {
        ...basicToasts,
        showRealTimeConflict,
        showAvailabilityUpdate,
        showConnectionStatus,
    };
};