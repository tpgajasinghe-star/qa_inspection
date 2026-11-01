import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../backend/supabase';
import { ProfileRole, UserProfile } from '../types';
import { FullScreenAuthLoading } from '../components/ProtectedRoute';

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
  signOut: () => Promise<void>;
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
  const [role, setRole] = useState<ProfileRole | null>(() => {
    return (sessionStorage.getItem('qc_auth_profile_role') as ProfileRole | null) || null;
  });
  const [fullName, setFullName] = useState<string>(() => {
    return sessionStorage.getItem('qc_auth_full_name') || '';
  });
  const [employeeId, setEmployeeId] = useState<string>(() => {
    return sessionStorage.getItem('qc_auth_employee_id') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
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
        // Check active Supabase session
        const { data: sessionData } = await supabase.auth.getSession();
        const activeSession = sessionData?.session;

        if (activeSession?.user) {
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

        // Cleanly redirect to login screen on session expiry
        navigate('/login');
      } else if (newSession?.user) {
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
  }, [fetchProfileFromDatabase, persistSession]);

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

    // 1. FAST-PATH: Super Admin master credentials (admin / admingamana)
    if (
      (rawId.toLowerCase() === 'admin' || emailToSignIn === 'admin@abc.com') &&
      cleanPassword === 'admingamana'
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

  // Sign out method
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Sign out error:', err);
    }
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
    navigate('/login');
  }, [navigate]);

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
      {isInitializing ? <FullScreenAuthLoading /> : children}
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
