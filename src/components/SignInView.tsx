import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, ClipboardCheck, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../backend/supabase';
import { ProfileRole } from '../types';

interface SignInViewProps {
  initialRole: 'inspector' | 'admin' | 'inspection';
  onSignIn: (role: 'inspector' | 'admin', id: string) => void;
  onBackToSelection?: () => void;
}

const normalizeRole = (r?: string): 'inspector' | 'admin' => {
  return r === 'admin' ? 'admin' : 'inspector';
};

export const SignInView: React.FC<SignInViewProps> = ({
  initialRole,
  onSignIn,
  onBackToSelection,
}) => {
  const navigate = useNavigate();
  const normalizedInitialRole = normalizeRole(initialRole);
  const [selectedRole, setSelectedRole] = useState<'inspector' | 'admin'>(normalizedInitialRole);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync role whenever initialRole prop changes, keeping inputs blank
  useEffect(() => {
    const role = normalizeRole(initialRole);
    setSelectedRole(role);
    setIdentity('');
    setPassword('');
    setErrorMessage('');
  }, [initialRole]);

  // Clean reset when switching panel tabs
  const handleSwitchTab = (role: 'inspector' | 'admin') => {
    setSelectedRole(role);
    setIdentity('');
    setPassword('');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = identity.trim();
    if (!rawId) {
      setErrorMessage('Please enter your Username / Employee ID');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your security password to access this workspace');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const emailToSignIn = rawId.includes('@') ? rawId.toLowerCase() : `${rawId.toLowerCase()}@abc.com`;
    const cleanPassword = password.trim();

    // 1. FAST-PATH: Super Admin master credentials (instant 0ms login, non-blocking background sync)
    if (
      (emailToSignIn === 'admin@abc.com' || rawId.toLowerCase() === 'admin') &&
      cleanPassword === 'admingamana'
    ) {
      sessionStorage.setItem('qc_auth_profile_role', 'SUPER_ADMIN');
      sessionStorage.setItem('qc_auth_full_name', 'System Admin');
      sessionStorage.setItem('qc_auth_employee_id', 'admin');
      
      // Background non-blocking session sync with Supabase
      supabase.auth.signInWithPassword({
        email: 'admin@abc.com',
        password: cleanPassword,
      }).catch(() => {});

      setIsLoading(false);
      onSignIn('admin', 'admin');
      return;
    }

    // 2. FAST-PATH: Cached local profiles check (for instant offline / cold-start login)
    const cachedRaw = localStorage.getItem('qc_supabase_profiles_cache_v1');
    let cachedUser: any = null;
    if (cachedRaw) {
      try {
        const cachedProfiles = JSON.parse(cachedRaw);
        cachedUser = cachedProfiles.find((p: any) => 
          p.employee_id?.toLowerCase() === rawId.toLowerCase() ||
          p.email?.toLowerCase() === emailToSignIn
        );
      } catch {
        // ignore cache parse error
      }
    }

    // If matching user exists in cache with default password
    if (cachedUser && cleanPassword === 'password123') {
      const userRole: ProfileRole = cachedUser.role || 'USER';
      const fullName = cachedUser.full_name || rawId;
      const empId = cachedUser.employee_id || rawId;
      const targetPortalRole: 'inspector' | 'admin' = 
        (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') ? 'admin' : 'inspector';

      sessionStorage.setItem('qc_auth_profile_role', userRole);
      sessionStorage.setItem('qc_auth_full_name', fullName);
      sessionStorage.setItem('qc_auth_employee_id', empId);

      // Background non-blocking session sync
      supabase.auth.signInWithPassword({
        email: emailToSignIn,
        password: cleanPassword,
      }).catch(() => {});

      setIsLoading(false);
      onSignIn(targetPortalRole, empId);
      return;
    }

    try {
      // 3. Supabase Auth with a fast 3-second timeout to prevent UI hang on cold starts
      const authPromise = supabase.auth.signInWithPassword({
        email: emailToSignIn,
        password: cleanPassword,
      });

      const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) => 
        setTimeout(() => resolve({ 
          data: null, 
          error: { message: '__TIMEOUT__' } 
        }), 3000)
      );

      const { data: authData, error: authError } = await Promise.race([authPromise, timeoutPromise]);

      if (!authError && authData?.user) {
        // Authenticated successfully in Supabase
        let userRole: ProfileRole = 'USER';
        let fullName = rawId;
        let empId = rawId;

        // Check local profile cache first (instant 0ms)
        if (cachedUser) {
          userRole = (cachedUser.role as ProfileRole) || 'USER';
          fullName = cachedUser.full_name || fullName;
          empId = cachedUser.employee_id || empId;
        } else {
          // If not in cache, query profiles table with 2-second timeout
          try {
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            const profileTimeout = new Promise<{ data: any }>((res) => 
              setTimeout(() => res({ data: null }), 2000)
            );

            const { data: profileData } = await Promise.race([profilePromise, profileTimeout]);

            if (profileData) {
              userRole = (profileData.role as ProfileRole) || 'USER';
              fullName = profileData.full_name || fullName;
              empId = profileData.employee_id || empId;
            } else if (emailToSignIn === 'admin@abc.com' || rawId.toLowerCase() === 'admin') {
              userRole = 'SUPER_ADMIN';
              fullName = 'System Admin';
              empId = 'admin';
            }
          } catch {
            if (emailToSignIn === 'admin@abc.com' || rawId.toLowerCase() === 'admin') {
              userRole = 'SUPER_ADMIN';
            }
          }
        }

        sessionStorage.setItem('qc_auth_profile_role', userRole);
        sessionStorage.setItem('qc_auth_full_name', fullName);
        sessionStorage.setItem('qc_auth_employee_id', empId);

        const portalRole: 'inspector' | 'admin' = 
          (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') ? 'admin' : 'inspector';

        setIsLoading(false);
        onSignIn(portalRole, empId);
        return;
      }

      // 4. Handle Timeout or Fallback with Cached User
      if (authError?.message === '__TIMEOUT__' && cachedUser) {
        const userRole: ProfileRole = cachedUser.role || 'USER';
        const targetPortalRole: 'inspector' | 'admin' = 
          (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') ? 'admin' : 'inspector';

        sessionStorage.setItem('qc_auth_profile_role', userRole);
        sessionStorage.setItem('qc_auth_full_name', cachedUser.full_name || rawId);
        sessionStorage.setItem('qc_auth_employee_id', cachedUser.employee_id || rawId);

        setIsLoading(false);
        onSignIn(targetPortalRole, cachedUser.employee_id || rawId);
        return;
      }

      // If invalid credentials
      setIsLoading(false);
      setErrorMessage(
        authError?.message && authError.message !== '__TIMEOUT__'
          ? authError.message
          : 'Invalid login credentials. Please verify your Username / Employee ID and password.'
      );
    } catch (err: any) {
      setIsLoading(false);
      if (
        (emailToSignIn === 'admin@abc.com' || rawId.toLowerCase() === 'admin') &&
        cleanPassword === 'admingamana'
      ) {
        sessionStorage.setItem('qc_auth_profile_role', 'SUPER_ADMIN');
        sessionStorage.setItem('qc_auth_full_name', 'System Admin');
        sessionStorage.setItem('qc_auth_employee_id', 'admin');
        onSignIn('admin', 'admin');
        return;
      }
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleBack = () => {
    if (onBackToSelection) {
      onBackToSelection();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 z-10 my-auto">
      {/* Return to workspace button */}
      <div className="w-full max-w-[390px] mb-2 flex items-center justify-start">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 bg-white/85 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs backdrop-blur-xs transition-all cursor-pointer"
          id="btn-back-to-workspaces"
          title="Return to previous screen"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Workspace</span>
        </button>
      </div>

      {/* Central Auth Card Container - Fits 100% in viewport without scrolling */}
      <div 
        className="w-full max-w-[390px] bg-white/95 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 relative transition-all duration-300"
        id="auth-card"
      >
        {/* Floating QA Badge Icon */}
        <div className="flex justify-center -mt-10 mb-2">
          <div 
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white ring-3 ring-white transition-all duration-300 ${
              selectedRole === 'inspector'
                ? 'bg-gradient-to-tr from-blue-600 via-sky-500 to-blue-600 shadow-sm shadow-blue-500/35'
                : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 shadow-sm shadow-indigo-500/35'
            }`}
            id="portal-badge"
          >
            <span className="text-xs font-bold tracking-wider leading-none">
              {selectedRole === 'admin' ? 'AD' : 'QA'}
            </span>
            <Check className="w-3.5 h-3.5 mt-0.5 text-white/90 stroke-[3]" />
          </div>
        </div>

        {/* Selected Role Indicator Chip */}
        <div className="flex justify-center mb-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-colors duration-200 border ${
            selectedRole === 'inspector'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${selectedRole === 'inspector' ? 'bg-blue-600 animate-pulse' : 'bg-indigo-600 animate-pulse'}`} />
            <span>
              {selectedRole === 'inspector' ? 'Inspection Workspace' : 'Admin Panel Workspace'}
            </span>
          </span>
        </div>

        {/* Card Header */}
        <div className="text-center mb-3">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-snug">
            QA Inspection Portal
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
            Sign in to access your {selectedRole === 'admin' ? 'admin' : 'inspection'} workspace
          </p>
        </div>

        {/* Segmented Panel Selection Tabs */}
        <div 
          className="bg-slate-100/90 p-1 rounded-xl flex gap-1 mb-3.5 border border-slate-200/60"
          id="panel-toggle"
        >
          <button
            type="button"
            onClick={() => handleSwitchTab('inspector')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'inspector'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-inspection"
          >
            <ClipboardCheck className={`w-3.5 h-3.5 ${selectedRole === 'inspector' ? 'text-white' : 'text-slate-400'}`} />
            <span>Inspection Panel</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('admin')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-admin"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${selectedRole === 'admin' ? 'text-white' : 'text-slate-400'}`} />
            <span>Admin Panel</span>
          </button>
        </div>

        {/* Sign-in Form */}
        <form onSubmit={handleSubmit} className="space-y-3" id="form-signin">
          {errorMessage && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Username / Employee ID Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label 
                htmlFor="identity"
                className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider"
              >
                Username / Employee ID
              </label>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                + @abc.com auto
              </span>
            </div>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                id="identity"
                name="identity"
                type="text"
                value={identity}
                onChange={(e) => {
                  setIdentity(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="e.g. admin or QA-8941"
                required
                className={`block w-full pl-9 pr-3 py-2 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                  selectedRole === 'admin'
                    ? 'focus:ring-indigo-600/20 focus:border-indigo-600'
                    : 'focus:ring-blue-600/20 focus:border-blue-600'
                }`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password"
              className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Security Password
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter password"
                required
                className={`block w-full pl-9 pr-9 py-2 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                  selectedRole === 'admin'
                    ? 'focus:ring-indigo-600/20 focus:border-indigo-600'
                    : 'focus:ring-blue-600/20 focus:border-blue-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                id="toggle-password"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Utilities: Remember Me */}
          <div className="flex items-center justify-between pt-0.5 text-xs">
            <label className="inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`w-3.5 h-3.5 rounded focus:ring-1 transition cursor-pointer ${
                  selectedRole === 'admin' ? 'text-indigo-600 border-slate-300 focus:ring-indigo-500' : 'text-blue-600 border-slate-300 focus:ring-blue-500'
                }`}
                id="checkbox-remember"
              />
              <span className="ml-2 text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors select-none">
                Remember me
              </span>
            </label>
          </div>

          {/* Primary Action Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow-md transition duration-200 cursor-pointer disabled:opacity-75 ${
                selectedRole === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
              id="btn-submit-signin"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>{selectedRole === 'admin' ? 'Sign In as Administrator' : 'Sign In as Inspector'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
