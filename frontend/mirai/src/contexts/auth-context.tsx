import { useContext, createContext, useState } from 'react';
import type { ReactNode } from 'react';


export type Authenticated = { isAuthenticated: boolean };

const AuthContext = createContext<{ isAuthenticated: Authenticated | null, setIsAuthenticated: (isAuthenticated: Authenticated) => void }>(
        { isAuthenticated: null, setIsAuthenticated: () => { } });

export function AuthProvider({ children }: { children: ReactNode }) {
        const [isAuthenticated, setIsAuthenticated] = useState<Authenticated | null>(null);

        return (
                <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
                        {children}
                </AuthContext.Provider>
        )

};

export const useAuth = () => {
        const context = useContext(AuthContext);
        if (!context) {
                throw new Error("useAuth must be used within an AuthProvider");
        }
        return context;
};
