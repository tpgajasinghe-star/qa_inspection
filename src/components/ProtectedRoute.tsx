import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProfileRole } from '../types';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const FullScreenAuthLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md text-white select-none">
      <div className="relative flex flex-col items-center">
        {/* Pulsating Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-pulse mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/50">
            <ShieldCheck className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
        </div>
        
        {/* Spinner & Verification status */}
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs mb-1 uppercase tracking-wider font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Verifying Session</span>
        </div>
        
        <p className="text-slate-300 text-xs sm:text-sm font-normal">
          Authenticating security credentials...
        </p>
      </div>
    </div>
  );
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ProfileRole[];
}

/**
 * Standard Protected Route Wrapper:
 * - If initializing session on initial load, displays full-screen loading spinner
 * - If unauthenticated, cleanly redirects to /login with state.from location preserved
 * - If authenticated but insufficient RBAC role (e.g. USER accessing admin), redirects to /inspection
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isInitializing, role } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <FullScreenAuthLoading />;
  }

  if (!isAuthenticated) {
    // Unauthenticated access from any URL, copied link, or new session always lands on the Home Page ('/')
    return <Navigate to="/" replace />;
  }

  // RBAC checks if route specifies restricted roles
  if (allowedRoles && allowedRoles.length > 0 && role) {
    const hasRole = allowedRoles.includes(role);
    if (!hasRole) {
      // If a standard USER tries to access admin sections, route them to inspection dashboard
      if (role === 'USER') {
        return <Navigate to="/inspection" replace />;
      }
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

interface PublicAuthRouteProps {
  children: React.ReactNode;
}

/**
 * Public-Only Auth Route Wrapper for /login and /sign-in:
 * - If user is already authenticated, redirects them fresh to their respective dashboard
 *   based on their profile role (Admin -> /admin, User/Inspector -> /inspection)
 */
export const PublicAuthRoute: React.FC<PublicAuthRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitializing, role } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <FullScreenAuthLoading />;
  }

  if (isAuthenticated) {
    // If the user is navigating to an inspection sign-in path or requested inspection role,
    // route directly to /inspection regardless of whether they have admin rights
    const isInspectionTarget =
      location.pathname.includes('/inspection') ||
      (location.state as any)?.role === 'inspector';

    if (isInspectionTarget) {
      return <Navigate to="/inspection" replace />;
    }

    const isAdminTarget =
      location.pathname.includes('/admin') ||
      (location.state as any)?.role === 'admin';

    if (isAdminTarget) {
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        return <Navigate to="/admin" replace />;
      }
      // If a USER role is attempting to authenticate as an ADMIN, allow the sign-in form to render
      return <>{children}</>;
    }

    // Default fallback based on profile role
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/inspection" replace />;
  }

  return <>{children}</>;
};

