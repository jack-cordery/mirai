import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type ProtectedRouteProps = {
        children: React.ReactNode;
        allowedRole: ("ADMIN" | "USER" | "");
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
        const { validate, user } = useAuth();
        const navigate = useNavigate();
        useEffect(() => {
                const checkAuth = async () => {
                        await validate("/login");
                };
                checkAuth();
        }, [validate]);

        return children
}
