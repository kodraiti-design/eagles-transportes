import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';

interface User {
    id: number;
    username: string;
    role: string; // 'ADMIN' | 'OPERATOR'
    permissions: string;
    is_online: boolean;
    last_seen: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: () => { },
    logout: () => { },
    checkAuth: async () => { },
    hasPermission: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const login = (token: string, userData: User) => {
        sessionStorage.setItem('eagles_token', token);
        // Clear any old local storage to prevent confusion
        localStorage.removeItem('eagles_token');
        setUser(userData);
        // Set default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        sessionStorage.removeItem('eagles_token');
        localStorage.removeItem('eagles_token');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        // Optional: Call backend logout to update online status
        axios.post(`${API_URL}/logout`).catch(err => console.error("Logout error", err));
    };

    const checkAuth = async () => {
        // Only check session storage for current session
        const token = sessionStorage.getItem('eagles_token');
        if (!token) {
            // Ensure we don't accidentally pick up an old persistent one content
            localStorage.removeItem('eagles_token');
            setIsLoading(false);
            return;
        }

        try {
            // Set header temporarily to check validity
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await axios.get(`${API_URL}/users/me`);
            setUser(response.data);
        } catch (error) {
            console.error("Auth check failed", error);
            logout(); // Invalid token
        } finally {
            setIsLoading(false);
        }
    };

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        return user.permissions?.includes(permission) || false;
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            checkAuth,
            hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
