'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  session_id: string;
  name: string;
  email: string;
  phone?: string;
  country_code?: string;
}

const AUTH_STORAGE_KEY = 'schemeatlas_auth';

function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore parse errors */ }
  return null;
}

function setStoredUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore user from localStorage
  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string): Promise<{ user: AuthUser | null; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, session_id, name, email, phone, country_code')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error || !data) {
        return { user: null, error: 'No account found with this email. Please sign up first.' };
      }

      const authUser: AuthUser = {
        id: data.id,
        session_id: data.session_id,
        name: data.name || 'User',
        email: data.email,
        phone: data.phone,
        country_code: data.country_code,
      };

      setUser(authUser);
      setStoredUser(authUser);
      return { user: authUser, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Login failed. Please try again.' };
    }
  }, []);

  const signup = useCallback(async (
    name: string,
    email: string,
    phone: string,
    countryCode: string
  ): Promise<{ user: AuthUser | null; error: string | null }> => {
    try {
      const sessionId = crypto.randomUUID();
      const emailLower = email.trim().toLowerCase();

      // Check if email already exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', emailLower)
        .single();

      if (existing) {
        return { user: null, error: 'An account with this email already exists. Please sign in instead.' };
      }

      const { data, error: dbError } = await supabase
        .from('user_profiles')
        .insert([{
          session_id: sessionId,
          name: name.trim(),
          email: emailLower,
          phone: phone,
          country_code: countryCode,
          language: 'en',
          gender: 'Not Specified',
          age: 25,
        }])
        .select('id, session_id, name, email, phone, country_code')
        .single();

      if (dbError) {
        return { user: null, error: dbError.message || 'Signup failed. Please try again.' };
      }

      const authUser: AuthUser = {
        id: data.id,
        session_id: data.session_id,
        name: data.name || name.trim(),
        email: data.email,
        phone: data.phone,
        country_code: data.country_code,
      };

      setUser(authUser);
      setStoredUser(authUser);
      return { user: authUser, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Signup failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setStoredUser(null);
  }, []);

  return { user, loading, login, signup, logout };
}
