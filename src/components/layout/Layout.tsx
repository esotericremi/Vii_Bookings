import React from 'react';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSkipLinks } from '@/hooks/useFocusManagement';
import { srOnly } from '@/lib/accessibility';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface LayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    showBreadcrumb?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    pageTitle,
    showBreadcrumb = true
}) => {
    const { skipToContent, skipToNavigation } = useSkipLinks();

    // Set page title
    usePageTitle(pageTitle);

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-gray-50 flex w-full">
                {/* Skip Links */}
                <div className={srOnly}>
                    <button
                        onClick={skipToContent}
                        className="focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
                    >
                        Skip to main content
                    </button>
                    <button
                        onClick={skipToNavigation}
                        className="focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
                    >
                        Skip to navigation
                    </button>
                </div>

                <AppSidebar />
                <SidebarInset className="w-full !m-0 !ml-0">
                    <Header />
                    <main
                        id="main-content"
                        className="flex-1 py-6 w-full"
                        tabIndex={-1}
                        role="main"
                        aria-label="Main content"
                    >
                        {showBreadcrumb && (
                            <nav aria-label="Breadcrumb" className="mb-6 px-4 sm:px-6 lg:px-8">
                                <Breadcrumb />
                            </nav>
                        )}
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};