import React from 'react';
import { Building2 } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';
import logoUrl from '@/assets/logo.webp';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto'
};

const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
};

export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 'md',
    showText = false
}) => {
    const { companyName, logoUrl: customLogoUrl, isLoading } = useBranding();

    if (isLoading) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className="animate-pulse">
                    <div className={`bg-gray-300 rounded ${sizeClasses[size]}`}></div>
                </div>
                {showText && (
                    <div className="animate-pulse">
                        <div className="h-6 w-32 bg-gray-300 rounded"></div>
                    </div>
                )}
            </div>
        );
    }

    // Use custom logo if available, otherwise fall back to default logo, then to icon
    const displayLogoUrl = customLogoUrl || logoUrl;
    const displayName = companyName || 'VII Bookings';

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {displayLogoUrl ? (
                <img
                    src={displayLogoUrl}
                    alt={`${displayName} Logo`}
                    className={`${sizeClasses[size]} object-contain`}
                    onError={(e) => {
                        // If custom logo fails, try default logo
                        if (customLogoUrl && e.currentTarget.src === customLogoUrl) {
                            e.currentTarget.src = logoUrl;
                        } else {
                            // If both fail, hide image and show icon
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                        }
                    }}
                />
            ) : (
                <Building2 className={`${iconSizes[size]} text-primary`} />
            )}

            {/* Fallback icon (hidden by default, shown if image fails) */}
            <Building2
                className={`${iconSizes[size]} text-primary hidden`}
            />

            {showText && (
                <span className="font-bold text-foreground">
                    {displayName}
                </span>
            )}
        </div>
    );
};