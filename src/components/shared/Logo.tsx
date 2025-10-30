import React from 'react';
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

export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 'md',
    showText = false
}) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src={logoUrl}
                alt="VII Bookings Logo"
                className={`${sizeClasses[size]} object-contain`}
            />
            {showText && (
                <span className="font-bold text-foreground">
                    VII Bookings
                </span>
            )}
        </div>
    );
};