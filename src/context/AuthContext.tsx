import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isAuthChecking: boolean;
  isProfileHydrating: boolean;
  isAuthReady: boolean;
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
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isProfileHydrating, setIsProfileHydrating] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // In-flight deduplication ref for profile fetching
  const inFlightProfileRef = useRef<string | null>(null);

  const fetchOrCreateProfile = async (authUser: User) => {
    if (!authUser || !authUser.id) return;
    if (inFlightProfileRef.current === authUser.id) {
      return;
    }
    inFlightProfileRef.current = authUser.id;
    setIsProfileHydrating(true);

    try {
      // 1. Fast path: load cached profile from user-scoped storage for 0ms rendering
      const cacheKey = `${LOCAL_PROFILE_STORAGE_KEY}_${authUser.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id === authUser.id) {
            setUserProfile(parsed);
          }
        } catch {
          // ignore cache parse failure
        }
      }

      // Synchronously ensure userProfile has immediate baseline data from auth user
      const fallbackProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        fullName:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          '',
        avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        role: 'student',
        createdAt: new Date().toISOString(),
      };

      setUserProfile((prev) => prev || fallbackProfile);

      if (!isSupabaseConfigured) {
        setIsProfileHydrating(false);
        return;
      }

      // 2. Query Supabase student_profiles (the genuine V4 profile table)
      try {
        const queryPromise = supabase
          .from('student_profiles')
          .select('id, user_id, display_name, name, avatar_url, email')
          .eq('user_id', authUser.id)
          .limit(1)
          .maybeSingle();

        const { data, error } = await withTimeout(
          queryPromise,
          3500,
          { data: null, error: null } as any
        );

        if (data && !error) {
          const resolvedProfile: UserProfile = {
            id: authUser.id,
            email: data.email || authUser.email || fallbackProfile.email,
            fullName: data.display_name || data.name || fallbackProfile.fullName,
            avatarUrl: data.avatar_url || fallbackProfile.avatarUrl,
            role: 'student',
            createdAt: new Date().toISOString(),
          };
          setUserProfile(resolvedProfile);
          localStorage.setItem(cacheKey, JSON.stringify(resolvedProfile));
          return;
        }
      } catch (err) {
        console.warn('Profile background sync noticed:', err);
      }
    } finally {
      inFlightProfileRef.current = null;
      setIsProfileHydrating(false);
    }
  };

  // Single startup auth session initializer & listener
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      setIsAuthChecking(true);
      try {
        if (isSupabaseConfigured) {
          const sessionPromise = supabase.auth.getSession();
          const { data, error } = await withTimeout(
            sessionPromise,
            4000,
            { data: { session: null }, error: null } as any
          );

          if (error) {
            console.warn('Supabase getSession notice:', error.message);
          }

          const existingSession = data?.session;
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
        console.error('Failed to initialize auth session:', err);
      } finally {
        if (mounted) {
          setIsAuthChecking(false);
          setIsAuthReady(true);
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
        setIsAuthChecking(false);
        setIsAuthReady(true);

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
        const signUpPromise = supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        const { data, error } = await withTimeout(signUpPromise, 5000);

        if (error) {
          return { error, success: false };
        }

        if (data?.user) {
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
        const signInPromise = supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        // Strict 5-second timeout so invalid credentials or slow servers fail fast
        const { data, error } = await withTimeout(
          signInPromise,
          5000
        ).catch((err: any) => {
          return {
            data: { user: null, session: null },
            error: new Error(err?.message?.includes('timed out')
              ? 'Authentication server timed out. Please check your connection and try again.'
              : err?.message || 'Login failed.'),
          };
        });

        if (error) {
          return { error, success: false };
        }

        if (data?.user) {
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
        const simulatedEmail = `scholar.${Date.now().toString().slice(-4)}@gmail.com`;
        const mockUser: User = {
          id: mockUserId,
          app_metadata: { provider: 'google' },
          user_metadata: {
            full_name: '',
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: simulatedEmail,
          role: 'authenticated',
        } as unknown as User;

        const profile: UserProfile = {
          id: mockUserId,
          email: simulatedEmail,
          fullName: '',
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
        await withTimeout(supabase.auth.signOut(), 2500).catch(() => {});
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

    const cacheKey = `${LOCAL_PROFILE_STORAGE_KEY}_${user.id}`;
    localStorage.setItem(cacheKey, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      withTimeout(
        supabase.from('student_profiles').update({
          display_name: updated.fullName,
          avatar_url: updated.avatarUrl,
        }).eq('user_id', user.id),
        3000
      ).catch(() => {});
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
        isAuthChecking,
        isProfileHydrating,
        isAuthReady,
        isLoading: isAuthChecking,
        loading: isAuthChecking,
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

