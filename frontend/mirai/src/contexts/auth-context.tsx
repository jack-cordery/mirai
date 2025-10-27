import { useContext, createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getSessionStatus, postLogin, postLogout, postRegister, type LoginResponse, type SessionStatusResponse } from '@/api/auth';
import { useNavigate } from 'react-router-dom';

type User = {
        id: number;
        email: string;
        role?: string[];
};

const AuthContext = createContext<{
        user: User | null,
        isAuthenticated: boolean,
        loading: boolean,
        setLoading: (b: boolean) => void,
        login: (email: string, password: string, redirect: string) => Promise<void>,
        register: (name: string, surname: string, email: string, password: string) => Promise<void>,
        logout: (redirect: string) => Promise<void>,
        validate: (redirect: string) => Promise<void>,
        title: string,
        setTitle: (title: string) => void,
}>(
        {
                user: null,
                isAuthenticated: false,
                loading: true,
                setLoading: () => { },
                login: async () => { },
                register: async () => { },
                logout: async () => { },
                validate: async () => { },
                title: "",
                setTitle: () => { },
        });

export function AuthProvider({ children }: { children: ReactNode }) {
        const [title, setTitle] = useState("Mirai.");
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [user, setUser] = useState<User | null>(null);
        const [loading, setLoading] = useState(false);
        const navigate = useNavigate();

        const login = useCallback(async (email: string, password: string, redirect: string) => {
                try {
                        const res: LoginResponse = await postLogin({ email, password });
                        setIsAuthenticated(true);
                        setUser({ id: res.id, email: res.email, role: res.permissions });
                        setLoading(false);
                        navigate(redirect);
                } catch (err) {
                        console.log(err)
                        throw new Error(`login failed with ${err}`)
                }

        }, []);

        const register = useCallback(async (name: string, surname: string, email: string, password: string) => {
                try {
                        await postRegister({ name, surname, email, password });
                } catch (err) {
                        console.log(err)
                        throw new Error(`login failed with ${err}`)
                }

        }, []);

        const logout = useCallback(async (redirect: string) => {
                try {
                        await postLogout();
                        setUser(null);
                        setIsAuthenticated(false);
                        navigate(redirect);
                } catch (err) {
                        console.log(err)
                }
        }, []);

        const validate = useCallback(async (redirect: string) => {
                try {
                        const res: SessionStatusResponse = await getSessionStatus();
                        setUser({ id: res.userID, email: res.email, role: res.permissions });
                        setLoading(false);
                        setIsAuthenticated(true);
                } catch (err) {
                        console.log(err);
                        setLoading(false);
                        navigate(redirect);
                }
        }, []);


        return (
                <AuthContext.Provider value={{ user, isAuthenticated, loading, setLoading, login, register, logout, validate, title, setTitle }}>
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
