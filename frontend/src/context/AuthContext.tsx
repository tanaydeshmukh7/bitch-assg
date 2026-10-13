import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, authRedirectUrl } from '../lib/supabase';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsDemoUser: (customId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'assignment_studio_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    const initAuth = async () => {
      // 1. Try Supabase Auth if configured
      if (isSupabaseConfigured && supabase) {
        const supabaseClient = supabase;
        api.setAuthTokenProvider(async () => {
          const { data: { session } } = await supabaseClient.auth.getSession();
          return session?.access_token || null;
        });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            });
            setToken(session.access_token);
            api.setAuthToken(session.access_token);
          }
        } catch (err) {
          console.warn('Error reading Supabase session:', err);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            });
            setToken(session.access_token);
            api.setAuthToken(session.access_token);
          } else {
            setUser(null);
            setToken(null);
            api.setAuthToken(null);
          }
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      }

      // 2. Check local storage for persistent demo/mock session
      const savedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
      api.setAuthTokenProvider(null);
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          setUser(parsed.user);
          setToken(parsed.token);
          api.setAuthToken(parsed.token);
        } catch (_) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) {
        throw new Error('No active Supabase session was created. Confirm your email, then sign in again.');
      }
      setUser({
        id: data.session.user.id,
        email: data.session.user.email || email,
        fullName: data.session.user.user_metadata?.full_name,
      });
      setToken(data.session.access_token);
      api.setAuthToken(data.session.access_token);
    } else {
      // Local fallback sign-in
      const demoId = `user_${btoa(email).substring(0, 8)}`;
      const demoUser = { id: demoId, email, fullName: email.split('@')[0] };
      const demoTok = `test_token_${demoId}`;
      setUser(demoUser);
      setToken(demoTok);
      api.setAuthToken(demoTok);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: demoUser, token: demoTok }));
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: authRedirectUrl(),
        },
      });
      if (error) throw error;
      if (data.session) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || email,
          fullName,
        });
        setToken(data.session.access_token);
        api.setAuthToken(data.session.access_token);
      }
    } else {
      // Local fallback sign-up
      const demoId = `user_${btoa(email).substring(0, 8)}`;
      const demoUser = { id: demoId, email, fullName: fullName || email.split('@')[0] };
      const demoTok = `test_token_${demoId}`;
      setUser(demoUser);
      setToken(demoTok);
      api.setAuthToken(demoTok);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: demoUser, token: demoTok }));
    }
  };

  const resendConfirmation = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Email confirmation is unavailable in demo mode.');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setToken(null);
    api.setAuthToken(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    }
  };

  const loginAsDemoUser = (customId?: string) => {
    if (isSupabaseConfigured) {
      throw new Error('Demo Login is available only when Supabase is not configured. Sign in with Supabase.');
    }
    const id = customId || 'demo_student_01';
    const demoUser: UserProfile = {
      id,
      email: `${id}@assignmentstudio.local`,
      fullName: 'Alex Morgan (Student)',
    };
    const demoTok = `test_token_${id}`;
    setUser(demoUser);
    setToken(demoTok);
    api.setAuthToken(demoTok);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: demoUser, token: demoTok }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        isSupabaseConfigured,
        signIn,
        signUp,
        resendConfirmation,
        signOut,
        resetPassword,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
