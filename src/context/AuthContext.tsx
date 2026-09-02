import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  loading: boolean;
  isConfigured: boolean;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; success: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null; success: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null; message?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_STORAGE_KEY = 'sdt_auth_user_v4';
const LOCAL_PROFILE_STORAGE_KEY = 'sdt_auth_profile_v4';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOrCreateProfile = async (authUser: User) => {
    // Synchronously ensure userProfile has immediate data from auth user
    const fallbackProfile: UserProfile = {
      id: authUser.id,
      email: authUser.email || '',
      fullName:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Student Scholar',
      avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
      role: 'student',
      createdAt: new Date().toISOString(),
    };

    setUserProfile((prev) => prev || fallbackProfile);

    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        setUserProfile({
          id: data.id,
          email: data.email,
          fullName: data.full_name || fallbackProfile.fullName,
          avatarUrl: data.avatar_url || fallbackProfile.avatarUrl,
          role: data.role || 'student',
          createdAt: data.created_at,
        });
        return;
      }

      // Upsert profile in background if missing
      await supabase.from('user_profiles').upsert({
        id: fallbackProfile.id,
        email: fallbackProfile.email,
        full_name: fallbackProfile.fullName,
        avatar_url: fallbackProfile.avatarUrl,
        role: fallbackProfile.role,
      });
    } catch (err) {
      console.warn('Profile background sync notice:', err);
    }
  };

  // Single startup auth session initializer & listener
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data: { session: existingSession }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession error:', error.message);
          }
          if (mounted && existingSession) {
            setSession(existingSession);
            setUser(existingSession.user);
            fetchOrCreateProfile(existingSession.user).catch((e) => console.warn(e));
          }
        } else {
          // Check local simulated session for dev sandbox
          const storedUser = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
          const storedProfile = localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
          if (storedUser && storedProfile && mounted) {
            try {
              setUser(JSON.parse(storedUser));
              setUserProfile(JSON.parse(storedProfile));
            } catch {
              localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
              localStorage.removeItem(LOCAL_PROFILE_STORAGE_KEY);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to real Supabase auth state changes
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        if (currentSession?.user) {
          fetchOrCreateProfile(currentSession.user).catch((e) => console.warn(e));
        } else {
          setUserProfile(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        if (error) {
          return { error, success: false };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          fetchOrCreateProfile(data.user).catch((e) => console.warn(e));
          return { error: null, success: true };
        }
        return { error: null, success: true };
      } else {
        // Sandbox environment simulation with persistent storage
        const mockUserId = `user-${Date.now()}`;
        const mockUser: User = {
          id: mockUserId,
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: fullName.trim() },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: email.trim(),
          role: 'authenticated',
        } as unknown as User;

        const newProfile: UserProfile = {
          id: mockUserId,
          email: email.trim(),
          fullName: fullName.trim(),
          role: 'student',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(newProfile));

        setUser(mockUser);
        setUserProfile(newProfile);
        return { error: null, success: true };
      }
    } catch (err: any) {
      return { error: err as Error, success: false };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { error, success: false };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          fetchOrCreateProfile(data.user).catch((e) => console.warn(e));
          return { error: null, success: true };
        }
        return { error: new Error('User account not found or credentials invalid.'), success: false };
      } else {
        // Sandbox sign in simulation
        const trimmedEmail = email.trim();
        const mockUserId = `user-${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const fullName = trimmedEmail.split('@')[0].replace('.', ' ');
        const formattedName = fullName.charAt(0).toUpperCase() + fullName.slice(1);

        const mockUser: User = {
          id: mockUserId,
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: formattedName },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: trimmedEmail,
          role: 'authenticated',
        } as unknown as User;

        const profile: UserProfile = {
          id: mockUserId,
          email: trimmedEmail,
          fullName: formattedName,
          role: 'student',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(profile));

        setUser(mockUser);
        setUserProfile(profile);
        return { error: null, success: true };
      }
    } catch (err: any) {
      return { error: err as Error, success: false };
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/app`,
          },
        });
        if (error) throw error;
        return { error: null };
      } else {
        // Sandbox Google sign in simulation
        const mockUserId = `google-user-${Date.now()}`;
        const mockUser: User = {
          id: mockUserId,
          app_metadata: { provider: 'google' },
          user_metadata: {
            full_name: 'Student Scholar',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'student@university.edu',
          role: 'authenticated',
        } as unknown as User;

        const profile: UserProfile = {
          id: mockUserId,
          email: 'student@university.edu',
          fullName: 'Student Scholar',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'student',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(profile));

        setUser(mockUser);
        setUserProfile(profile);
        return { error: null };
      }
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) return { error };
        return { error: null, message: 'Password reset link has been dispatched to your email address.' };
      } else {
        return {
          error: null,
          message: 'Password reset link dispatched (Demo sandbox mode: please sign in with your credentials).',
        };
      }
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      localStorage.removeItem(LOCAL_PROFILE_STORAGE_KEY);
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...userProfile, ...updates } as UserProfile;
    setUserProfile(updated);

    if (isSupabaseConfigured) {
      await supabase.from('user_profiles').upsert({
        id: user.id,
        email: updated.email,
        full_name: updated.fullName,
        avatar_url: updated.avatarUrl,
        role: updated.role,
      });
    } else {
      localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        isLoading,
        loading: isLoading,
        isConfigured: isSupabaseConfigured,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        resetPassword,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
