/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

export default function App() {
  // Navigation & Auth State
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>('workspace-selection');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'inspector' | 'admin' | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [pendingRole, setPendingRole] = useState<'inspector' | 'admin'>('inspector');
  const [selectedModule, setSelectedModule] = useState<InspectionModule>('in-process');

  // Application Data States
  const [inspections, setInspections] = useState<InspectionRecord[]>(INITIAL_INSPECTIONS);
  const [specs] = useState(INITIAL_SPECS);
  const [adminUsers] = useState(INITIAL_ADMIN_USERS);
  const [defectMetrics] = useState(INITIAL_DEFECT_METRICS);

  // Protected Route Check:
  // If unauthenticated and on a protected section, redirect to sign-in so password must be entered
  useEffect(() => {
    const isPublicMode = currentMode === 'workspace-selection' || currentMode === 'sign-in';
    if (!isPublicMode && !isAuthenticated) {
      setCurrentMode('sign-in');
    }
  }, [currentMode, isAuthenticated]);

  // Handle Workspace Selection from Home Screen:
  // After logout or when unauthenticated, always opens Sign-In so password must be entered!
  const handleSelectWorkspace = (workspace: 'inspection' | 'admin') => {
    const targetRole: 'inspector' | 'admin' = workspace === 'admin' ? 'admin' : 'inspector';
    setPendingRole(targetRole);
    setUserRole(targetRole);

    // If not authenticated in current session, or switching roles:
    if (!isAuthenticated || userRole !== targetRole) {
      setCurrentMode('sign-in');
      return;
    }

    // If already authenticated for this workspace in current active session:
    if (workspace === 'inspection') {
      setCurrentMode('inspection-dashboard');
    } else {
      setCurrentMode('admin-dashboard');
    }
  };

  // Open dedicated Sign-in Screen
  const handleOpenSignIn = (workspace: 'inspection' | 'admin') => {
    const role: 'inspector' | 'admin' = workspace === 'admin' ? 'admin' : 'inspector';
    setPendingRole(role);
    setUserRole(role);
    setCurrentMode('sign-in');
  };

  // Handle Successful Sign-In with password
  const handleSignIn = (role: 'inspector' | 'admin', id: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserId(id);
    if (role === 'inspector') {
      setCurrentMode('inspection-dashboard');
    } else {
      setCurrentMode('admin-dashboard');
    }
  };

  // Handle Starting an Inspection Module
  const handleStartInspectionModule = (mod: InspectionModule) => {
    setSelectedModule(mod);
    if (mod === 'incoming') {
      setCurrentMode('incoming-inspection');
    } else if (mod === 'in-process') {
      setCurrentMode('in-process-inspection');
    } else {
      setCurrentMode('live-inspection');
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
      setPendingRole('admin');
      setUserRole('admin');
      setCurrentMode('sign-in');
      return;
    }
    setUserRole(newRole);
    setUserId(newRole === 'admin' ? 'AD-1004' : 'QA-8941');
    if (newRole === 'inspector') {
      setCurrentMode('inspection-dashboard');
    } else {
      setCurrentMode('admin-dashboard');
    }
  };

  // Logout - destroys session, returns to home page (workspace-selection),
  // ensuring password must be entered again upon accessing either inspection or admin sections.
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId('');
    setCurrentMode('workspace-selection');
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Background Graphic & Luminous Mesh Overlay */}
      <BackgroundBackdrop />

      {/* Top Bar Navigation */}
      <PortalHeader
        currentMode={currentMode}
        userRole={userRole}
        userId={userId}
        onNavigate={(mode) => setCurrentMode(mode)}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        {currentMode === 'workspace-selection' && (
          <WorkspaceSelection
            onSelectWorkspace={handleSelectWorkspace}
            onOpenSignIn={handleOpenSignIn}
          />
        )}

        {currentMode === 'sign-in' && (
          <SignInView
            initialRole={pendingRole || userRole || 'inspector'}
            onSignIn={handleSignIn}
            onBackToSelection={() => setCurrentMode('workspace-selection')}
          />
        )}

        {currentMode === 'inspection-dashboard' && (
          <InspectionDashboard
            onSelectModule={handleStartInspectionModule}
          />
        )}

        {currentMode === 'incoming-inspection' && (
          <IncomingInspectionPortal
            onBack={() => setCurrentMode('inspection-dashboard')}
            onOpenLiveInspection={(categoryName) => {
              setSelectedModule('incoming');
              setCurrentMode('live-inspection');
            }}
            onAddInspectionRecord={handleAddInspection}
            userId={userId}
          />
        )}

        {currentMode === 'in-process-inspection' && (
          <InProcessInspectionPortal
            onBack={() => setCurrentMode('inspection-dashboard')}
            onOpenLiveInspection={(categoryName) => {
              setSelectedModule('in-process');
              setCurrentMode('live-inspection');
            }}
            onAddInspectionRecord={handleAddInspection}
            userId={userId}
          />
        )}

        {currentMode === 'admin-dashboard' && (
          <AdminDashboard
            onNavigateAdminSub={(sub) => setCurrentMode(sub)}
          />
        )}

        {currentMode === 'live-inspection' && (
          <LiveInspectionWorkspace
            currentModule={selectedModule}
            onSelectModule={(mod) => {
              setSelectedModule(mod);
              if (mod === 'incoming') {
                setCurrentMode('incoming-inspection');
              } else if (mod === 'in-process') {
                setCurrentMode('in-process-inspection');
              }
            }}
            onOpenIncomingPortal={() => setCurrentMode('incoming-inspection')}
            onOpenInProcessPortal={() => setCurrentMode('in-process-inspection')}
            inspections={inspections}
            onAddInspection={handleAddInspection}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {(currentMode === 'admin-specs' || 
          currentMode === 'admin-records' || 
          currentMode === 'admin-analytics' || 
          currentMode === 'admin-users') && (
          <AdminSubviews
            activeView={currentMode}
            specs={specs}
            users={adminUsers}
            inspections={inspections}
            defectMetrics={defectMetrics}
            onBackToDashboard={() => setCurrentMode('admin-dashboard')}
          />
        )}
      </main>

      {/* Persistent Corporate Footer - ABC Company Pvt Ltd */}
      <footer className="w-full py-3.5 px-6 z-20 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs text-slate-500 border-t border-slate-200/50 bg-white/70 backdrop-blur-md transition-all select-none">
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
