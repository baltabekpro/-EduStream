import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { AuthService } from '../lib/api';

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const userData = await AuthService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error("Failed to fetch user", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if we have a token
        if (localStorage.getItem('token')) {
            refreshUser();
        } else {
            setIsLoading(false);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};