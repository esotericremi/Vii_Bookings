import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
    children: React.ReactNode;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    disabled?: boolean;
    loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    children,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
    disabled = false,
    loading = false,
}) => {
    const [open, setOpen] = React.useState(false);

    const handleConfirm = async () => {
        try {
            await onConfirm();
            setOpen(false);
        } catch (error) {
            console.error('Error in confirm action:', error);
            // Keep dialog open on error so user can retry
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        setOpen(false);
    };

    const getIcon = () => {
        switch (variant) {
            case 'destructive':
                return <AlertTriangle className="h-6 w-6 text-red-600" />;
            default:
                return <AlertTriangle className="h-6 w-6 text-blue-600" />;
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild disabled={disabled}>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel} disabled={loading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading}
                        className={cn(
                            variant === 'destructive' &&
                            'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                        )}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

// Specialized confirm dialogs for common use cases
interface DeleteConfirmDialogProps {
    children: React.ReactNode;
    itemName: string;
    itemType?: string;
    onConfirm: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    children,
    itemName,
    itemType = 'item',
    onConfirm,
    disabled = false,
    loading = false,
}) => {
    return (
        <ConfirmDialog
            title={`Delete ${itemType}`}
            description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
            confirmText="Delete"
            variant="destructive"
            onConfirm={onConfirm}
            disabled={disabled}
            loading={loading}
        >
            {children}
        </ConfirmDialog>
    );
};

interface CancelBookingConfirmDialogProps {
    children: React.ReactNode;
    bookingTitle: string;
    onConfirm: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
}

export const CancelBookingConfirmDialog: React.FC<CancelBookingConfirmDialogProps> = ({
    children,
    bookingTitle,
    onConfirm,
    disabled = false,
    loading = false,
}) => {
    return (
        <ConfirmDialog
            title="Cancel Booking"
            description={`Are you sure you want to cancel the booking "${bookingTitle}"? This will free up the room for others to book.`}
            confirmText="Cancel Booking"
            variant="destructive"
            onConfirm={onConfirm}
            disabled={disabled}
            loading={loading}
        >
            {children}
        </ConfirmDialog>
    );
};