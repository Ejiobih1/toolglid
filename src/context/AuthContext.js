import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  const [session, setSession] = useState(null);

  // Load user and set up auth state listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsPremium(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user profile data from database
  const loadUserProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      setUser({
        id: authUser.id,
        email: authUser.email,
        isPremium: data?.is_premium || false,
        ...data
      });
      setIsPremium(data?.is_premium || false);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Create user profile if it doesn't exist
      await createUserProfile(authUser);
    } finally {
      setLoading(false);
    }
  };

  // Create user profile in database
  const createUserProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id,
            email: authUser.email,
            is_premium: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setUser({
        id: authUser.id,
        email: authUser.email,
        isPremium: false,
        ...data
      });
      setIsPremium(false);
    } catch (error) {
      console.error('Failed to create user profile:', error);
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await loadUserProfile(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Register new user
  const register = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Supabase will send a confirmation email by default
      // User profile will be created on first login
      return {
        success: true,
        user: data.user,
        message: 'Please check your email to confirm your account.'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsPremium(false);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!session?.user) return;
    await loadUserProfile(session.user);
  };

  // Get access token for API calls
  const getAccessToken = () => {
    return session?.access_token || null;
  };

  const value = {
    user,
    loading,
    isPremium,
    isAuthenticated: !!user && !!session,
    session,
    login,
    register,
    logout,
    refreshUser,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
