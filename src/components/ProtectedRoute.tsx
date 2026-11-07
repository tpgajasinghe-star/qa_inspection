import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProfileRole } from '../types';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const FullScreenAuthLoading: React.FC = () => null;

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ProfileRole[];
}

/**
 * Standard Protected Route Wrapper:
 * - Session verification runs silently in the background while Splash Screen is displayed
 * - If unauthenticated, cleanly redirects to / with state preserved
 * - If authenticated but insufficient RBAC role (e.g. USER accessing admin), redirects to /inspection
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isInitializing, role } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    // Run silently in background (Splash Screen animation is already active in App)
    return null;
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
    // Run silently in background (Splash Screen animation is already active in App)
    return null;
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

