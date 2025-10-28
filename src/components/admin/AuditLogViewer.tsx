import React, { useState, useMemo } from 'react';
import { Calendar, Filter, Search, User, Clock, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    getAuditLogs,
    formatAuditAction,
    getAuditActionColor,
    type AuditLogEntry,
    type AuditAction
} from '@/lib/audit';

interface AuditLogViewerProps {
    resourceId?: string;
    resourceType?: 'room' | 'booking' | 'user' | 'settings';
    showFilters?: boolean;
    maxHeight?: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
    resourceId,
    resourceType,
    showFilters = true,
    maxHeight = '600px',
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('7d');
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    // Get audit logs with filters
    const auditLogs = useMemo(() => {
        const now = new Date();
        let startDate: string | undefined;

        switch (dateRange) {
            case '1d':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
                break;
        }

        return getAuditLogs({
            resourceId,
            resourceType,
            action: selectedAction !== 'all' ? selectedAction as AuditAction : undefined,
            startDate,
            limit: 1000,
        });
    }, [resourceId, resourceType, selectedAction, dateRange]);

    // Filter logs based on search and user selection
    const filteredLogs = useMemo(() => {
        let filtered = auditLogs;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(log =>
                log.resource_name.toLowerCase().includes(term) ||
                log.user_name.toLowerCase().includes(term) ||
                formatAuditAction(log.action).toLowerCase().includes(term) ||
                JSON.stringify(log.details).toLowerCase().includes(term)
            );
        }

        if (selectedUser !== 'all') {
            filtered = filtered.filter(log => log.user_id === selectedUser);
        }

        return filtered;
    }, [auditLogs, searchTerm, selectedUser]);

    // Get unique users for filter
    const uniqueUsers = useMemo(() => {
        const users = new Map();
        auditLogs.forEach(log => {
            if (!users.has(log.user_id)) {
                users.set(log.user_id, log.user_name);
            }
        });
        return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
    }, [auditLogs]);

    const formatDateTime = (dateTime: string) => {
        return new Date(dateTime).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatRelativeTime = (dateTime: string) => {
        const now = new Date();
        const date = new Date(dateTime);
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDateTime(dateTime);
    };

    const exportLogs = () => {
        const csvContent = [
            ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource Name', 'Details'].join(','),
            ...filteredLogs.map(log => [
                log.created_at,
                log.user_name,
                formatAuditAction(log.action),
                log.resource_type,
                log.resource_name,
                JSON.stringify(log.details).replace(/"/g, '""')
            ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderDetailsPreview = (details: Record<string, any>) => {
        const keys = Object.keys(details);
        if (keys.length === 0) return 'No details';

        const preview = keys.slice(0, 2).map(key => {
            const value = details[key];
            if (typeof value === 'object') {
                return `${key}: ${JSON.stringify(value)}`;
            }
            return `${key}: ${value}`;
        }).join(', ');

        return keys.length > 2 ? `${preview}...` : preview;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Audit Log
                        </CardTitle>
                        <CardDescription>
                            {resourceId
                                ? `Activity history for this ${resourceType}`
                                : 'System-wide activity history'
                            }
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">
                            {filteredLogs.length} entries
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportLogs}
                            disabled={filteredLogs.length === 0}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {showFilters && (
                <CardContent className="border-b">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Action</label>
                            <Select value={selectedAction} onValueChange={setSelectedAction}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="room_created">Room Created</SelectItem>
                                    <SelectItem value="room_updated">Room Updated</SelectItem>
                                    <SelectItem value="room_deleted">Room Deleted</SelectItem>
                                    <SelectItem value="room_activated">Room Activated</SelectItem>
                                    <SelectItem value="room_deactivated">Room Deactivated</SelectItem>
                                    <SelectItem value="booking_created">Booking Created</SelectItem>
                                    <SelectItem value="booking_updated">Booking Updated</SelectItem>
                                    <SelectItem value="booking_cancelled">Booking Cancelled</SelectItem>
                                    <SelectItem value="booking_admin_override">Admin Override</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">User</label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {uniqueUsers.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Time Range</label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1d">Last 24 hours</SelectItem>
                                    <SelectItem value="7d">Last 7 days</SelectItem>
                                    <SelectItem value="30d">Last 30 days</SelectItem>
                                    <SelectItem value="90d">Last 90 days</SelectItem>
                                    <SelectItem value="all">All time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            )}

            <CardContent className="p-0">
                <ScrollArea style={{ height: maxHeight }}>
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                No audit logs found for the selected criteria.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Resource</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {formatRelativeTime(log.created_at)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatDateTime(log.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{log.user_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={getAuditActionColor(log.action)}
                                            >
                                                {formatAuditAction(log.action)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{log.resource_name}</div>
                                                <div className="text-sm text-muted-foreground capitalize">
                                                    {log.resource_type}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                                                {renderDetailsPreview(log.details)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedLog(log)}
                                                    >
                                                        View
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Audit Log Details</DialogTitle>
                                                        <DialogDescription>
                                                            Detailed information about this audit log entry.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    {selectedLog && (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-medium">Timestamp</label>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {formatDateTime(selectedLog.created_at)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium">User</label>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {selectedLog.user_name}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium">Action</label>
                                                                    <p className="text-sm">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={getAuditActionColor(selectedLog.action)}
                                                                        >
                                                                            {formatAuditAction(selectedLog.action)}
                                                                        </Badge>
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium">Resource</label>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {selectedLog.resource_name} ({selectedLog.resource_type})
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <Separator />

                                                            <div>
                                                                <label className="text-sm font-medium">Details</label>
                                                                <ScrollArea className="h-40 w-full border rounded-md p-3 mt-2">
                                                                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                                        {JSON.stringify(selectedLog.details, null, 2)}
                                                                    </pre>
                                                                </ScrollArea>
                                                            </div>

                                                            {(selectedLog.ip_address || selectedLog.user_agent) && (
                                                                <>
                                                                    <Separator />
                                                                    <div className="space-y-2">
                                                                        {selectedLog.ip_address && (
                                                                            <div>
                                                                                <label className="text-sm font-medium">IP Address</label>
                                                                                <p className="text-sm text-muted-foreground font-mono">
                                                                                    {selectedLog.ip_address}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {selectedLog.user_agent && (
                                                                            <div>
                                                                                <label className="text-sm font-medium">User Agent</label>
                                                                                <p className="text-sm text-muted-foreground break-all">
                                                                                    {selectedLog.user_agent}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
};