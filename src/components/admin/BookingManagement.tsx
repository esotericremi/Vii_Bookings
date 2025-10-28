import React, { useState, useMemo } from 'react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import {
    Calendar,
    Clock,
    Users,
    Edit,
    Trash2,
    Filter,
    Search,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    User,
    MapPin,
    MoreHorizontal,
    ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useBookings } from '@/hooks/useBookings';
import { useAdminUpdateBooking, useAdminCancelBooking, useAdminBulkCancelBookings, useAdminReassignBooking } from '@/hooks/useAdminBookings';
import { useAuth } from '@/hooks/useAuth';
import { BookingWithRelations } from '@/types/booking';
import { toast } from 'sonner';

interface BookingFilters {
    search: string;
    status: 'all' | 'confirmed' | 'cancelled' | 'pending';
    room: string;
    user: string;
    dateRange: 'all' | 'today' | 'upcoming' | 'past' | 'this_week' | 'this_month';
    sortBy: 'start_time' | 'created_at' | 'title' | 'room' | 'user';
    sortOrder: 'asc' | 'desc';
}

interface BookingManagementProps {
    className?: string;
}

export const BookingManagement: React.FC<BookingManagementProps> = ({ className }) => {
    const { userProfile } = useAuth();
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [editingBooking, setEditingBooking] = useState<BookingWithRelations | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showReassignDialog, setShowReassignDialog] = useState(false);
    const [reassignTarget, setReassignTarget] = useState<{ bookingId: string; newRoomId: string } | null>(null);
    const [filters, setFilters] = useState<BookingFilters>({
        search: '',
        status: 'all',
        room: 'all',
        user: 'all',
        dateRange: 'all',
        sortBy: 'start_time',
        sortOrder: 'desc'
    });

    const adminUpdateBookingMutation = useAdminUpdateBooking();
    const adminCancelBookingMutation = useAdminCancelBooking();
    const adminBulkCancelMutation = useAdminBulkCancelBookings();
    const adminReassignMutation = useAdminReassignBooking();

    // Calculate date range for filtering
    const dateRange = useMemo(() => {
        const now = new Date();
        const today = startOfDay(now);

        switch (filters.dateRange) {
            case 'today':
                return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'upcoming':
                return { start: now, end: null };
            case 'past':
                return { start: null, end: now };
            case 'this_week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                return { start: weekStart, end: weekEnd };
            case 'this_month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return { start: monthStart, end: monthEnd };
            default:
                return { start: null, end: null };
        }
    }, [filters.dateRange]);

    // Fetch bookings with filters
    const bookingQueryFilters = useMemo(() => ({
        status: filters.status !== 'all' ? filters.status : undefined,
        roomId: filters.room !== 'all' ? filters.room : undefined,
        userId: filters.user !== 'all' ? filters.user : undefined,
        startDate: dateRange.start?.toISOString(),
        endDate: dateRange.end?.toISOString(),
        limit: 100
    }), [filters, dateRange]);

    const { data: allBookings = [], isLoading, refetch } = useBookings(bookingQueryFilters);

    // Filter and sort bookings
    const filteredBookings = useMemo(() => {
        let filtered = allBookings.filter(booking => {
            // Search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const matchesSearch =
                    booking.title.toLowerCase().includes(searchTerm) ||
                    booking.description?.toLowerCase().includes(searchTerm) ||
                    booking.room?.name.toLowerCase().includes(searchTerm) ||
                    booking.user?.full_name.toLowerCase().includes(searchTerm) ||
                    booking.user?.email.toLowerCase().includes(searchTerm);

                if (!matchesSearch) return false;
            }

            return true;
        });

        // Sort bookings
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (filters.sortBy) {
                case 'title':
                    aValue = a.title;
                    bValue = b.title;
                    break;
                case 'room':
                    aValue = a.room?.name || '';
                    bValue = b.room?.name || '';
                    break;
                case 'user':
                    aValue = a.user?.full_name || '';
                    bValue = b.user?.full_name || '';
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at);
                    bValue = new Date(b.created_at);
                    break;
                case 'start_time':
                default:
                    aValue = new Date(a.start_time);
                    bValue = new Date(b.start_time);
                    break;
            }

            if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [allBookings, filters]);

    // Get booking status info
    const getBookingStatus = (booking: BookingWithRelations) => {
        if (booking.status === 'cancelled') return { status: 'cancelled', color: 'destructive' };
        if (booking.status === 'pending') return { status: 'pending', color: 'secondary' };

        const now = new Date();
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);

        if (isBefore(bookingEnd, now)) return { status: 'completed', color: 'outline' };
        if (isAfter(bookingStart, now)) return { status: 'upcoming', color: 'default' };
        return { status: 'ongoing', color: 'secondary' };
    };    /
        / Handle booking actions
    const handleEditBooking = (booking: BookingWithRelations) => {
        setEditingBooking(booking);
        setShowEditDialog(true);
    };

    const handleCancelBooking = async (bookingId: string, reason?: string) => {
        try {
            const booking = allBookings.find(b => b.id === bookingId);
            if (!booking) return;

            await adminCancelBookingMutation.mutateAsync({
                bookingId,
                adminName: userProfile?.full_name || 'Administrator',
                reason
            });

            toast.success('Booking cancelled successfully');
        } catch (error) {
            toast.error('Failed to cancel booking');
            console.error('Cancel booking error:', error);
        }
    };

    const handleBulkCancel = async () => {
        try {
            await adminBulkCancelMutation.mutateAsync({
                bookingIds: selectedBookings,
                adminName: userProfile?.full_name || 'Administrator',
                reason: 'Cancelled by administrator as part of bulk operation'
            });

            toast.success(`${selectedBookings.length} bookings cancelled successfully`);
            setSelectedBookings([]);
        } catch (error) {
            toast.error('Failed to cancel some bookings');
            console.error('Bulk cancel error:', error);
        }
    };

    const handleReassignBooking = async (bookingId: string, newRoomId: string) => {
        try {
            await adminReassignMutation.mutateAsync({
                bookingId,
                newRoomId,
                adminName: userProfile?.full_name || 'Administrator',
                reason: 'Room reassigned by administrator'
            });

            toast.success('Booking reassigned successfully');
            setReassignTarget(null);
            setShowReassignDialog(false);
        } catch (error) {
            toast.error('Failed to reassign booking');
            console.error('Reassign booking error:', error);
        }
    };

    const handleAdminOverride = async (bookingId: string, updates: Partial<BookingWithRelations>) => {
        try {
            await adminUpdateBookingMutation.mutateAsync({
                id: bookingId,
                updates,
                adminName: userProfile?.full_name || 'Administrator',
                reason: 'Booking modified by administrator'
            });

            toast.success('Booking updated successfully');
            setEditingBooking(null);
            setShowEditDialog(false);
        } catch (error) {
            toast.error('Failed to update booking');
            console.error('Admin override error:', error);
        }
    };

    // Handle selection
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedBookings(filteredBookings.map(b => b.id));
        } else {
            setSelectedBookings([]);
        }
    };

    const handleSelectBooking = (bookingId: string, checked: boolean) => {
        if (checked) {
            setSelectedBookings(prev => [...prev, bookingId]);
        } else {
            setSelectedBookings(prev => prev.filter(id => id !== bookingId));
        }
    };

    // Statistics
    const stats = useMemo(() => {
        const total = filteredBookings.length;
        const confirmed = filteredBookings.filter(b => b.status === 'confirmed').length;
        const cancelled = filteredBookings.filter(b => b.status === 'cancelled').length;
        const pending = filteredBookings.filter(b => b.status === 'pending').length;
        const adminOverrides = filteredBookings.filter(b => b.is_admin_override).length;

        return { total, confirmed, cancelled, pending, adminOverrides };
    }, [filteredBookings]); if (i
sLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner className="h-8 w-8" />
                <span className="ml-2">Loading bookings...</span>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Booking Management</h1>
                    <p className="text-muted-foreground">
                        Manage all bookings, resolve conflicts, and oversee room utilization
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    {selectedBookings.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Cancel Selected ({selectedBookings.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Multiple Bookings</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to cancel {selectedBookings.length} selected bookings?
                                        This action cannot be undone and users will be notified.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Bookings</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleBulkCancel}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Cancel Bookings
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Admin Overrides</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.adminOverrides}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search bookings..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="pl-10"
                            />
                        </div>

                        <Select
                            value={filters.status}
                            onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.dateRange}
                            onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateRange: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="past">Past</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.room}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, room: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Room" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Rooms</SelectItem>
                                {/* Room options would be populated from rooms data */}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.sortBy}
                            onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="start_time">Start Time</SelectItem>
                                <SelectItem value="created_at">Created</SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                                <SelectItem value="room">Room</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={() => setFilters(prev => ({
                                ...prev,
                                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                            }))}
                        >
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bookings Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Bookings ({filteredBookings.length})</span>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                            <span className="text-sm text-muted-foreground">Select All</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <span className="sr-only">Select</span>
                                    </TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Room</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-12">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No bookings found matching your filters
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBookings.map((booking) => {
                                        const statusInfo = getBookingStatus(booking);
                                        const isSelected = selectedBookings.includes(booking.id);

                                        return (
                                            <TableRow key={booking.id} className={isSelected ? 'bg-muted/50' : ''}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectBooking(booking.id, checked as boolean)
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{booking.title}</div>
                                                        {book ></Card           ntent>
                                                </CardCo         
    iv>  </d            >
                                            / Table<ody>
    bleB        </Ta              }
                            )                     )
         }                       );
                                    >
                            TableRow         </                          >
                        /TableCell   <                                           enu>
                            nMow/Dropd     <
                                tent>enuConownM    </Dropd                                                   nuItem>
                            ropdownMe         </D                                               oking
    cel Bo       Can                                                      " />
                        h-4 w-4 mr-2e="2 classNam  <Trash                                                              >
                                                      
      tive"truce="text-desassNam    cl                                                           )}
 ator'tr by adminisancelled 'Cd,g.iking(bookinncelBoo> handleCaick={() = onCl                                                       
         m uIteownMen   <Dropd r />
                            MenuSeparatoDropdown       <                                                     nMenuItem>
                            </Dropdow                                                       oom
   gn R   Reassi                                                      >
                            / w-4 mr-2"me="h-4rs classNa   <Use                                                     >
                                                                }}
                                true);
    ssignDialog( setShowRea                                                               ' });
                                Id: 'oomd, newR booking.i{bookingId:Target(ssignea        setR                                                    {
                                    () => Click = {
                                        on                                                           m 
 pdownMenuItero<D                                                         tem>
ropdownMenuI  </D                                                         ooking
 dit B  E                                                          " />
                            -2 w-4 mr="h-4lassName     <Edit c                                                           )}>
g(bookingtBookin=> handleEdiClick={() MenuItem onDropdown  <
                                abel>uLopdownMenDrons</nuLabel>ActipdownMe    <Dro                                                  >
                                "end"ign=ontent alnMenuC  <Dropdow
                                    MenuTrigger>down  </Drop
                                >on </Butt                                                            />
                            "h-4 w-4"sName=ontal clasHoriz   <More on">
                            ="ichost" sizeariant="gutton v        <B                                                   >
                                er asChildwnMenuTriggropdo   <D                                              >
                                    ropdownMenu          <D l>
                                        ableCel   <T
                                            ll>leCe       </Tab                                      >
                                    </div                                                }
                                    m a') dd, h:mt), 'MMMed_aeatbooking.crw Date(  {format(ne                                                     und">
 uted - foregroxt - sm text - mame= "te classN     <div                                         l>
      leCel<Tab leCell>
                                    </Tab                                 
           </Badge>                                            }
                                fo.statusIn  {status                                                     
 s any}>Info.color atatusariant={s < Badge v                                            
       Cell>      <Table
                                    ell>eC     </Tabl                                    
       /div>   <                                             v>
                                    /di    <                                              
      :mm a')}me), 'hoking.end_tite(bot(new Da')} - {formame), 'h:mm at_tig.starookinte(bw Da{format(ne >
                                        "d-foregroundext-mutext-sm t="telassNamev cdi <                                                 </div>
                                                       yyy')}
                                dd, yme), 'MMM start_tiing.e(book Datormat(new          {f                                               ium">
                                medName="font-<div class                                                        <div>
                                                    eCell>
                                    <Tabl l>
                                    </TableCel                                                 </div>
                                          >
                            </div                                                    </div>
                                                         ?.email}
                    booking.user  {round">
                    egxt-muted-forte"text-sm ame=sN  <div clas                                                         </div>
 _name}r?.fullng.usem">{bookifont - mediu"assName=cl<div
                    div>           <                                         >
                        reground" /uted-foxt-m"h-4 w-4 teclassName=r      <Use gap-2">
                        center ms-te="flex iamelassN   <div c leCell>
                            <Tab Cell>
                                leab     </T                                   v>
                        </di                                           
  iv> </d                                                      /div>
                    <                                                }
                    m?.floorbooking.roo • Floor {?.location}ng.room    {booki                                                         ">
                    oregroundext-muted-f"text-sm tassName=iv cl          <d div>
     oom?.name}</{booking.redium">-m"fonte=sNam  <div clas                                                        <div>
                                                        und" />
                        uted-foregrotext-m-4 Name="h-4 wlassMapPin c      <                                              
    2">er gap- items-centame="flexssNiv cla      <d Cell>
                            <Table
                                eCell>/Tabl      <                                      v>
                                </di                                                  
    )}                                              ge>
                            </Bad                                                   e
                            erriddmin Ov A                                                           
    3 mr-1" />me="h-3 w-gle classNartTrianAle           <                                                     text-xs">
                            ame="mt-1 ssN" clae"outlinge variant=      <Bad                                                & (
                            rride &n_oves_admi {booking.i}
                            )                                                       </div>
                                                         iption}
                    g.descr    {bookin - xs">
                    e max-wncatound truforegrd-t-mutesm texme="text-sNa clas     <div                                              (
                    cription && ing.des
                    {/* Edit Booking Dialog */}
                    {editingBooking && (
                        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Edit Booking - {editingBooking.title}</DialogTitle>
                                </DialogHeader>
                                <AdminBookingEditForm
                                    booking={editingBooking}
                                    onSave={handleAdminOverride}
                                    onCancel={() => {
                                        setEditingBooking(null);
                                        setShowEditDialog(false);
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Reassign Room Dialog */}
                    <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reassign Room</DialogTitle>
                            </DialogHeader>
                            <RoomReassignForm
                                bookingId={reassignTarget?.bookingId || ''}
                                currentRoomId={allBookings.find(b => b.id === reassignTarget?.bookingId)?.room_id || ''}
                                onReassign={handleReassignBooking}
                                onCancel={() => {
                                    setReassignTarget(null);
                                    setShowReassignDialog(false);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                );
};

                // Admin Booking Edit Form Component
                interface AdminBookingEditFormProps {
                    booking: BookingWithRelations;
                onSave: (bookingId: string, updates: Partial<BookingWithRelations>) => void;
    onCancel: () => void;
}

                    const AdminBookingEditForm: React.FC<AdminBookingEditFormProps> = ({booking, onSave, onCancel}) => {
    const [formData, setFormData] = useState({
                            title: booking.title,
                        description: booking.description || '',
                        start_time: format(new Date(booking.start_time), "yyyy-MM-dd'T'HH:mm"),
                        end_time: format(new Date(booking.end_time), "yyyy-MM-dd'T'HH:mm"),
                        status: booking.status
    });

    const handleSubmit = (e: React.FormEvent) => {
                            e.preventDefault();

                        const updates = {
                            title: formData.title,
                        description: formData.description || null,
                        start_time: new Date(formData.start_time).toISOString(),
                        end_time: new Date(formData.end_time).toISOString(),
                        status: formData.status as any
        };

                        onSave(booking.id, updates);
    };

                        return (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Start Time</label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">End Time</label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Status</label>
                                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={onCancel}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                        );
};

                        // Room Reassign Form Component
                        interface RoomReassignFormProps {
                            bookingId: string;
                        currentRoomId: string;
    onReassign: (bookingId: string, newRoomId: string) => void;
    onCancel: () => void;
}

                        const RoomReassignForm: React.FC<RoomReassignFormProps> = ({bookingId, currentRoomId, onReassign, onCancel}) => {
    const [selectedRoomId, setSelectedRoomId] = useState('');
    // In a real implementation, you would fetch available rooms here
    // const {data: rooms = [] } = useRooms();

    const handleSubmit = (e: React.FormEvent) => {
                                e.preventDefault();
                            if (selectedRoomId && selectedRoomId !== currentRoomId) {
                                onReassign(bookingId, selectedRoomId);
        }
    };

                            return (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Select New Room</label>
                                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a room..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* Room options would be populated from rooms data */}
                                            <SelectItem value="room-1">Conference Room A</SelectItem>
                                            <SelectItem value="room-2">Conference Room B</SelectItem>
                                            <SelectItem value="room-3">Meeting Room 1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={onCancel}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={!selectedRoomId || selectedRoomId === currentRoomId}>
                                        Reassign Room
                                    </Button>
                                </div>
                            </form>
                            );
};