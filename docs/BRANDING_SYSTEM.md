# Branding System Implementation

## Overview
The VII Bookings system now includes a comprehensive branding system that allows administrators to customize the appearance and company information throughout the application.

## Features Implemented

### 1. System Settings Management
- **Database Integration**: Fixed `system_settings` table queries with proper error handling
- **Default Settings Creation**: Automatically creates default settings if none exist
- **Settings Update**: Proper update mechanism with ID-based updates

### 2. Branding Context (`src/contexts/BrandingContext.tsx`)
- **Global State Management**: Provides branding settings throughout the app
- **Real-time Theme Application**: Automatically applies theme colors to CSS custom properties
- **Dynamic Title Updates**: Updates document title with company name
- **Loading States**: Handles loading states gracefully

### 3. Branded Components

#### Logo Component (`src/components/shared/Logo.tsx`)
- **Custom Logo Support**: Uses custom logo URL if provided
- **Fallback System**: Falls back to default logo, then to icon if images fail
- **Dynamic Company Name**: Shows custom company name
- **Multiple Sizes**: Supports sm, md, lg, xl sizes

#### Branded Header (`src/components/shared/BrandedHeader.tsx`)
- **Consistent Branding**: Provides consistent header across the app
- **Logo + Name Display**: Shows both logo and company name
- **Loading States**: Animated loading placeholders

### 4. Enhanced System Settings UI
- **Live Preview**: Shows real-time preview of branding changes
- **Color Picker**: Visual color picker with hex input
- **Logo Preview**: Live preview of uploaded logos
- **Sample Elements**: Shows how theme colors will look on buttons
- **Better Error Handling**: Detailed error messages and retry options

## Technical Implementation

### CSS Custom Properties
The branding system uses CSS custom properties to apply theme colors:
```css
--primary: {h} {s}% {l}%
--primary-foreground: {contrast-color}
--primary-hover: {darker-variant}
--primary-light: {lighter-variant}
```

### Database Schema
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY,
  company_name VARCHAR(100) DEFAULT 'VII Bookings',
  company_logo_url TEXT,
  theme_color VARCHAR(7) DEFAULT '#ff304f',
  max_booking_duration INTEGER DEFAULT 480,
  advance_notice_hours INTEGER DEFAULT 0,
  buffer_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Query Improvements
- **Auto-creation**: Creates default settings if table is empty
- **Proper Updates**: Uses ID-based updates instead of blind single() calls
- **Error Handling**: Graceful error handling with fallbacks

## Usage Instructions

### For Administrators:
1. Navigate to **Admin > System Settings**
2. Click on the **Branding** tab
3. Configure:
   - **Company Name**: Will appear in navigation and page titles
   - **Theme Color**: Primary color used throughout the app
   - **Logo URL**: Custom logo (optional, falls back to default)
4. Use the **Live Preview** to see changes before saving
5. Click **Save Settings** to apply changes
6. Page will reload automatically to apply new branding

### For Developers:
```typescript
// Use branding context in components
import { useBranding } from '@/contexts/BrandingContext';

const MyComponent = () => {
  const { companyName, themeColor, logoUrl } = useBranding();
  
  return (
    <div style={{ color: themeColor }}>
      Welcome to {companyName}
    </div>
  );
};
```

## Key Fixes Applied

### 1. Database Query Issues
- **Fixed `.single()` errors**: Proper handling when no settings exist
- **Added auto-creation**: Creates default settings automatically
- **Improved updates**: ID-based updates instead of blind updates

### 2. Real-time Application
- **CSS Custom Properties**: Theme colors applied immediately
- **Context Provider**: Global state management for branding
- **Component Integration**: Logo and header components use branding context

### 3. User Experience
- **Live Preview**: See changes before saving
- **Loading States**: Smooth loading experience
- **Error Recovery**: Graceful fallbacks and error handling
- **Auto-reload**: Applies changes immediately after saving

## Benefits

1. **Customizable Branding**: Organizations can brand the app with their identity
2. **Professional Appearance**: Consistent branding throughout the application
3. **Easy Management**: Simple admin interface for branding changes
4. **Robust Fallbacks**: Graceful handling of missing logos or failed loads
5. **Real-time Updates**: Changes apply immediately without manual refresh

## Future Enhancements

Potential improvements for future iterations:
- **Multiple Theme Support**: Light/dark theme variants
- **Advanced Color Schemes**: Secondary colors, accent colors
- **Font Customization**: Custom font family selection
- **Favicon Upload**: Custom favicon support
- **Email Template Branding**: Apply branding to notification emails
- **White-label Options**: Complete white-label customization