import React, { useState } from 'react';
import { ArrowLeft, Wifi, LogOut, RefreshCw, UserCheck, Shield } from 'lucide-react';
import { WorkspaceMode } from '../types';

interface PortalHeaderProps {
  currentMode: WorkspaceMode;
  userRole: 'inspector' | 'admin' | null;
  userId: string;
  onNavigate: (mode: WorkspaceMode) => void;
  onLogout: () => void;
  onSwitchRole: (role: 'inspector' | 'admin') => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  currentMode,
  userRole,
  userId,
  onNavigate,
  onLogout,
  onSwitchRole,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Return label based on current mode
  const getBackLabel = () => {
    if (currentMode === 'incoming-inspection' || currentMode === 'in-process-inspection') return 'Back to QA Inspection';
    if (currentMode === 'live-inspection') return 'Back to Inspection Modules';
    if (currentMode.startsWith('admin-') && currentMode !== 'admin-dashboard') return 'Back to Admin Modules';
    if (currentMode === 'inspection-dashboard' || currentMode === 'admin-dashboard') return 'Back to Workspace Selection';
    return 'Back to Workspace Selection';
  };

  const handleBackClick = () => {
    if (currentMode === 'incoming-inspection' || currentMode === 'in-process-inspection') {
      onNavigate('inspection-dashboard');
    } else if (currentMode === 'live-inspection') {
      onNavigate('inspection-dashboard');
    } else if (currentMode.startsWith('admin-') && currentMode !== 'admin-dashboard') {
      onNavigate('admin-dashboard');
    } else {
      onNavigate('workspace-selection');
    }
  };

  return (
    <header className="w-full flex items-center justify-between py-4 px-2 sm:px-4 select-none relative z-30">
      {/* Back Navigation Button */}
      {currentMode !== 'workspace-selection' ? (
        <button
          onClick={handleBackClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-slate-950 font-medium text-xs sm:text-sm shadow-sm backdrop-blur-md border border-white/80 transition-all duration-200 hover:shadow-md cursor-pointer group"
          id="btn-nav-back"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
          <span>{getBackLabel()}</span>
        </button>
      ) : (
        <div className="hidden sm:block">
          {/* Subtle spacer when on root */}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Plant 04 • Metrology Division
          </span>
        </div>
      )}

      {/* Right Indicators & User Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Systems Online Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-white/80 text-emerald-700 text-xs font-semibold shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden xs:inline">Systems Online</span>
          <Wifi className="w-3 h-3 text-emerald-500 xs:hidden" />
        </div>

        {/* User Identity Pill with Dropdown & Direct Sign Out */}
        {userRole && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/85 hover:bg-white text-slate-800 text-xs font-medium shadow-sm backdrop-blur-md border border-white/80 transition-all cursor-pointer"
                id="btn-user-profile"
              >
                <div
                  className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px] tracking-tight shadow-xs ${
                    userRole === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
                  }`}
                >
                  {userRole === 'admin' ? 'AD' : 'QA'}
                </div>
                <span className="hidden sm:inline">
                  {userRole === 'admin' ? 'Admin ID: ' : 'Inspector ID: '}
                  <strong className="font-semibold text-slate-900">{userId}</strong>
                </span>
                <span className="sm:hidden font-semibold text-slate-900">{userId}</span>
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
                        {userRole === 'admin' ? 'David Sterling' : 'Marcus Vance'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {userRole === 'admin' ? 'System Administrator' : 'Senior QA Inspector'}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSwitchRole(userRole === 'admin' ? 'inspector' : 'admin');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer text-left"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Switch to {userRole === 'admin' ? 'Inspection Panel' : 'Admin Panel'}</span>
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
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer text-left"
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
              onClick={onLogout}
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
