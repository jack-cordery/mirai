import { useContext, createContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { GetUserResponse } from '@/types/user';


export type Authenticated = { isAuthenticated: boolean };

const AuthContext = createContext<{ isAuthenticated: Authenticated | null, setIsAuthenticated: (isAuthenticated: Authenticated) => void, user: GetUserResponse | null, setUser: (user: GetUserResponse) => void }>(
        {
                isAuthenticated: null,
                setIsAuthenticated: () => { },
                user: null,
                setUser: () => { },
        });

export function AuthProvider({ children }: { children: ReactNode }) {
        const [isAuthenticated, setIsAuthenticated] = useState<Authenticated | null>(null);
        const [user, setUser] = useState<GetUserResponse | null>(null);

        return (
                <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
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
