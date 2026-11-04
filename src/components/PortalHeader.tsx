import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Wifi, LogOut, RefreshCw, UserCheck, Shield, Sparkles } from 'lucide-react';
import { WorkspaceMode } from '../types';
import { useAuth } from '../context/AuthContext';

interface PortalHeaderProps {
  currentMode: WorkspaceMode;
  userRole: 'inspector' | 'admin' | null;
  userId: string;
  onNavigate: (mode: WorkspaceMode) => void;
  onLogout: () => void;
  onSwitchRole: (role: 'inspector' | 'admin') => void;
  onShowSplash?: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  currentMode,
  userRole,
  userId,
  onNavigate,
  onLogout,
  onSwitchRole,
  onShowSplash,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName, employeeId, role: authRole, isSuperAdmin, signOut: authSignOut, isAuthenticated: isAuthLoggedIn } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Derive effective role from props or AuthContext
  const effectiveRole: 'inspector' | 'admin' | null = 
    userRole || 
    (authRole === 'ADMIN' || authRole === 'SUPER_ADMIN' ? 'admin' : authRole === 'USER' ? 'inspector' : null);

  const isLoggedIn = Boolean(
    (isAuthLoggedIn || !!userRole) && 
    effectiveRole && 
    (fullName || employeeId || userId || sessionStorage.getItem('qc_auth_employee_id'))
  );

  const effectiveName = fullName || sessionStorage.getItem('qc_auth_full_name') || userId || (effectiveRole === 'admin' ? 'Admin' : 'Inspector');
  const effectiveEmpId = employeeId || sessionStorage.getItem('qc_auth_employee_id') || userId || (effectiveRole === 'admin' ? 'admin' : 'inspector');

  // Robust sign out handler: invokes parent onLogout prop AND AuthContext signOut
  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowUserMenu(false);

    try {
      if (onLogout) {
        await onLogout();
      }
    } catch (err) {
      console.warn('[PortalHeader:handleSignOut] onLogout prop error:', err);
    }

    try {
      await authSignOut('/');
    } catch (err) {
      console.warn('[PortalHeader:handleSignOut] authSignOut error:', err);
    }

    navigate('/', { replace: true });
  };

  const isRoot = location.pathname === '/' || location.pathname === '/workspace-selection';

  // Return contextual label based on current route - strictly goes to immediately preceding step
  const getBackLabel = () => {
    const p = location.pathname;

    // 1. Sub-level views inside Specification Controls (Form Generator or Inspection Editor)
    if (p.startsWith('/admin/specs/')) {
      return 'Back to Specification Controls';
    }

    // 2. Child card level under Inspection modules (e.g. /inspection/module/:moduleId/:childCardId)
    const moduleChildMatch = p.match(/^\/inspection\/module\/([^/]+)\/([^/]+)/);
    if (moduleChildMatch) {
      return 'Back to Categories';
    }
    const incomingChildMatch = p.match(/^\/inspection\/incoming\/([^/]+)/);
    if (incomingChildMatch) {
      return 'Back to Categories';
    }
    const inProcessChildMatch = p.match(/^\/inspection\/in-process\/([^/]+)/);
    if (inProcessChildMatch) {
      return 'Back to Categories';
    }

    // 3. Category level views (e.g. /inspection/incoming, /inspection/in-process, /inspection/module/:moduleId, /inspection/live)
    if (p.startsWith('/inspection/module/') || p === '/inspection/incoming' || p === '/inspection/in-process' || p.startsWith('/inspection/live')) {
      return 'Back to QA Inspection';
    }

    // 4. Admin top subviews (e.g. /admin/specs, /admin/users, /admin/records, /admin/analytics)
    if (p.startsWith('/admin/') && p !== '/admin') {
      return 'Back to QA Admin Dashboard';
    }

    // 5. Top-level dashboards go to workspace selection
    if (p === '/inspection' || p === '/admin') {
      return 'Back to Workspace Selection';
    }

    // 6. Sign in / login screens go to workspace selection
    if (p.startsWith('/sign-in') || p.startsWith('/login')) {
      return 'Back to Workspace Selection';
    }

    return 'Back';
  };

  // Return contextual destination for 100% reliable single-click back navigation
  const getBackDestination = (): string => {
    const p = location.pathname;

    // 1. Sub-level views inside Specification Controls return to /admin/specs
    if (p.startsWith('/admin/specs/')) {
      return '/admin/specs';
    }

    // 2. Child card level in inspection returns to category level
    const moduleChildMatch = p.match(/^\/inspection\/module\/([^/]+)\/([^/]+)/);
    if (moduleChildMatch) {
      return `/inspection/module/${moduleChildMatch[1]}`;
    }
    const incomingChildMatch = p.match(/^\/inspection\/incoming\/([^/]+)/);
    if (incomingChildMatch) {
      return '/inspection/incoming';
    }
    const inProcessChildMatch = p.match(/^\/inspection\/in-process\/([^/]+)/);
    if (inProcessChildMatch) {
      return '/inspection/in-process';
    }

    // 3. Category level views return to QA Inspection dashboard
    if (p.startsWith('/inspection/module/')) {
      return '/inspection';
    }
    if (p.startsWith('/inspection/') && p !== '/inspection') {
      return '/inspection';
    }

    // 4. Admin top subviews return to QA Admin dashboard
    if (p.startsWith('/admin/') && p !== '/admin') {
      return '/admin';
    }

    // 5. Top-level dashboards go to workspace selection
    if (p === '/admin' || p === '/inspection') {
      return '/';
    }

    // 6. Authentication screens go to workspace selection
    if (p.startsWith('/sign-in') || p.startsWith('/login')) {
      return '/';
    }

    return '/';
  };

  // Direct single-click back navigation - no broken history stack dependency
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const destination = getBackDestination();
    navigate(destination);
  };


  return (
    <header className="w-full flex items-center justify-between py-2 sm:py-2.5 px-3 sm:px-5 select-none relative z-30 shrink-0 no-print print:hidden">
      {/* Back Navigation Button - Synced with browser history stack via navigate(-1) */}
      {!isRoot ? (
        <button
          onClick={handleBackClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-slate-950 font-medium text-xs sm:text-sm shadow-xs backdrop-blur-md border border-white/80 transition-all duration-200 hover:shadow-sm cursor-pointer group"
          id="btn-nav-back"
          title="Go back to previous screen (Browser History)"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
          <span>{getBackLabel()}</span>
        </button>
      ) : (
        <div className="hidden sm:block">
          {/* Subtle brand motto on root */}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Quality Meets Precision</span>
          </span>
        </div>
      )}

      {/* Right Indicators & User Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Systems Online Status Pill / Splash Trigger */}
        <button
          type="button"
          onClick={onShowSplash}
          title="Click to replay QA Portal Splash Screen"
          className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/80 hover:border-emerald-300 text-emerald-700 text-xs font-semibold shadow-xs cursor-pointer transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden xs:inline">Systems Online</span>
          <Wifi className="w-3 h-3 text-emerald-500 xs:hidden" />
        </button>

        {/* User Identity Pill with Dropdown & Direct Sign Out */}
        {isLoggedIn && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/85 hover:bg-white text-slate-800 text-xs font-medium shadow-sm backdrop-blur-md border border-white/80 transition-all cursor-pointer"
                id="btn-user-profile"
              >
                <div
                  className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px] tracking-tight shadow-xs ${
                    effectiveRole === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
                  }`}
                >
                  {effectiveRole === 'admin' ? 'AD' : 'QA'}
                </div>
                <span className="hidden sm:inline">
                  {effectiveRole === 'admin' ? 'Admin: ' : 'Inspector: '}
                  <strong className="font-semibold text-slate-900">
                    {effectiveName}
                  </strong>
                  {effectiveEmpId && (
                    <span className="text-slate-400 font-mono text-[11px] font-normal ml-1">({effectiveEmpId})</span>
                  )}
                </span>
                <span className="sm:hidden font-semibold text-slate-900">
                  {effectiveName}
                </span>
              </button>

              {/* Quick switcher dropdown */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900">
                        {effectiveName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        ID: <strong className="font-mono text-slate-800">{effectiveEmpId}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>
                          {isSuperAdmin || authRole === 'SUPER_ADMIN' || authRole === 'ADMIN' || effectiveRole === 'admin' ? 'ADMIN' : 'USER'}
                        </span>
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSwitchRole(effectiveRole === 'admin' ? 'inspector' : 'admin');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer text-left"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Switch to {effectiveRole === 'admin' ? 'Inspection Panel' : 'Admin Panel'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('workspace-selection');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer text-left"
                      >
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Workspace Selection</span>
                      </button>

                      {onShowSplash && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onShowSplash();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-800 transition cursor-pointer text-left font-medium"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Replay Splash Screen</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer text-left"
                        id="btn-dropdown-sign-out"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Direct One-Click Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-50/90 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-semibold border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              id="btn-direct-sign-out"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
