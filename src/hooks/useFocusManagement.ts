import { useEffect, useRef, useCallback } from 'react';

// Hook for managing focus within a component
export const useFocusManagement = () => {
    const containerRef = useRef<HTMLElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Store the currently focused element when component mounts
    useEffect(() => {
        previousFocusRef.current = document.activeElement as HTMLElement;
    }, []);

    // Focus the first focusable element in the container
    const focusFirst = useCallback(() => {
        if (!containerRef.current) return;

        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }, []);

    // Focus the last focusable element in the container
    const focusLast = useCallback(() => {
        if (!containerRef.current) return;

        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
        }
    }, []);

    // Restore focus to the previously focused element
    const restoreFocus = useCallback(() => {
        if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
            previousFocusRef.current.focus();
        }
    }, []);

    // Trap focus within the container
    const trapFocus = useCallback((event: KeyboardEvent) => {
        if (!containerRef.current || event.key !== 'Tab') return;

        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }, []);

    return {
        containerRef,
        focusFirst,
        focusLast,
        restoreFocus,
        trapFocus
    };
};

// Hook for managing focus in modals/dialogs
export const useModalFocus = (isOpen: boolean) => {
    const { containerRef, focusFirst, restoreFocus, trapFocus } = useFocusManagement();

    useEffect(() => {
        if (!isOpen) return;

        // Focus the first element when modal opens
        const timer = setTimeout(focusFirst, 100);

        // Add event listener for focus trapping
        document.addEventListener('keydown', trapFocus);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', trapFocus);
            // Restore focus when modal closes
            restoreFocus();
        };
    }, [isOpen, focusFirst, restoreFocus, trapFocus]);

    return containerRef;
};

// Hook for managing focus in dropdown menus
export const useDropdownFocus = (isOpen: boolean) => {
    const { containerRef, focusFirst, trapFocus } = useFocusManagement();

    useEffect(() => {
        if (!isOpen) return;

        // Focus the first element when dropdown opens
        const timer = setTimeout(focusFirst, 50);

        // Add event listener for focus trapping
        document.addEventListener('keydown', trapFocus);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', trapFocus);
        };
    }, [isOpen, focusFirst, trapFocus]);

    return containerRef;
};

// Hook for skip links
export const useSkipLinks = () => {
    const skipToContent = useCallback(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    const skipToNavigation = useCallback(() => {
        const navigation = document.getElementById('main-navigation');
        if (navigation) {
            navigation.focus();
            navigation.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    return {
        skipToContent,
        skipToNavigation
    };
};

// Utility function to get focusable elements
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
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
};

// Hook for keyboard navigation in lists
export const useListNavigation = <T>(
    items: T[],
    onSelect?: (item: T, index: number) => void
) => {
    const selectedIndexRef = useRef(-1);
    const containerRef = useRef<HTMLElement>(null);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!containerRef.current || items.length === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, items.length - 1);
                focusItemAtIndex(selectedIndexRef.current);
                break;

            case 'ArrowUp':
                event.preventDefault();
                selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
                focusItemAtIndex(selectedIndexRef.current);
                break;

            case 'Home':
                event.preventDefault();
                selectedIndexRef.current = 0;
                focusItemAtIndex(0);
                break;

            case 'End':
                event.preventDefault();
                selectedIndexRef.current = items.length - 1;
                focusItemAtIndex(items.length - 1);
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                if (selectedIndexRef.current >= 0 && onSelect) {
                    onSelect(items[selectedIndexRef.current], selectedIndexRef.current);
                }
                break;
        }
    }, [items, onSelect]);

    const focusItemAtIndex = useCallback((index: number) => {
        if (!containerRef.current) return;

        const items = containerRef.current.querySelectorAll('[role="option"], [data-list-item]');
        const item = items[index] as HTMLElement;
        if (item) {
            item.focus();
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return {
        containerRef,
        selectedIndex: selectedIndexRef.current,
        setSelectedIndex: (index: number) => {
            selectedIndexRef.current = index;
            focusItemAtIndex(index);
        }
    };
};