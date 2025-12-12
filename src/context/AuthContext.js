import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, isAuthenticated } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const data = await authAPI.getCurrentUser();
        setUser(data.user);
        setIsPremium(data.user.isPremium);
      } catch (error) {
        console.error('Failed to load user:', error);
        authAPI.logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setUser(data.user);
      setIsPremium(data.user.isPremium);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password) => {
    try {
      const data = await authAPI.register(email, password);
      setUser(data.user);
      setIsPremium(data.user.isPremium);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsPremium(false);
  };

  const refreshUser = async () => {
    try {
      const data = await authAPI.getCurrentUser();
      setUser(data.user);
      setIsPremium(data.user.isPremium);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    loading,
    isPremium,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
