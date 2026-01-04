import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load saved user on startup
    useEffect(() => {
        loadSavedUser();
    }, []);

    const loadSavedUser = async () => {
        try {
            const savedUser = await AsyncStorage.getItem('achiever_user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (userData) => {
        try {
            await AsyncStorage.setItem('achiever_user', JSON.stringify(userData));
            setUser(userData);
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            return false;
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('achiever_user');
            setUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
