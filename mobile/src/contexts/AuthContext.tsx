import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { authApi } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  biometricLogin: () => Promise<boolean>;
  checkBiometricAvailable: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const response = await authApi.me();
        if (response.result?.data?.json) {
          setUser(response.result.data.json);
        }
      }
    } catch (error) {
      console.log('Not authenticated');
      await SecureStore.deleteItemAsync('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.result?.data?.json) {
      const { token, user: userData } = response.result.data.json;
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userEmail', email);
      setUser(userData);
    } else {
      throw new Error('Login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register(name, email, password);
    if (response.result?.data?.json) {
      const { token, user: userData } = response.result.data.json;
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userEmail', email);
      setUser(userData);
    } else {
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    }
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
  };

  const checkBiometricAvailable = async (): Promise<boolean> => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const savedEmail = await SecureStore.getItemAsync('userEmail');
    return compatible && enrolled && !!savedEmail;
  };

  const biometricLogin = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to REOP-AI',
        fallbackLabel: 'Use password',
      });

      if (result.success) {
        // Check if we have a valid token
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          const response = await authApi.me();
          if (response.result?.data?.json) {
            setUser(response.result.data.json);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Biometric login error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        biometricLogin,
        checkBiometricAvailable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
