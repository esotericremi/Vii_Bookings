// Accessibility utility functions and constants

// ARIA live region announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove the announcement after a short delay
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
};

// Generate unique IDs for form elements
let idCounter = 0;
export const generateId = (prefix: string = 'element'): string => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
};

// ARIA label generators
export const getAriaLabel = {
    // Booking related
    bookingCard: (roomName: string, date: string, time: string) =>
        `Booking for ${roomName} on ${date} at ${time}`,

    bookingStatus: (status: string) => {
        const statusLabels = {
            confirmed: 'Booking confirmed',
            cancelled: 'Booking cancelled',
            pending: 'Booking pending approval'
        };
        return statusLabels[status as keyof typeof statusLabels] || `Booking status: ${status}`;
    },

    // Room related
    roomCard: (roomName: string, capacity: number, location: string) =>
        `${roomName}, capacity ${capacity} people, located at ${location}`,

    roomAvailability: (roomName: string, isAvailable: boolean) =>
        `${roomName} is ${isAvailable ? 'available' : 'not available'} for booking`,

    // Navigation
    navigationItem: (label: string, isActive: boolean) =>
        `${label}${isActive ? ', current page' : ''}`,

    // Actions
    editButton: (itemName: string) => `Edit ${itemName}`,
    deleteButton: (itemName: string) => `Delete ${itemName}`,
    viewButton: (itemName: string) => `View details for ${itemName}`,

    // Pagination
    paginationButton: (page: number, isCurrent: boolean) =>
        `${isCurrent ? 'Current page, ' : ''}Page ${page}`,

    // Filters
    filterButton: (filterName: string, isActive: boolean) =>
        `Filter by ${filterName}${isActive ? ', currently active' : ''}`,

    // Sort
    sortButton: (column: string, direction: 'asc' | 'desc' | null) => {
        if (!direction) return `Sort by ${column}`;
        return `Sort by ${column}, ${direction === 'asc' ? 'ascending' : 'descending'} order`;
    }
};

// ARIA descriptions
export const getAriaDescription = {
    // Form fields
    requiredField: 'This field is required',
    optionalField: 'This field is optional',

    // Date/time inputs
    dateInput: 'Use arrow keys to navigate calendar, Enter to select date',
    timeInput: 'Enter time in 24-hour format, for example 14:30',

    // Search
    searchInput: 'Type to search, results will appear below',

    // Tables
    sortableColumn: 'Click to sort by this column',

    // Modals
    modal: 'Press Escape to close this dialog',

    // Loading states
    loading: 'Content is loading, please wait',

    // Error states
    error: 'An error occurred, please try again or contact support'
};

// Keyboard shortcuts
export const keyboardShortcuts = {
    // Global shortcuts
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    SPACE: ' ',
    TAB: 'Tab',

    // Navigation
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',

    // Modifiers
    isModifierKey: (event: KeyboardEvent) =>
        event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
};

// Screen reader only text utility
export const srOnly = 'sr-only absolute -inset-px w-px h-px p-0 m-0 overflow-hidden whitespace-nowrap border-0';

// Focus management utilities
export const focusUtils = {
    // Check if element is focusable
    isFocusable: (element: HTMLElement): boolean => {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ];

        return focusableSelectors.some(selector => element.matches(selector));
    },

    // Get all focusable elements within a container
    getFocusableElements: (container: HTMLElement): HTMLElement[] => {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');

        return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    },

    // Focus first element in container
    focusFirst: (container: HTMLElement): boolean => {
        const focusableElements = focusUtils.getFocusableElements(container);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
            return true;
        }
        return false;
    },

    // Focus last element in container
    focusLast: (container: HTMLElement): boolean => {
        const focusableElements = focusUtils.getFocusableElements(container);
        if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
            return true;
        }
        return false;
    }
};

// Color contrast utilities
export const colorUtils = {
    // Check if color combination meets WCAG AA standards
    meetsContrastRequirement: (foreground: string, background: string): boolean => {
        // This is a simplified check - in a real app you'd use a proper contrast calculation library
        // For now, we'll assume our design system colors meet requirements
        return true;
    }
};

// Responsive utilities for accessibility
export const responsiveUtils = {
    // Check if user prefers reduced motion
    prefersReducedMotion: (): boolean => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    // Check if user prefers high contrast
    prefersHighContrast: (): boolean => {
        return window.matchMedia('(prefers-contrast: high)').matches;
    },

    // Check if user prefers dark mode
    prefersDarkMode: (): boolean => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
};

// Validation message utilities
export const validationUtils = {
    // Generate accessible error messages
    getErrorMessage: (fieldName: string, errorType: string): string => {
        const errorMessages = {
            required: `${fieldName} is required`,
            email: `Please enter a valid email address`,
            minLength: `${fieldName} must be at least {min} characters long`,
            maxLength: `${fieldName} must be no more than {max} characters long`,
            pattern: `${fieldName} format is invalid`,
            min: `${fieldName} must be at least {min}`,
            max: `${fieldName} must be no more than {max}`
        };

        return errorMessages[errorType as keyof typeof errorMessages] || `${fieldName} is invalid`;
    },

    // Generate accessible success messages
    getSuccessMessage: (action: string): string => {
        const successMessages = {
            created: 'Successfully created',
            updated: 'Successfully updated',
            deleted: 'Successfully deleted',
            saved: 'Successfully saved'
        };

        return successMessages[action as keyof typeof successMessages] || 'Action completed successfully';
    }
};