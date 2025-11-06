import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Public pages
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { Unauthorized } from '@/pages/auth/Unauthorized';
import NotFound from '@/pages/NotFound';

// Staff pages (keep these as regular imports for faster initial load)
import { RoomSelection } from '@/pages/RoomSelection';
import Dashboard from '@/pages/Dashboard';
import { MyBookings } from '@/pages/MyBookings';
import { BookingForm } from '@/pages/BookingForm';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';

// Admin pages (lazy load for code splitting)
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminBookings = lazy(() => import('@/pages/admin/AdminBookings'));
const RoomManagement = lazy(() => import('@/pages/admin/RoomManagement').then(module => ({ default: module.RoomManagement })));
const Analytics = lazy(() => import('@/pages/admin/Analytics').then(module => ({ default: module.Analytics })));
const AdminSettings = lazy(() => import('@/pages/admin/Settings'));

// Loading component for lazy-loaded routes
const LazyLoadingFallback: React.FC = () => (
    <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
        <span className="ml-2">Loading...</span>
    </div>
);

export const AppRouter: React.FC = () => {
    return (
        <Routes>
            {/* Public routes - no authentication required */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes - authentication required */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/rooms"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoomSelection />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/my-bookings"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <MyBookings />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/book"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <BookingForm />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Profile />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Settings />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Admin routes - admin role required with lazy loading */}
            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <Navigate to="/" replace />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/dashboard"
                element={
                    <AdminRoute>
                        <Navigate to="/" replace />
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/bookings"
                element={
                    <AdminRoute>
                        <Layout>
                            <Suspense fallback={<LazyLoadingFallback />}>
                                <AdminBookings />
                            </Suspense>
                        </Layout>
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/rooms"
                element={
                    <AdminRoute>
                        <Layout>
                            <Suspense fallback={<LazyLoadingFallback />}>
                                <RoomManagement />
                            </Suspense>
                        </Layout>
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/analytics"
                element={
                    <AdminRoute>
                        <Layout>
                            <Suspense fallback={<LazyLoadingFallback />}>
                                <Analytics />
                            </Suspense>
                        </Layout>
                    </AdminRoute>
                }
            />

            <Route
                path="/admin/settings"
                element={
                    <AdminRoute>
                        <Layout>
                            <Suspense fallback={<LazyLoadingFallback />}>
                                <AdminSettings />
                            </Suspense>
                        </Layout>
                    </AdminRoute>
                }
            />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};