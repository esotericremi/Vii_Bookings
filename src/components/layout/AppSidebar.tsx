import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar,
    Users,
    Settings,
    Home,
    CalendarDays,
    BarChart3,
    Building2,
    UserCheck,
    User,
    LogOut,
    ChevronDown
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/user';

interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: UserRole[];
    path: string;
}

const navItems: NavItem[] = [
    {
        id: 'home',
        label: 'Home',
        icon: Home,
        roles: ['staff', 'admin'],
        path: '/'
    },
    {
        id: 'rooms',
        label: 'Room Selection',
        icon: Building2,
        roles: ['staff', 'admin'],
        path: '/rooms'
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        roles: ['staff', 'admin'],
        path: '/dashboard'
    },
    {
        id: 'my-bookings',
        label: 'My Bookings',
        icon: Calendar,
        roles: ['staff', 'admin'],
        path: '/my-bookings'
    },
];

const adminNavItems: NavItem[] = [
    {
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        icon: BarChart3,
        roles: ['admin'],
        path: '/admin/dashboard'
    },
    {
        id: 'admin-rooms',
        label: 'Manage Rooms',
        icon: Building2,
        roles: ['admin'],
        path: '/admin/rooms'
    },
    {
        id: 'admin-bookings',
        label: 'All Bookings',
        icon: Users,
        roles: ['admin'],
        path: '/admin/bookings'
    },
    {
        id: 'admin-analytics',
        label: 'Analytics',
        icon: CalendarDays,
        roles: ['admin'],
        path: '/admin/analytics'
    },
    {
        id: 'admin-settings',
        label: 'System Settings',
        icon: Settings,
        roles: ['admin'],
        path: '/admin/settings'
    },
];

export const AppSidebar: React.FC = () => {
    const { user, userProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const handleSignOut = async () => {
        try {
            const { error } = await signOut();
            if (error) {
                console.error('Sign out error:', error);
            }
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Filter nav items based on user role
    const visibleNavItems = navItems.filter(item =>
        item.roles.includes(userProfile?.role || 'staff')
    );

    const visibleAdminItems = adminNavItems.filter(item =>
        item.roles.includes(userProfile?.role || 'staff')
    );

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="px-2 py-2">
                    <Logo size="md" />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {visibleNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            onClick={() => handleNavigation(item.path)}
                                            isActive={isActive}
                                            tooltip={item.label}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {visibleAdminItems.length > 0 && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>Administration</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {visibleAdminItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;

                                        return (
                                            <SidebarMenuItem key={item.id}>
                                                <SidebarMenuButton
                                                    onClick={() => handleNavigation(item.path)}
                                                    isActive={isActive}
                                                    tooltip={item.label}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span>{item.label}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={userProfile?.avatar_url || ''} />
                                        <AvatarFallback className="rounded-lg bg-blue-100 text-blue-600">
                                            {userProfile?.full_name ? getInitials(userProfile.full_name) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {userProfile?.full_name || user?.email}
                                        </span>
                                        <span className="truncate text-xs">
                                            {user?.email}
                                        </span>
                                    </div>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarImage src={userProfile?.avatar_url || ''} />
                                            <AvatarFallback className="rounded-lg bg-blue-100 text-blue-600">
                                                {userProfile?.full_name ? getInitials(userProfile.full_name) : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">
                                                {userProfile?.full_name || 'User'}
                                            </span>
                                            <span className="truncate text-xs">
                                                {user?.email}
                                            </span>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                                    {userProfile?.role || 'staff'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/profile')}>
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};