import Dashboard from './pages/dashboard';
import { Login, SignUp } from './pages/auth';
import Booking from './pages/booking';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import Create from './pages/create';
import NotFound from './pages/not-found';
import ProtectedRoute from './components/protected-route';
import Schedule from './pages/scheduler';
import AdminSidebarLayout from './components/admin-sidebar-layout';
import Settings from './pages/settings';
import Unauthorized from './pages/unauthorized';
import AppSidebarLayout from './components/app-sidebar-layout';
import AdminSettings from './pages/admin-settings';
import UserBookings from './pages/user-bookings';

export default function App() {

        return (
                <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/register" element={
                                <ProtectedRoute allowedRole='USER'>
                                        <SignUp />
                                </ProtectedRoute>
                        } />
                        <Route path="/login" element={
                                <ProtectedRoute allowedRole='USER'>
                                        <Login />
                                </ProtectedRoute>
                        } />
                        <Route element={
                                <AppSidebarLayout />
                        }>
                                <Route path="/create-booking" element={
                                        <ProtectedRoute allowedRole='USER'>
                                                <Booking />
                                        </ProtectedRoute>
                                } />
                                <Route path="/bookings" element={
                                        <ProtectedRoute allowedRole='USER'>
                                                <UserBookings />
                                        </ProtectedRoute>
                                } />
                                <Route path="/settings" element={
                                        <ProtectedRoute allowedRole='USER'>
                                                <Settings />
                                        </ProtectedRoute>
                                } />
                        </Route >
                        <Route element={
                                <AdminSidebarLayout />
                        } >
                                <Route path="/create" element={
                                        <ProtectedRoute allowedRole='ADMIN'>
                                                <Create />
                                        </ProtectedRoute>
                                } />
                                <Route path="/scheduler" element={

                                        <ProtectedRoute allowedRole='ADMIN'>
                                                <Schedule />
                                        </ProtectedRoute>
                                } />
                                <Route path="/dashboard" element={
                                        <ProtectedRoute allowedRole='ADMIN'>
                                                <Dashboard />
                                        </ProtectedRoute>
                                } />
                                <Route path="/admin-settings" element={
                                        <ProtectedRoute allowedRole='ADMIN'>
                                                <AdminSettings />
                                        </ProtectedRoute>
                                } />
                        </Route>
                        <Route path="/unauthorized" element={<Unauthorized />} />
                        <Route path="*" element={<NotFound />} />
                </Routes>
        );
}
