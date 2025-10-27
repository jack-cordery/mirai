import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
        const { validate } = useAuth();
        useEffect(() => {
                const checkAuth = async () => {
                        await validate("/login");
                };
                checkAuth();
        }, [validate]);

        return children
}
