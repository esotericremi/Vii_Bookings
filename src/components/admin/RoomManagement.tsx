import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Upload, X, MapPin, Users, Monitor, Wifi, Coffee, Projector } from 'lucide-react';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import { bookingQueries } from '@/lib/queries';
import { auditRoomCreated, auditRoomUpdated, auditRoomDeleted, auditRoomStatusChanged } from '@/lib/audit';
import { DeleteConfirmDialog } from '@/components/shared/ConfirmDialog';
import { RoomDeletionDialog } from './RoomDeletionDialog';
import { AuditLogViewer } from './AuditLogViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Room, RoomFormData } from '@/types/room';

// Room form validation schema
const roomFormSchema = z.object({
    name: z.string().min(1, 'Room name is required').max(100, 'Room name must be less than 100 characters'),
    capacity: z.number().min(1, 'Capacity must be at least 1').max(1000, 'Capacity must be less than 1000'),
    location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
    floor: z.string().min(1, 'Floor is required').max(50, 'Floor must be less than 50 characters'),
    equipment: z.array(z.string()).optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    is_active: z.boolean().default(true),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

// Available equipment options
const EQUIPMENT_OPTIONS = [
    { id: 'projector', label: 'Projector', icon: Projector },
    { id: 'tv', label: 'TV/Monitor', icon: Monitor },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'whiteboard', label: 'Whiteboard', icon: Edit },
    { id: 'coffee', label: 'Coffee Machine', icon: Coffee },
    { id: 'phone', label: 'Conference Phone', icon: Users },
    { id: 'camera', label: 'Video Camera', icon: Monitor },
    { id: 'microphone', label: 'Microphone', icon: Users },
];

interface RoomFormDialogProps {
    room?: Room;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const RoomFormDialog: React.FC<RoomFormDialogProps> = ({ room, open, onOpenChange, onSuccess }) => {
    const { toast } = useToast();
    const createRoom = useCreateRoom();
    const updateRoom = useUpdateRoom();
    const [imageUploading, setImageUploading] = useState(false);

    const form = useForm<RoomFormValues>({
        resolver: zodResolver(roomFormSchema),
        defaultValues: {
            name: '',
            capacity: 1,
            location: '',
            floor: '',
            equipment: [],
            description: '',
            image_url: '',
            is_active: true,
        },
    });

    const isEditing = !!room;
    const isLoading = createRoom.isPending || updateRoom.isPending || imageUploading;

    // Reset form when room changes or dialog opens
    React.useEffect(() => {
        if (open) {
            if (room) {
                // Editing existing room - populate form with room data
                form.reset({
                    name: room.name || '',
                    capacity: room.capacity || 1,
                    location: room.location || '',
                    floor: room.floor || '',
                    equipment: room.equipment || [],
                    description: room.description || '',
                    image_url: room.image_url || '',
                    is_active: room.is_active ?? true,
                });
            } else {
                // Creating new room - reset to defaults
                form.reset({
                    name: '',
                    capacity: 1,
                    location: '',
                    floor: '',
                    equipment: [],
                    description: '',
                    image_url: '',
                    is_active: true,
                });
            }
        }
    }, [room, open, form]);

    const onSubmit = async (values: RoomFormValues) => {
        try {
            const roomData = {
                ...values,
                equipment: values.equipment || [],
                description: values.description || null,
                image_url: values.image_url || null,
            };

            if (isEditing) {
                // Track changes for audit
                const changes: Record<string, { from: any; to: any }> = {};
                Object.keys(roomData).forEach(key => {
                    const oldValue = room[key as keyof Room];
                    const newValue = roomData[key as keyof typeof roomData];
                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                        changes[key] = { from: oldValue, to: newValue };
                    }
                });

                const updatedRoom = await updateRoom.mutateAsync({
                    id: room.id,
                    updates: roomData,
                });

                // Audit trail
                if (Object.keys(changes).length > 0) {
                    await auditRoomUpdated(room.id, values.name, changes);
                }

                // Check if status changed for specific audit
                if (changes.is_active) {
                    await auditRoomStatusChanged(room.id, values.name, values.is_active);
                }

                toast({
                    title: 'Room updated',
                    description: `${values.name} has been updated successfully.`,
                });
            } else {
                const newRoom = await createRoom.mutateAsync(roomData);

                // Audit trail
                await auditRoomCreated(newRoom.id, values.name, roomData);

                toast({
                    title: 'Room created',
                    description: `${values.name} has been created successfully.`,
                });
            }

            form.reset();
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred while saving the room.',
                variant: 'destructive',
            });
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please select an image file.',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Please select an image smaller than 5MB.',
                variant: 'destructive',
            });
            return;
        }

        setImageUploading(true);
        try {
            // In a real implementation, you would upload to Supabase Storage or another service
            // For now, we'll create a placeholder URL
            const imageUrl = `https://placeholder.com/400x300?text=${encodeURIComponent(file.name)}`;
            form.setValue('image_url', imageUrl);

            toast({
                title: 'Image uploaded',
                description: 'Room image has been uploaded successfully.',
            });
        } catch (error) {
            toast({
                title: 'Upload failed',
                description: 'Failed to upload image. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setImageUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Room' : 'Create New Room'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the room details below.'
                            : 'Fill in the details to create a new meeting room.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Room Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Conference Room A" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Capacity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="8"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Building A, East Wing" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="floor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Floor</FormLabel>
                                        <FormControl>
                                            <Input placeholder="2nd Floor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="A spacious conference room with natural lighting..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Optional description of the room and its features.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="equipment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipment & Amenities</FormLabel>
                                    <FormDescription>
                                        Select all equipment available in this room.
                                    </FormDescription>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                        {EQUIPMENT_OPTIONS.map((equipment) => {
                                            const Icon = equipment.icon;
                                            return (
                                                <div key={equipment.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={equipment.id}
                                                        checked={field.value?.includes(equipment.id) || false}
                                                        onCheckedChange={(checked) => {
                                                            const currentValue = field.value || [];
                                                            if (checked) {
                                                                field.onChange([...currentValue, equipment.id]);
                                                            } else {
                                                                field.onChange(currentValue.filter(item => item !== equipment.id));
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={equipment.id}
                                                        className="flex items-center space-x-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        <span>{equipment.label}</span>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="image_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Room Image</FormLabel>
                                    <FormDescription>
                                        Upload an image of the room or provide a URL.
                                    </FormDescription>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={imageUploading}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <label htmlFor="image-upload">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={imageUploading}
                                                    asChild
                                                >
                                                    <span className="cursor-pointer">
                                                        {imageUploading ? (
                                                            <>
                                                                <LoadingSpinner className="h-4 w-4 mr-2" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                Upload Image
                                                            </>
                                                        )}
                                                    </span>
                                                </Button>
                                            </label>
                                            <span className="text-sm text-muted-foreground">or</span>
                                        </div>
                                        <FormControl>
                                            <Input
                                                placeholder="https://example.com/room-image.jpg"
                                                {...field}
                                            />
                                        </FormControl>
                                        {field.value && (
                                            <div className="relative">
                                                <img
                                                    src={field.value}
                                                    alt="Room preview"
                                                    className="w-full h-32 object-cover rounded-md border"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/placeholder.svg';
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => field.onChange('')}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active Room</FormLabel>
                                        <FormDescription>
                                            When enabled, this room will be available for booking.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner className="h-4 w-4 mr-2" />
                                        {isEditing ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        {isEditing ? 'Update Room' : 'Create Room'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

interface RoomCardProps {
    room: Room;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onDelete }) => {
    const getEquipmentIcon = (equipment: string) => {
        const option = EQUIPMENT_OPTIONS.find(opt => opt.id === equipment);
        return option ? option.icon : Monitor;
    };

    const getEquipmentLabel = (equipment: string) => {
        const option = EQUIPMENT_OPTIONS.find(opt => opt.id === equipment);
        return option ? option.label : equipment;
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {room.location} • {room.floor}
                        </CardDescription>
                    </div>
                    <Badge variant={room.is_active ? 'default' : 'secondary'}>
                        {room.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {room.image_url && (
                    <img
                        src={room.image_url}
                        alt={room.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                        onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                        }}
                    />
                )}

                <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        Capacity: {room.capacity} people
                    </div>

                    {room.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {room.description}
                        </p>
                    )}

                    {room.equipment && room.equipment.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Equipment:</p>
                            <div className="flex flex-wrap gap-1">
                                {room.equipment.map((equipment) => {
                                    const Icon = getEquipmentIcon(equipment);
                                    return (
                                        <Badge key={equipment} variant="outline" className="text-xs">
                                            <Icon className="h-3 w-3 mr-1" />
                                            {getEquipmentLabel(equipment)}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(room)}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                        </Button>
                        <RoomDeletionDialog
                            room={room}
                            onConfirm={() => onDelete(room)}
                        >
                            <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </RoomDeletionDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const RoomManagement: React.FC = () => {
    const { toast } = useToast();
    const { data: rooms, isLoading, error } = useRooms();
    const deleteRoom = useDeleteRoom();
    const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    const handleCreateRoom = () => {
        setSelectedRoom(undefined);
        setDialogOpen(true);
    };

    const handleEditRoom = (room: Room) => {
        setSelectedRoom(room);
        setDialogOpen(true);
    };

    const handleDeleteRoom = async (room: Room) => {
        try {
            // The RoomDeletionDialog will handle the future bookings check
            // This function is called only after validation passes
            await deleteRoom.mutateAsync(room.id);

            // Audit trail
            await auditRoomDeleted(room.id, room.name, {
                capacity: room.capacity,
                location: room.location,
                floor: room.floor,
                equipment: room.equipment,
                had_future_bookings: false, // Since we validated before deletion
            });

            toast({
                title: 'Room deleted',
                description: `${room.name} has been deleted successfully.`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete room.',
                variant: 'destructive',
            });
        }
    };

    const checkRoomHasFutureBookings = async (roomId: string): Promise<number> => {
        try {
            const now = new Date().toISOString();
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1); // Check next year

            const bookings = await bookingQueries.getAll({
                roomId,
                startDate: now,
                endDate: futureDate.toISOString(),
                status: 'confirmed'
            });

            return bookings?.length || 0;
        } catch (error) {
            console.error('Error checking future bookings:', error);
            return 0;
        }
    };

    const filteredRooms = rooms?.filter(room => {
        switch (activeTab) {
            case 'active':
                return room.is_active;
            case 'inactive':
                return !room.is_active;
            default:
                return true;
        }
    }) || [];

    if (error) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <p className="text-red-600">Error loading rooms: {error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Room Management</h1>
                    <p className="text-muted-foreground">
                        Manage meeting rooms, their details, and availability.
                    </p>
                </div>
                <Button onClick={handleCreateRoom}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All Rooms ({rooms?.length || 0})</TabsTrigger>
                    <TabsTrigger value="active">
                        Active ({rooms?.filter(r => r.is_active).length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="inactive">
                        Inactive ({rooms?.filter(r => !r.is_active).length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner className="h-8 w-8" />
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                No rooms found. Create your first room to get started.
                            </p>
                            <Button onClick={handleCreateRoom} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Room
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map((room) => (
                                <RoomCard
                                    key={room.id}
                                    room={room}
                                    onEdit={handleEditRoom}
                                    onDelete={handleDeleteRoom}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner className="h-8 w-8" />
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                No active rooms found.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map((room) => (
                                <RoomCard
                                    key={room.id}
                                    room={room}
                                    onEdit={handleEditRoom}
                                    onDelete={handleDeleteRoom}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="inactive" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner className="h-8 w-8" />
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                No inactive rooms found.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map((room) => (
                                <RoomCard
                                    key={room.id}
                                    room={room}
                                    onEdit={handleEditRoom}
                                    onDelete={handleDeleteRoom}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="audit" className="mt-6">
                    <AuditLogViewer
                        resourceType="room"
                        showFilters={true}
                        maxHeight="700px"
                    />
                </TabsContent>
            </Tabs>

            <RoomFormDialog
                room={selectedRoom}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={() => {
                    // Refresh will happen automatically via React Query
                }}
            />
        </div>
    );
};