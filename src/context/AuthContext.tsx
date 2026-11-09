import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { ProfileRole, UserProfile } from '../types';

// Inactivity timeout threshold: 15 minutes without interaction
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
export const LAST_ACTIVITY_KEY = 'qc_last_activity_timestamp';

/**
 * Checks whether user has exceeded the idle/inactivity threshold
 */
export function isSessionExpiredDueToInactivity(): boolean {
  try {
    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivityStr) return false;
    const lastActivity = parseInt(lastActivityStr, 10);
    if (isNaN(lastActivity)) return false;
    const elapsed = Date.now() - lastActivity;
    return elapsed > INACTIVITY_TIMEOUT_MS;
  } catch {
    return false;
  }
}

/**
 * Updates the last activity timestamp in localStorage
 */
export function updateLastActivityTimestamp(): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch {}
}

/**
 * Clears the activity timestamp upon sign out or session termination
 */
export function clearActivityTimestamp(): void {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {}
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: ProfileRole | null;
  fullName: string;
  employeeId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isUser: boolean;
  canManageUsers: boolean;
  signIn: (identifier: string, password: string, panelRole?: 'inspector' | 'admin') => Promise<{
    success: boolean;
    error?: string;
    profile?: UserProfile;
  }>;
  signOut: (destination?: string) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  setUserDetails: (details: {
    id: string;
    employee_id: string;
    full_name: string;
    role: ProfileRole;
    email?: string;
  }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // If user was inactive for too long prior to page reload/refresh, do not restore state
  const isExpiredOnInit = isSessionExpiredDueToInactivity();

  const [role, setRole] = useState<ProfileRole | null>(() => {
    if (isExpiredOnInit) return null;
    return (sessionStorage.getItem('qc_auth_profile_role') as ProfileRole | null) || null;
  });
  const [fullName, setFullName] = useState<string>(() => {
    if (isExpiredOnInit) return '';
    return sessionStorage.getItem('qc_auth_full_name') || '';
  });
  const [employeeId, setEmployeeId] = useState<string>(() => {
    if (isExpiredOnInit) return '';
    return sessionStorage.getItem('qc_auth_employee_id') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (isExpiredOnInit) return false;
    return sessionStorage.getItem('qc_auth_logged_in') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);


  // Helper to persist auth details to sessionStorage for smooth navigation and reloads
  const persistSession = useCallback((
    pRole: ProfileRole,
    pName: string,
    pEmpId: string,
    pUserId: string,
    panelRole: 'inspector' | 'admin'
  ) => {
    sessionStorage.setItem('qc_auth_logged_in', 'true');
    sessionStorage.setItem('qc_auth_role', panelRole);
    sessionStorage.setItem('qc_auth_profile_role', pRole);
    sessionStorage.setItem('qc_auth_full_name', pName);
    sessionStorage.setItem('qc_auth_employee_id', pEmpId);
    sessionStorage.setItem('qc_auth_user_id', pEmpId || pUserId);
  }, []);

  // Fetch profile directly using the standard frontend supabase client (with anon key)
  const fetchProfileFromDatabase = useCallback(async (userIdOrEmpId: string, rawEmpId?: string): Promise<UserProfile | null> => {
    try {
      // 1. Query by ID with standard supabase client
      let { data, error } = await supabase
        .from('profiles')
        .select('id, employee_id, full_name, role, created_at')
        .eq('id', userIdOrEmpId)
        .maybeSingle();

      // 2. If not found by ID and rawEmpId provided, query by employee_id
      if (!data && rawEmpId) {
        const altQuery = await supabase
          .from('profiles')
          .select('id, employee_id, full_name, role, created_at')
          .or(`employee_id.eq.${rawEmpId},employee_id.ilike.${rawEmpId}`)
          .maybeSingle();

        if (altQuery.data) {
          data = altQuery.data;
        }
      }

      if (data) {
        const normalizedRole: ProfileRole = 
          (data.role as string)?.toUpperCase() === 'SUPER_ADMIN' 
            ? 'SUPER_ADMIN' 
            : (data.role as string)?.toUpperCase() === 'ADMIN' 
            ? 'ADMIN' 
            : 'USER';

        const loadedProfile: UserProfile = {
          id: data.id,
          employee_id: data.employee_id || rawEmpId || '',
          full_name: data.full_name || 'User',
          role: normalizedRole,
          created_at: data.created_at,
        };
        return loadedProfile;
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to query profiles table with anon key:', err);
    }
    return null;
  }, []);

  // Direct manual setter for fast-path / fallback
  const setUserDetails = useCallback((details: {
    id: string;
    employee_id: string;
    full_name: string;
    role: ProfileRole;
    email?: string;
  }) => {
    const normalizedRole = details.role;
    setRole(normalizedRole);
    setFullName(details.full_name);
    setEmployeeId(details.employee_id);
    setIsAuthenticated(true);
    updateLastActivityTimestamp();
    setProfile({
      id: details.id,
      employee_id: details.employee_id,
      full_name: details.full_name,
      role: normalizedRole,
      email: details.email,
    });

    const panelRole = normalizedRole === 'USER' ? 'inspector' : 'admin';
    persistSession(normalizedRole, details.full_name, details.employee_id, details.id, panelRole);
  }, [persistSession]);

  // Refresh profile for currently signed-in user
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user?.id && !employeeId) return null;
    const targetId = user?.id || employeeId;
    const loadedProfile = await fetchProfileFromDatabase(targetId, employeeId);
    if (loadedProfile) {
      setProfile(loadedProfile);
      setRole(loadedProfile.role);
      setFullName(loadedProfile.full_name);
      setEmployeeId(loadedProfile.employee_id);
      const panelRole = loadedProfile.role === 'USER' ? 'inspector' : 'admin';
      persistSession(loadedProfile.role, loadedProfile.full_name, loadedProfile.employee_id, loadedProfile.id, panelRole);
    }
    return loadedProfile;
  }, [user?.id, employeeId, fetchProfileFromDatabase, persistSession]);

  // Initial session restoration and listener setup
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // 1. INACTIVITY TIMEOUT CHECK ON PAGE REFRESH / INITIAL LOAD:
        if (isSessionExpiredDueToInactivity()) {
          console.log('[AuthContext] Inactivity timeout expired prior to page refresh. Logging out and redirecting to home.');
          clearActivityTimestamp();
          sessionStorage.removeItem('qc_auth_logged_in');
          sessionStorage.removeItem('qc_auth_role');
          sessionStorage.removeItem('qc_auth_user_id');
          sessionStorage.removeItem('qc_auth_profile_role');
          sessionStorage.removeItem('qc_auth_full_name');
          sessionStorage.removeItem('qc_auth_employee_id');
          await supabase.auth.signOut().catch(() => {});

          if (isMounted) {
            setUser(null);
            setProfile(null);
            setRole(null);
            setFullName('');
            setEmployeeId('');
            setIsAuthenticated(false);
            setIsLoading(false);
            setIsInitializing(false);
          }

          toast.error('Session expired due to inactivity. You have been redirected to the home page.', {
            id: 'inactivity-timeout-toast',
            duration: 5000,
            icon: '⏱️',
          });

          navigate('/', { replace: true });
          return;
        }

        // Check active Supabase session
        const { data: sessionData } = await supabase.auth.getSession();
        const activeSession = sessionData?.session;

        if (activeSession?.user) {
          updateLastActivityTimestamp();
          if (isMounted) setUser(activeSession.user);

          // Query profiles directly using standard client with anon key
          const loadedProfile = await fetchProfileFromDatabase(activeSession.user.id);
          if (loadedProfile && isMounted) {
            setProfile(loadedProfile);
            setRole(loadedProfile.role);
            setFullName(loadedProfile.full_name);
            setEmployeeId(loadedProfile.employee_id);
            setIsAuthenticated(true);
            const panelRole = loadedProfile.role === 'USER' ? 'inspector' : 'admin';
            persistSession(loadedProfile.role, loadedProfile.full_name, loadedProfile.employee_id, loadedProfile.id, panelRole);
          }
        } else {
          // If no active Supabase session, check if saved in sessionStorage
          const savedRole = sessionStorage.getItem('qc_auth_profile_role') as ProfileRole | null;
          const savedName = sessionStorage.getItem('qc_auth_full_name');
          const savedEmpId = sessionStorage.getItem('qc_auth_employee_id');
          const isSavedLoggedIn = sessionStorage.getItem('qc_auth_logged_in') === 'true';

          if (isSavedLoggedIn && savedRole && savedEmpId && isMounted) {
            updateLastActivityTimestamp();
            setRole(savedRole);
            setFullName(savedName || savedEmpId);
            setEmployeeId(savedEmpId);
            setIsAuthenticated(true);
            setProfile({
              id: savedEmpId,
              employee_id: savedEmpId,
              full_name: savedName || savedEmpId,
              role: savedRole,
            });
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Session restore check encountered issue:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsInitializing(false);
        }
      }
    }

    initAuth();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        clearActivityTimestamp();
        setUser(null);
        setProfile(null);
        setRole(null);
        setFullName('');
        setEmployeeId('');
        setIsAuthenticated(false);
        sessionStorage.removeItem('qc_auth_logged_in');
        sessionStorage.removeItem('qc_auth_role');
        sessionStorage.removeItem('qc_auth_user_id');
        sessionStorage.removeItem('qc_auth_profile_role');
        sessionStorage.removeItem('qc_auth_full_name');
        sessionStorage.removeItem('qc_auth_employee_id');

        // Cleanly redirect to home page on sign out
        navigate('/');
      } else if (newSession?.user) {
        updateLastActivityTimestamp();
        setUser(newSession.user);
        const loadedProfile = await fetchProfileFromDatabase(newSession.user.id);
        if (loadedProfile && isMounted) {
          setProfile(loadedProfile);
          setRole(loadedProfile.role);
          setFullName(loadedProfile.full_name);
          setEmployeeId(loadedProfile.employee_id);
          setIsAuthenticated(true);
          const panelRole = loadedProfile.role === 'USER' ? 'inspector' : 'admin';
          persistSession(loadedProfile.role, loadedProfile.full_name, loadedProfile.employee_id, loadedProfile.id, panelRole);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileFromDatabase, persistSession, navigate]);

  // Sign in method using standard frontend supabase client
  const signIn = useCallback(async (
    identifier: string,
    passwordInput: string,
    panelRole: 'inspector' | 'admin' = 'inspector'
  ): Promise<{ success: boolean; error?: string; profile?: UserProfile }> => {
    const rawId = identifier.trim();
    const cleanPassword = passwordInput.trim();

    if (!rawId || !cleanPassword) {
      return { success: false, error: 'Please enter both your identifier and password.' };
    }

    const emailToSignIn = rawId.includes('@') ? rawId.toLowerCase() : `${rawId.toLowerCase()}@abc.com`;

    // 1. FAST-PATH: Super Admin master credentials (admin / admin1234)
    if (
      (rawId.toLowerCase() === 'admin' || emailToSignIn === 'admin@abc.com') &&
      cleanPassword === 'admin1234'
    ) {
      // Query profiles table directly with standard frontend supabase client
      let adminName = 'Admin';
      try {
        const { data: pData } = await supabase
          .from('profiles')
          .select('full_name, employee_id, role')
          .eq('employee_id', 'admin')
          .maybeSingle();
        if (pData?.full_name) {
          adminName = pData.full_name;
        }
      } catch {}

      const superAdminProfile: UserProfile = {
        id: '9c9f26c8-b705-4e52-b47a-e9f737a084de',
        employee_id: 'admin',
        full_name: adminName,
        role: 'SUPER_ADMIN',
      };

      setRole('SUPER_ADMIN');
      setFullName(adminName);
      setEmployeeId('admin');
      setIsAuthenticated(true);
      updateLastActivityTimestamp();
      setProfile(superAdminProfile);
      persistSession('SUPER_ADMIN', adminName, 'admin', 'admin', 'admin');

      // Async background signIn
      supabase.auth.signInWithPassword({ email: 'admin@abc.com', password: cleanPassword }).catch(() => {});

      return { success: true, profile: superAdminProfile };
    }

    // 2. STANDARD AUTHENTICATION: supabase.auth.signInWithPassword
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToSignIn,
        password: cleanPassword,
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || 'Invalid credentials. Please verify your Employee ID / Username and password.',
        };
      }

      // 3. DIRECT QUERY OF PROFILES TABLE WITH STANDARD FRONTEND CLIENT (RLS is disabled)
      let resolvedProfile: UserProfile | null = await fetchProfileFromDatabase(authData.user.id, rawId);

      // If lookup by ID failed, try fallback by employee_id or email
      if (!resolvedProfile) {
        try {
          const { data: fallbackData } = await supabase
            .from('profiles')
            .select('id, employee_id, full_name, role, created_at')
            .or(`employee_id.ilike.${rawId},employee_id.eq.${rawId}`)
            .maybeSingle();

          if (fallbackData) {
            resolvedProfile = {
              id: fallbackData.id,
              employee_id: fallbackData.employee_id || rawId,
              full_name: fallbackData.full_name || rawId,
              role: (fallbackData.role as ProfileRole) || 'USER',
              created_at: fallbackData.created_at,
            };
          }
        } catch {}
      }

      // If still not in database, fallback to metadata or defaults
      if (!resolvedProfile) {
        const metaRole = (authData.user.user_metadata?.role as ProfileRole) || 'USER';
        const metaName = authData.user.user_metadata?.full_name || rawId;
        resolvedProfile = {
          id: authData.user.id,
          employee_id: rawId,
          full_name: metaName,
          role: metaRole,
        };
      }

      // 4. RBAC CHECK: If signing into Admin Panel, user must have ADMIN or SUPER_ADMIN role
      if (panelRole === 'admin' && resolvedProfile.role !== 'ADMIN' && resolvedProfile.role !== 'SUPER_ADMIN') {
        // Sign out to prevent unauthorized admin session
        await supabase.auth.signOut().catch(() => {});
        return {
          success: false,
          error: 'Access denied: This account has USER permissions. Only accounts with ADMIN permissions can log in to the Admin Panel.',
        };
      }

      // 5. UPDATE GLOBAL STATE
      setUser(authData.user);
      setProfile(resolvedProfile);
      setRole(resolvedProfile.role);
      setFullName(resolvedProfile.full_name);
      setEmployeeId(resolvedProfile.employee_id);
      setIsAuthenticated(true);
      updateLastActivityTimestamp();

      const targetPanel = resolvedProfile.role === 'USER' ? 'inspector' : panelRole;
      persistSession(
        resolvedProfile.role,
        resolvedProfile.full_name,
        resolvedProfile.employee_id,
        resolvedProfile.id,
        targetPanel
      );

      return { success: true, profile: resolvedProfile };
    } catch (err: any) {
      console.error('[AuthContext] Sign-in error:', err);
      return { success: false, error: err.message || 'Authentication error occurred.' };
    }
  }, [fetchProfileFromDatabase, persistSession]);

  // Sign out method - fully cleanses state and storage, redirects to fresh home page
  const signOut = useCallback(async (destination: string = '/') => {
    // 1. Immediately reset React state synchronously
    clearActivityTimestamp();
    setUser(null);
    setProfile(null);
    setRole(null);
    setFullName('');
    setEmployeeId('');
    setIsAuthenticated(false);

    // 2. Clear all session storage tokens
    sessionStorage.removeItem('qc_auth_logged_in');
    sessionStorage.removeItem('qc_auth_role');
    sessionStorage.removeItem('qc_auth_user_id');
    sessionStorage.removeItem('qc_auth_profile_role');
    sessionStorage.removeItem('qc_auth_full_name');
    sessionStorage.removeItem('qc_auth_employee_id');

    // 3. Clean any Supabase Auth tokens in localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.startsWith('supabase.'))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}

    // 4. Dispatch global event for instant multi-component synchronization
    try {
      window.dispatchEvent(new CustomEvent('qc_auth_logout'));
    } catch {}

    // 5. Asynchronously notify Supabase
    try {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      await supabase.auth.signOut().catch(() => {});
    } catch (err) {
      console.warn('[AuthContext] Sign out error:', err);
    }

    toast.success('Successfully logged out.');
    navigate(destination, { replace: true });
  }, [navigate]);

  // Live user interaction tracking and periodic inactivity watchdog
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastInteraction = Date.now();
    updateLastActivityTimestamp();

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle updating localStorage to once every 4 seconds for optimal performance
      if (now - lastInteraction > 4000) {
        lastInteraction = now;
        updateLastActivityTimestamp();
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check periodically if user has been inactive for longer than threshold
    const watchdogInterval = setInterval(() => {
      if (isSessionExpiredDueToInactivity()) {
        console.log('[AuthContext] Inactivity watchdog: session expired. Logging out and redirecting to home.');
        clearActivityTimestamp();
        toast.error('Session expired due to inactivity. You have been redirected to the home page.', {
          id: 'inactivity-timeout-toast',
          duration: 5000,
          icon: '⏱️',
        });
        signOut('/');
      }
    }, 15000); // Check every 15 seconds

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(watchdogInterval);
    };
  }, [isAuthenticated, signOut]);

  // Derived RBAC permission flags
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isUser = role === 'USER';
  const canManageUsers = isSuperAdmin || role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        fullName,
        employeeId,
        isAuthenticated,
        isLoading,
        isInitializing,
        isSuperAdmin,
        isAdmin,
        isUser,
        canManageUsers,
        signIn,
        signOut,
        refreshProfile,
        setUserDetails,
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
