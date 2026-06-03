import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and check current active session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Session initialization failed', err);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('auth_token', response.access_token);
      
      const profile = await authService.getCurrentUser();
      setUser(profile);
      setIsAuthenticated(true);
      return profile;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const register = useCallback(async (registerData) => {
    setLoading(true);
    try {
      const response = await authService.register(registerData);
      localStorage.setItem('auth_token', response.access_token);
      
      const profile = await authService.getCurrentUser();
      setUser(profile);
      setIsAuthenticated(true);
      return profile;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
