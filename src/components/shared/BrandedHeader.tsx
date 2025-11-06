import React from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import { Building2 } from 'lucide-react';

interface BrandedHeaderProps {
    className?: string;
    showLogo?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
    className = '',
    showLogo = true,
    size = 'md'
}) => {
    const { companyName, logoUrl, isLoading } = useBranding();

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                </div>
                <div className="animate-pulse">
                    <div className="h-6 w-32 bg-gray-300 rounded"></div>
                </div>
            </div>
        );
    }

    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl'
    };

    const iconSizes = {
        sm: 'h-5 w-5',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showLogo && (
                <>
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={`${companyName} Logo`}
                            className={`${iconSizes[size]} object-contain`}
                            onError={(e) => {
                                // Fallback to default icon if logo fails to load
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                            }}
                        />
                    ) : null}
                    <Building2
                        className={`${iconSizes[size]} text-primary ${logoUrl ? 'hidden' : 'block'}`}
                    />
                </>
            )}
            <span className={`font-bold ${sizeClasses[size]} text-foreground`}>
                {companyName}
            </span>
        </div>
    );
};