import { useState, useEffect } from 'react';
import { Search, Filter, X, Users, MapPin, Building, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRoomFloors, useRoomLocations, useRoomEquipment } from '@/hooks/useRooms';
import type { RoomFilter } from '@/types/room';

interface RoomFiltersProps {
    filters: RoomFilter;
    onFiltersChange: (filters: RoomFilter) => void;
    className?: string;
}

export const RoomFilters = ({ filters, onFiltersChange, className }: RoomFiltersProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<RoomFilter>(filters);

    // Get room metadata
    const { data: floors = [], isLoading: floorsLoading } = useRoomFloors();
    const { data: locations = [], isLoading: locationsLoading } = useRoomLocations();
    const { data: equipment = [], isLoading: equipmentLoading } = useRoomEquipment();

    const isLoading = floorsLoading || locationsLoading || equipmentLoading;

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleFilterChange = (key: keyof RoomFilter, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleEquipmentToggle = (equipmentItem: string, checked: boolean) => {
        const currentEquipment = localFilters.equipment || [];
        const newEquipment = checked
            ? [...currentEquipment, equipmentItem]
            : currentEquipment.filter(item => item !== equipmentItem);

        handleFilterChange('equipment', newEquipment.length > 0 ? newEquipment : undefined);
    };

    const clearFilters = () => {
        const clearedFilters: RoomFilter = {};
        setLocalFilters(clearedFilters);
        onFiltersChange(clearedFilters);
    };

    const hasActiveFilters = Object.keys(localFilters).some(key => {
        const value = localFilters[key as keyof RoomFilter];
        return value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
    });

    const getActiveFilterCount = () => {
        let count = 0;
        if (localFilters.search) count++;
        if (localFilters.capacity_min || localFilters.capacity_max) count++;
        if (localFilters.floor) count++;
        if (localFilters.location) count++;
        if (localFilters.equipment && localFilters.equipment.length > 0) count++;
        return count;
    };

    return (
        <Card className={className}>
            <CardContent className="p-4">
                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search rooms by name, location, or description..."
                        value={localFilters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                        className="pl-10"
                    />
                </div>

                {/* Filter Toggle */}
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <div className="flex items-center justify-between mb-4">
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                                {hasActiveFilters && (
                                    <Badge variant="secondary" className="ml-1">
                                        {getActiveFilterCount()}
                                    </Badge>
                                )}
                            </Button>
                        </CollapsibleTrigger>

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>

                    <CollapsibleContent className="space-y-4">
                        {/* Capacity Filter */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="capacity-min" className="text-sm font-medium flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Min Capacity
                                </Label>
                                <Input
                                    id="capacity-min"
                                    type="number"
                                    placeholder="Min"
                                    value={localFilters.capacity_min || ''}
                                    onChange={(e) => handleFilterChange('capacity_min', e.target.value ? parseInt(e.target.value) : undefined)}
                                    min="1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="capacity-max" className="text-sm font-medium">
                                    Max Capacity
                                </Label>
                                <Input
                                    id="capacity-max"
                                    type="number"
                                    placeholder="Max"
                                    value={localFilters.capacity_max || ''}
                                    onChange={(e) => handleFilterChange('capacity_max', e.target.value ? parseInt(e.target.value) : undefined)}
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Floor Filter */}
                        <div>
                            <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                                <Building className="h-3 w-3" />
                                Floor
                            </Label>
                            <Select
                                value={localFilters.floor || 'all'}
                                onValueChange={(value) => handleFilterChange('floor', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select floor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All floors</SelectItem>
                                    {floors.map((floor) => (
                                        <SelectItem key={floor} value={floor}>
                                            Floor {floor}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Location Filter */}
                        <div>
                            <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                                <MapPin className="h-3 w-3" />
                                Location
                            </Label>
                            <Select
                                value={localFilters.location || 'all'}
                                onValueChange={(value) => handleFilterChange('location', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All locations</SelectItem>
                                    {locations.map((location) => (
                                        <SelectItem key={location} value={location}>
                                            {location}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Equipment Filter */}
                        <div>
                            <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                                <Wrench className="h-3 w-3" />
                                Equipment
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {equipment.map((equipmentItem) => (
                                    <div key={equipmentItem} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`equipment-${equipmentItem}`}
                                            checked={localFilters.equipment?.includes(equipmentItem) || false}
                                            onCheckedChange={(checked) => handleEquipmentToggle(equipmentItem, checked as boolean)}
                                        />
                                        <Label
                                            htmlFor={`equipment-${equipmentItem}`}
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            {equipmentItem}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex flex-wrap gap-2">
                            {localFilters.search && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    Search: {localFilters.search}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => handleFilterChange('search', undefined)}
                                    />
                                </Badge>
                            )}

                            {(localFilters.capacity_min || localFilters.capacity_max) && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    Capacity: {localFilters.capacity_min || 0}-{localFilters.capacity_max || '∞'}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                            handleFilterChange('capacity_min', undefined);
                                            handleFilterChange('capacity_max', undefined);
                                        }}
                                    />
                                </Badge>
                            )}

                            {localFilters.floor && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    Floor {localFilters.floor}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => handleFilterChange('floor', undefined)}
                                    />
                                </Badge>
                            )}

                            {localFilters.location && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    {localFilters.location}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => handleFilterChange('location', undefined)}
                                    />
                                </Badge>
                            )}

                            {localFilters.equipment?.map((equipmentItem) => (
                                <Badge key={equipmentItem} variant="secondary" className="flex items-center gap-1">
                                    {equipmentItem}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => handleEquipmentToggle(equipmentItem, false)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};