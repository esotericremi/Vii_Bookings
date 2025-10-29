import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsQueries, userQueries } from '@/lib/queries';
import { SystemSettings, SystemSettingsFormData, UserRoleUpdate } from '@/types/settings';
import { useToast } from '@/hooks/use-toast';

// Hook for fetching system settings
export const useSystemSettings = () => {
    return useQuery({
        queryKey: ['system-settings'],
        queryFn: settingsQueries.get,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Hook for updating system settings
export const useUpdateSystemSettings = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (updates: Partial<SystemSettingsFormData>) =>
            settingsQueries.update(updates),
        onSuccess: (data: SystemSettings) => {
            queryClient.setQueryData(['system-settings'], data);
            toast({
                title: 'Settings Updated',
                description: 'System settings have been successfully updated.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Update Failed',
                description: error.message || 'Failed to update system settings.',
                variant: 'destructive',
            });
        },
    });
};

// Hook for fetching all users (for role management)
export const useAllUsers = () => {
    return useQuery({
        queryKey: ['all-users'],
        queryFn: userQueries.getAll,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

// Hook for updating user roles
export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, role }: UserRoleUpdate) =>
            userQueries.updateRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
            toast({
                title: 'Role Updated',
                description: 'User role has been successfully updated.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Update Failed',
                description: error.message || 'Failed to update user role.',
                variant: 'destructive',
            });
        },
    });
};