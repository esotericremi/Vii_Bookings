import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className = ''
}) => {
    return (
        <Card className={`border-dashed ${className}`}>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>
                {action && (
                    <Button onClick={action.onClick} className="mt-4">
                        {action.label}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};