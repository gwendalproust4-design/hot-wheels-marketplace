'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDb } from '@/lib/mockDb';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string;
  role: 'buyer' | 'seller';
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password?: string, username?: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SELLER_EMAIL = process.env.NEXT_PUBLIC_SELLER_EMAIL || 'vendeur@placeholder.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    async function loadSession() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const isSeller = session.user.email === SELLER_EMAIL;

            if (profile) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                username: profile.username || '',
                full_name: profile.full_name || '',
                avatar_url: profile.avatar_url || '',
                role: (profile.role === 'seller' || isSeller) ? 'seller' : 'buyer',
                created_at: profile.created_at,
              });
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                username: session.user.email?.split('@')[0] || 'collector',
                full_name: 'Collectionneur',
                avatar_url: '',
                role: isSeller ? 'seller' : 'buyer',
                created_at: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
        }
      } else {
        // Mock Session
        const cachedUser = localStorage.getItem('hw_session_user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        } else {
          // Pre-populate a demo buyer user so they don't even have to sign up
          const demoUser: AuthUser = {
            id: 'buyer-demo',
            email: 'buyer@placeholder.com',
            username: 'Mini_Collector',
            full_name: 'Lucas Collector',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
            role: 'buyer',
            created_at: new Date().toISOString()
          };
          setUser(demoUser);
          localStorage.setItem('hw_session_user', JSON.stringify(demoUser));
          
          if (!mockDb.getProfileById(demoUser.id)) {
            mockDb.register({
              id: demoUser.id,
              username: demoUser.username,
              full_name: demoUser.full_name,
              avatar_url: demoUser.avatar_url,
              role: 'buyer' as any
            });
          }
        }
      }
      setLoading(false);
    }

    loadSession();
  }, []);

  const signIn = async (email: string, password = '') => {
    setLoading(true);
    try {
      const isSeller = email === SELLER_EMAIL;

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            username: profile?.username || email.split('@')[0],
            full_name: profile?.full_name || 'Collectionneur',
            avatar_url: profile?.avatar_url || '',
            role: (profile?.role === 'seller' || isSeller) ? 'seller' : 'buyer',
            created_at: profile?.created_at || new Date().toISOString(),
          };
          setUser(authUser);
          return { success: true };
        }
      } else {
        // Mock Sign In
        const profiles = mockDb.getProfiles();
        let existingProfile = profiles.find(p => p.username.toLowerCase() === email.split('@')[0].toLowerCase() || p.id === email || p.id === 'seller-1' && isSeller);
        
        if (!existingProfile) {
          const mockId = isSeller ? 'seller-1' : 'user-' + Math.random().toString(36).substr(2, 9);
          existingProfile = mockDb.register({
            id: mockId,
            username: email.split('@')[0],
            full_name: email.split('@')[0].toUpperCase(),
            avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*99999)}?auto=format&fit=crop&q=80&w=200`,
            role: isSeller ? 'seller' : 'buyer' as any
          });
        }
        
        const authUser: AuthUser = {
          id: existingProfile.id,
          email: email.includes('@') ? email : `${email}@placeholder.com`,
          username: existingProfile.username,
          full_name: existingProfile.full_name,
          avatar_url: existingProfile.avatar_url,
          role: isSeller ? 'seller' : 'buyer',
          created_at: existingProfile.created_at,
        };
        setUser(authUser);
        localStorage.setItem('hw_session_user', JSON.stringify(authUser));
        return { success: true };
      }
    } catch (error: any) {
      console.error('Sign In Error:', error);
      return { success: false, error: error.message || 'Authentication failed' };
    } finally {
      setLoading(false);
    }
    return { success: false, error: 'Auth failed' };
  };

  const signUp = async (
    email: string,
    password = '',
    username = '',
    fullName = ''
  ) => {
    setLoading(true);
    try {
      const uname = username || email.split('@')[0];
      const fname = fullName || 'Collectionneur';
      const isSeller = email === SELLER_EMAIL;
      
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: uname,
              full_name: fname,
              role: isSeller ? 'seller' : 'buyer',
            }
          }
        });
        if (error) throw error;
        
        return { success: true };
      } else {
        // Mock Sign Up
        const mockId = isSeller ? 'seller-1' : 'user-' + Math.random().toString(36).substr(2, 9);
        const profile = mockDb.register({
          id: mockId,
          username: uname,
          full_name: fname,
          avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
          role: isSeller ? 'seller' : 'buyer' as any
        });

        const authUser: AuthUser = {
          id: profile.id,
          email,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: isSeller ? 'seller' : 'buyer',
          created_at: profile.created_at,
        };
        setUser(authUser);
        localStorage.setItem('hw_session_user', JSON.stringify(authUser));
        return { success: true };
      }
    } catch (error: any) {
      console.error('Sign Up Error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('hw_session_user');
    }
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
