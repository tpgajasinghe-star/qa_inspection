/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { WorkspaceMode, InspectionModule, QAStatus, InspectionRecord } from './types';
import { 
  INITIAL_INSPECTIONS, 
  INITIAL_SPECS, 
  INITIAL_ADMIN_USERS, 
  INITIAL_DEFECT_METRICS 
} from './mockData';
import { BackgroundBackdrop } from './components/BackgroundBackdrop';
import { PortalHeader } from './components/PortalHeader';
import { WorkspaceSelection } from './components/WorkspaceSelection';
import { SignInView } from './components/SignInView';
import { InspectionDashboard } from './components/InspectionDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LiveInspectionWorkspace } from './components/LiveInspectionWorkspace';
import { AdminSubviews } from './components/AdminSubviews';
import { IncomingInspectionPortal } from './components/IncomingInspectionPortal';
import { InProcessInspectionPortal } from './components/InProcessInspectionPortal';
import { ModuleInspectionPortal } from './components/ModuleInspectionPortal';
import { AddRemoveInspectionPortal } from './components/AddRemoveInspectionPortal';
import { SplashScreen } from './components/SplashScreen';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute, PublicAuthRoute } from './components/ProtectedRoute';


// Wrapper to extract moduleId and childCardId from URL route parameters
function ModuleInspectionPortalWrapper(props: {
  onBack: () => void;
  userId: string;
  inspections: InspectionRecord[];
  onAddInspectionRecord: (item: InspectionRecord) => void;
}) {
  const { moduleId } = useParams<{ moduleId?: string }>();
  return (
    <ModuleInspectionPortal
      mainCardId={moduleId || 'main-subcontracting'}
      {...props}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isAuthenticated: isAuthLoggedIn, 
    role: authProfileRole, 
    canManageUsers, 
    employeeId, 
    signOut: authSignOut 
  } = useAuth();

  // Splash Screen State (shows on portal launch, auto-hides after 3 seconds)
  const [showSplash, setShowSplash] = useState<boolean>(true);


  // Authentication State persisted in sessionStorage for seamless browser back/forward navigation
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {

    return sessionStorage.getItem('qc_auth_logged_in') === 'true';
  });
  const [userRole, setUserRole] = useState<'inspector' | 'admin' | null>(() => {
    return (sessionStorage.getItem('qc_auth_role') as 'inspector' | 'admin' | null) || null;
  });
  const [userId, setUserId] = useState<string>(() => {
    return sessionStorage.getItem('qc_auth_user_id') || '';
  });
  const effectiveUserId = employeeId || userId;
  const [selectedModule, setSelectedModule] = useState<InspectionModule>('in-process');



  // Application Data States
  const [inspections, setInspections] = useState<InspectionRecord[]>(INITIAL_INSPECTIONS);
  const [specs] = useState(INITIAL_SPECS);
  const [adminUsers] = useState(INITIAL_ADMIN_USERS);
  const [defectMetrics] = useState(INITIAL_DEFECT_METRICS);

  // Derive current WorkspaceMode synchronously from current URL pathname
  const currentMode: WorkspaceMode = (() => {
    const path = location.pathname;
    if (path === '/' || path === '/workspace-selection') return 'workspace-selection';
    if (path.startsWith('/sign-in') || path.startsWith('/login')) return 'sign-in';
    if (path === '/inspection') return 'inspection-dashboard';
    if (path.startsWith('/inspection/incoming')) return 'incoming-inspection';
    if (path.startsWith('/inspection/in-process')) return 'in-process-inspection';
    if (path.startsWith('/inspection/module')) return 'module-inspection';
    if (path.startsWith('/inspection/live')) return 'live-inspection';
    if (path === '/admin') return 'admin-dashboard';
    if (path === '/admin/specs') return 'admin-specs';
    if (path === '/admin/records') return 'admin-records';
    if (path === '/admin/analytics') return 'admin-analytics';
    if (path === '/admin/users') return 'admin-users';
    return 'workspace-selection';
  })();

  // Handle Workspace Selection from Home Screen:
  const handleSelectWorkspace = (workspace: 'inspection' | 'admin') => {
    if (workspace === 'admin') {
      // Admin Panel requires authentication; show sign-in page
      navigate('/sign-in/admin', { state: { role: 'admin', from: '/admin' } });
      return;
    }

    const destination = '/inspection';
    if (!isAuthenticated || userRole !== 'inspector') {
      navigate('/sign-in/inspection', { state: { role: 'inspector', from: destination } });
      return;
    }

    navigate(destination);
  };

  // Open dedicated Sign-in Screen
  const handleOpenSignIn = (workspace: 'inspection' | 'admin') => {
    const role: 'inspector' | 'admin' = workspace === 'admin' ? 'admin' : 'inspector';
    navigate(`/sign-in/${role === 'admin' ? 'admin' : 'inspection'}`, { state: { role, from: role === 'admin' ? '/admin' : '/inspection' } });
  };


  // Handle Successful Sign-In
  const handleSignIn = (role: 'inspector' | 'admin', id: string, redirectTo?: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserId(id);
    sessionStorage.setItem('qc_auth_logged_in', 'true');
    sessionStorage.setItem('qc_auth_role', role);
    sessionStorage.setItem('qc_auth_user_id', id);

    if (redirectTo) {
      navigate(redirectTo);
    } else if (role === 'inspector') {
      navigate('/inspection');
    } else {
      navigate('/admin');
    }
  };

  // Handle Starting an Inspection Module
  const handleStartInspectionModule = (mod: InspectionModule, cardId?: string) => {
    setSelectedModule(mod);
    const resolvedCardId = cardId || (mod === 'incoming' ? 'main-incoming' : mod === 'in-process' ? 'main-inprocess' : 'main-subcontracting');

    if (resolvedCardId === 'main-incoming' || mod === 'incoming') {
      navigate('/inspection/incoming');
    } else if (resolvedCardId === 'main-inprocess' || mod === 'in-process') {
      navigate('/inspection/in-process');
    } else {
      navigate(`/inspection/module/${resolvedCardId}`);
    }
  };

  // Add a newly verified inspection
  const handleAddInspection = (newRec: InspectionRecord) => {
    setInspections(prev => [newRec, ...prev]);
  };

  // Update Status of an inspection item
  const handleUpdateStatus = (id: string, newStatus: QAStatus) => {
    setInspections(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: newStatus,
            defectSeverity: newStatus === 'pass' ? 'none' : item.defectSeverity === 'none' ? 'minor' : item.defectSeverity,
            verifiedBy: newStatus === 'pass' ? `Auditor ${userId}` : item.verifiedBy,
          };
        }
        return item;
      })
    );
  };

  // Role quick-switcher
  const handleSwitchRole = (newRole: 'inspector' | 'admin') => {
    if (newRole === 'admin' && userRole !== 'admin') {
      navigate('/sign-in', { state: { role: 'admin', from: '/admin' } });
      return;
    }
    setUserRole(newRole);
    const updatedId = userId || (newRole === 'admin' ? 'Admin' : 'Inspector');
    setUserId(updatedId);
    sessionStorage.setItem('qc_auth_role', newRole);
    sessionStorage.setItem('qc_auth_user_id', updatedId);

    if (newRole === 'inspector') {
      navigate('/inspection');
    } else {
      navigate('/admin');
    }
  };

  // Logout - destroys session, returns to home page ('/')
  const handleLogout = () => {
    authSignOut();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId('');
    sessionStorage.removeItem('qc_auth_logged_in');
    sessionStorage.removeItem('qc_auth_role');
    sessionStorage.removeItem('qc_auth_user_id');
    sessionStorage.removeItem('qc_auth_profile_role');
    sessionStorage.removeItem('qc_auth_full_name');
    sessionStorage.removeItem('qc_auth_employee_id');
    navigate('/');
  };


  return (
    <div className="min-h-screen text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Global Toast Notifications Provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '1rem',
            padding: '12px 16px',
            fontSize: '0.875rem',
            fontWeight: '600',
            border: '1px solid #e2e8f0',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      {/* QA Inspection Portal Splash Screen (Auto-hides after 3 seconds) */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Background Graphic & Luminous Mesh Overlay */}
      <BackgroundBackdrop />

      {/* Top Bar Navigation */}
      <PortalHeader
        currentMode={currentMode}
        userRole={userRole}
        userId={userId}
        onNavigate={(mode) => {
          const map: Record<WorkspaceMode, string> = {
            'workspace-selection': '/',
            'sign-in': '/sign-in',
            'inspection-dashboard': '/inspection',
            'incoming-inspection': '/inspection/incoming',
            'in-process-inspection': '/inspection/in-process',
            'module-inspection': '/inspection/module/main-subcontracting',
            'live-inspection': '/inspection/live',
            'admin-dashboard': '/admin',
            'admin-specs': '/admin/specs',
            'admin-records': '/admin/records',
            'admin-analytics': '/admin/analytics',
            'admin-users': '/admin/users',
          };
          navigate(map[mode] || '/');
        }}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onShowSplash={() => setShowSplash(true)}
      />

      {/* Main Dynamic View Content - Standard URL-based routing with <Routes> & <Route> */}
      <main className="flex-1 w-full flex flex-col items-center relative z-10">
        <Routes>
          {/* 1. Workspace Selection (Root) */}
          <Route
            path="/"
            element={
              <WorkspaceSelection
                onSelectWorkspace={handleSelectWorkspace}
                onOpenSignIn={handleOpenSignIn}
              />
            }
          />
          <Route path="/workspace-selection" element={<Navigate to="/" replace />} />

          {/* 2. Authentication Screens - Public-only route: if already authenticated, redirects to respective dashboard */}
          <Route
            path="/login"
            element={
              <PublicAuthRoute>
                <SignInView
                  onSignIn={(role, id) =>
                    handleSignIn(role, id, (location.state as any)?.from)
                  }
                  onBackToSelection={() => navigate(-1)}
                />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/login/:mode"
            element={
              <PublicAuthRoute>
                <SignInView
                  onSignIn={(role, id) =>
                    handleSignIn(role, id, (location.state as any)?.from)
                  }
                  onBackToSelection={() => navigate(-1)}
                />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/sign-in"
            element={
              <PublicAuthRoute>
                <SignInView
                  onSignIn={(role, id) =>
                    handleSignIn(role, id, (location.state as any)?.from)
                  }
                  onBackToSelection={() => navigate(-1)}
                />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/sign-in/:mode"
            element={
              <PublicAuthRoute>
                <SignInView
                  onSignIn={(role, id) =>
                    handleSignIn(role, id, (location.state as any)?.from)
                  }
                  onBackToSelection={() => navigate(-1)}
                />
              </PublicAuthRoute>
            }
          />

          {/* 3. Inspection Dashboard - Protected: Unauthenticated users are redirected to /login */}
          <Route
            path="/inspection"
            element={
              <ProtectedRoute>
                <InspectionDashboard
                  onSelectModule={handleStartInspectionModule}
                />
              </ProtectedRoute>
            }
          />

          {/* 4. Incoming Inspection Portal (Categories & Child Card View) - Protected */}
          <Route
            path="/inspection/incoming"
            element={
              <ProtectedRoute>
                <IncomingInspectionPortal
                  onBack={() => navigate(-1)}
                  onOpenLiveInspection={() => {
                    setSelectedModule('incoming');
                    navigate('/inspection/live');
                  }}
                  onAddInspectionRecord={handleAddInspection}
                  userId={effectiveUserId}
                  inspections={inspections}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspection/incoming/:childCardId"
            element={
              <ProtectedRoute>
                <IncomingInspectionPortal
                  onBack={() => navigate(-1)}
                  onOpenLiveInspection={() => {
                    setSelectedModule('incoming');
                    navigate('/inspection/live');
                  }}
                  onAddInspectionRecord={handleAddInspection}
                  userId={effectiveUserId}
                  inspections={inspections}
                />
              </ProtectedRoute>
            }
          />

          {/* 5. In-Process Inspection Portal (Categories & Child Card View) - Protected */}
          <Route
            path="/inspection/in-process"
            element={
              <ProtectedRoute>
                <InProcessInspectionPortal
                  onBack={() => navigate(-1)}
                  onOpenLiveInspection={() => {
                    setSelectedModule('in-process');
                    navigate('/inspection/live');
                  }}
                  onAddInspectionRecord={handleAddInspection}
                  userId={effectiveUserId}
                  inspections={inspections}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspection/in-process/:childCardId"
            element={
              <ProtectedRoute>
                <InProcessInspectionPortal
                  onBack={() => navigate(-1)}
                  onOpenLiveInspection={() => {
                    setSelectedModule('in-process');
                    navigate('/inspection/live');
                  }}
                  onAddInspectionRecord={handleAddInspection}
                  userId={effectiveUserId}
                  inspections={inspections}
                />
              </ProtectedRoute>
            }
          />

          {/* 6. Dynamic Module Inspection Portal (Subcontracting, etc.) - Protected */}
          <Route
            path="/inspection/module/:moduleId"
            element={
              <ProtectedRoute>
                <ModuleInspectionPortalWrapper
                  onBack={() => navigate(-1)}
                  userId={effectiveUserId}
                  inspections={inspections}
                  onAddInspectionRecord={handleAddInspection}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspection/module/:moduleId/:childCardId"
            element={
              <ProtectedRoute>
                <ModuleInspectionPortalWrapper
                  onBack={() => navigate(-1)}
                  userId={effectiveUserId}
                  inspections={inspections}
                  onAddInspectionRecord={handleAddInspection}
                />
              </ProtectedRoute>
            }
          />

          {/* 7. Live Inspection Workspace - Protected */}
          <Route
            path="/inspection/live"
            element={
              <ProtectedRoute>
                <LiveInspectionWorkspace
                  currentModule={selectedModule}
                  onSelectModule={(mod) => {
                    setSelectedModule(mod);
                    if (mod === 'incoming') {
                      navigate('/inspection/incoming');
                    } else if (mod === 'in-process') {
                      navigate('/inspection/in-process');
                    }
                  }}
                  onOpenIncomingPortal={() => navigate('/inspection/incoming')}
                  onOpenInProcessPortal={() => navigate('/inspection/in-process')}
                  inspections={inspections}
                  onAddInspection={handleAddInspection}
                  onUpdateStatus={handleUpdateStatus}
                />
              </ProtectedRoute>
            }
          />

          {/* 8. Admin Dashboard - Protected (SUPER_ADMIN or ADMIN only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminDashboard
                  onNavigateAdminSub={(sub) => {
                    const map: Record<string, string> = {
                      'admin-specs': '/admin/specs',
                      'admin-records': '/admin/records',
                      'admin-analytics': '/admin/analytics',
                      'admin-users': '/admin/users',
                    };
                    navigate(map[sub] || '/admin');
                  }}
                />
              </ProtectedRoute>
            }
          />

          {/* 9. Admin Specification & Tolerance Controls - Protected */}
          <Route
            path="/admin/specs"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AddRemoveInspectionPortal
                  onBack={() => navigate(-1)}
                  userId={effectiveUserId}
                />
              </ProtectedRoute>
            }
          />

          {/* 10. Admin Records, Analytics, and Users Subviews - Protected */}
          <Route
            path="/admin/records"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminSubviews
                  activeView="admin-records"
                  specs={specs}
                  users={adminUsers}
                  inspections={inspections}
                  defectMetrics={defectMetrics}
                  onBackToDashboard={() => navigate(-1)}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminSubviews
                  activeView="admin-analytics"
                  specs={specs}
                  users={adminUsers}
                  inspections={inspections}
                  defectMetrics={defectMetrics}
                  onBackToDashboard={() => navigate(-1)}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                {!canManageUsers ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <AdminSubviews
                    activeView="admin-users"
                    specs={specs}
                    users={adminUsers}
                    inspections={inspections}
                    defectMetrics={defectMetrics}
                    onBackToDashboard={() => navigate(-1)}
                  />
                )}
              </ProtectedRoute>
            }
          />



          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Corporate Footer - ABC Company Pvt Ltd */}
      <footer className="w-full shrink-0 py-2 sm:py-2.5 px-6 z-20 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs text-slate-500 border-t border-slate-200/50 bg-white/70 backdrop-blur-md transition-all select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-700">ABC Company Pvt Ltd</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <div className="flex items-center gap-1.5 text-slate-500">
          <span>All Rights Reserved</span>
          <span className="text-slate-300">•</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
