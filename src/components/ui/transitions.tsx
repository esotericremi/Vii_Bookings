import React from 'react';
import { cn } from '@/lib/utils';

// Fade in transition
export interface FadeInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
    children,
    className,
    delay = 0,
    duration = 300
}) => (
    <div
        className={cn(
            'animate-in fade-in',
            className
        )}
        style={{
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
            animationFillMode: 'both'
        }}
    >
        {children}
    </div>
);

// Slide in from bottom
export interface SlideInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
}

export const SlideInFromBottom: React.FC<SlideInProps> = ({
    children,
    className,
    delay = 0,
    duration = 300
}) => (
    <div
        className={cn(
            'animate-in slide-in-from-bottom-4',
            className
        )}
        style={{
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
            animationFillMode: 'both'
        }}
    >
        {children}
    </div>
);

// Slide in from left
export const SlideInFromLeft: React.FC<SlideInProps> = ({
    children,
    className,
    delay = 0,
    duration = 300
}) => (
    <div
        className={cn(
            'animate-in slide-in-from-left-4',
            className
        )}
        style={{
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
            animationFillMode: 'both'
        }}
    >
        {children}
    </div>
);

// Scale in transition
export const ScaleIn: React.FC<SlideInProps> = ({
    children,
    className,
    delay = 0,
    duration = 300
}) => (
    <div
        className={cn(
            'animate-in zoom-in-95',
            className
        )}
        style={{
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
            animationFillMode: 'both'
        }}
    >
        {children}
    </div>
);

// Staggered children animation
export interface StaggeredProps {
    children: React.ReactNode[];
    className?: string;
    staggerDelay?: number;
    duration?: number;
}

export const Staggered: React.FC<StaggeredProps> = ({
    children,
    className,
    staggerDelay = 100,
    duration = 300
}) => (
    <div className={className}>
        {React.Children.map(children, (child, index) => (
            <FadeIn key={index} delay={index * staggerDelay} duration={duration}>
                {child}
            </FadeIn>
        ))}
    </div>
);

// Loading state transition
export interface LoadingTransitionProps {
    isLoading: boolean;
    children: React.ReactNode;
    fallback: React.ReactNode;
    className?: string;
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
    isLoading,
    children,
    fallback,
    className
}) => (
    <div className={cn('relative', className)}>
        {isLoading ? (
            <FadeIn key="loading">
                {fallback}
            </FadeIn>
        ) : (
            <FadeIn key="content" delay={100}>
                {children}
            </FadeIn>
        )}
    </div>
);

// Page transition wrapper
export interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => (
    <FadeIn className={cn('min-h-screen', className)} duration={200}>
        {children}
    </FadeIn>
);