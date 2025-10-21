import Dashboard from './pages/dashboard';
import { Login, SignUp } from './pages/auth';
import Booking from './pages/booking';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import Create from './pages/create';
import NotFound from './pages/not-found';
import ProtectedRoute from './components/protected-route';
import Schedule from './pages/scheduler';
import SidebarLayout from './components/admin-sidebar-layout';

export default function App() {

        return (
                <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/register" element={<SignUp />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/bookings" element={
                                <ProtectedRoute>
                                        <Booking />
                                </ProtectedRoute>
                        } />
                        <Route element={
                                <SidebarLayout />
                        } >
                                <Route path="/create" element={
                                        <Create />
                                } />
                                <Route path="/scheduler" element={
                                        <Schedule />
                                } />
                                <Route path="/dashboard" element={
                                        <Dashboard />
                                } />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                </Routes>
        );
}
