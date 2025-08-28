import { useAuth } from "@/contexts/auth-context";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
        const { isAuthenticated } = useAuth();
        return isAuthenticated ? children : <Navigate to="/login" />
}
