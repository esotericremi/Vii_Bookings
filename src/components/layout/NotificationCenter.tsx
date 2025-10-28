import React, { useState, useEffect } from 'react';
import { X, Bell, Check, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types/notification';

interface NotificationCenterProps {
    className?: string;
}

const notificationTypeConfig: Record<NotificationType, {
    color: string;
    bgColor: string;
    icon: string;
}> = {
    booking_confirmed: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '✅'
    },
    booking_cancelled: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '❌'
    },
    booking_modified: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: '📝'
    },
    admin_override: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: '⚠️'
    },
    system_error: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '🚨'
    }
};

const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
};

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onDelete
}) => {
    const config = notificationTypeConfig[notification.type];

    return (
        <div className={cn(
            "p-4 border-l-4 transition-all duration-200",
            notification.is_read
                ? "bg-gray-50 border-l-gray-300"
                : `${config.bgColor} border-l-current ${config.color}`
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{config.icon}</span>
                        <h4 className={cn(
                            "text-sm font-medium truncate",
                            notification.is_read ? "text-gray-600" : "text-gray-900"
                        )}>
                            {notification.title}
                        </h4>
                        {!notification.is_read && (
                            <Badge variant="secondary" className="h-2 w-2 p-0 bg-blue-500" />
                        )}
                    </div>
                    <p className={cn(
                        "text-sm mb-2",
                        notification.is_read ? "text-gray-500" : "text-gray-700"
                    )}>
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-400">
                        {formatTimeAgo(notification.created_at)}
                    </p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {!notification.is_read && (
                            <DropdownMenuItem
                                onClick={() => onMarkAsRead(notification.id)}
                                className="cursor-pointer"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Mark as read
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={() => onDelete(notification.id)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
        notifications,
        unreadCount,
        markAsRead,
        deleteNotification,
        markAllAsRead
    } = useNotifications();

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("relative", className)}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:w-96">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                            {unreadCount > 0 && (
                                <Badge variant="secondary">
                                    {unreadCount} new
                                </Badge>
                            )}
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="text-xs"
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                    <SheetDescription>
                        Stay updated with your booking activities and system notifications.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Bell className="h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No notifications
                            </h3>
                            <p className="text-sm text-gray-500">
                                You're all caught up! New notifications will appear here.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-200px)]">
                            <div className="space-y-1">
                                {notifications.map((notification, index) => (
                                    <React.Fragment key={notification.id}>
                                        <NotificationItem
                                            notification={notification}
                                            onMarkAsRead={handleMarkAsRead}
                                            onDelete={handleDelete}
                                        />
                                        {index < notifications.length - 1 && <Separator />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};