import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

type ProtectedRouteProps = {
        children: React.ReactNode;
        allowedRole: ("ADMIN" | "USER");
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
        const { validate, setAdmin } = useAuth();

        if (allowedRole == "ADMIN") {
                setAdmin(true);
        } else {
                setAdmin(false);
        }

        useEffect(() => {
                const checkAuth = async () => {
                        await validate(allowedRole, "/login", "/unauthorized");
                };
                checkAuth();
        }, [validate]);

        return children
}
