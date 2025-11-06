import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { SystemSettings } from '@/types/settings';

interface BrandingContextType {
    settings: SystemSettings | null;
    isLoading: boolean;
    companyName: string;
    themeColor: string;
    logoUrl: string | null;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};

interface BrandingProviderProps {
    children: React.ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
    const { data: settings, isLoading } = useSystemSettings();
    const [appliedTheme, setAppliedTheme] = useState<string>('#ff304f');

    // Apply theme color to CSS custom properties
    useEffect(() => {
        if (settings?.theme_color) {
            setAppliedTheme(settings.theme_color);

            // Apply the theme color to CSS custom properties
            const root = document.documentElement;

            // Convert hex to HSL for better color variations
            const hexToHsl = (hex: string) => {
                const r = parseInt(hex.slice(1, 3), 16) / 255;
                const g = parseInt(hex.slice(3, 5), 16) / 255;
                const b = parseInt(hex.slice(5, 7), 16) / 255;

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                let h = 0, s = 0, l = (max + min) / 2;

                if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / d + 2; break;
                        case b: h = (r - g) / d + 4; break;
                    }
                    h /= 6;
                }

                return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
            };

            const [h, s, l] = hexToHsl(settings.theme_color);

            // Set CSS custom properties for the theme
            root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
            root.style.setProperty('--primary-foreground', l > 50 ? '0 0% 0%' : '0 0% 100%');

            // Set variations for hover states, etc.
            root.style.setProperty('--primary-hover', `${h} ${s}% ${Math.max(l - 10, 0)}%`);
            root.style.setProperty('--primary-light', `${h} ${Math.max(s - 20, 0)}% ${Math.min(l + 20, 100)}%`);
        }
    }, [settings?.theme_color]);

    // Update document title with company name
    useEffect(() => {
        if (settings?.company_name) {
            const currentTitle = document.title;
            const baseTitleParts = currentTitle.split(' - ');
            if (baseTitleParts.length > 1) {
                document.title = `${baseTitleParts[0]} - ${settings.company_name}`;
            } else {
                document.title = `${currentTitle} - ${settings.company_name}`;
            }
        }
    }, [settings?.company_name]);

    const value: BrandingContextType = {
        settings: settings || null,
        isLoading,
        companyName: settings?.company_name || 'VII Bookings',
        themeColor: appliedTheme,
        logoUrl: settings?.company_logo_url || null,
    };

    return (
        <BrandingContext.Provider value={value}>
            {children}
        </BrandingContext.Provider>
    );
};