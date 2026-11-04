import React from 'react';
import { ShieldCheck, Users, Sliders, FileSpreadsheet, BarChart3, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceMode } from '../types';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onNavigateAdminSub?: (mode: WorkspaceMode) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateAdminSub,
}) => {
  const navigate = useNavigate();
  const { role, canManageUsers, fullName, employeeId } = useAuth();

  const handleNavigate = (path: string, mode: WorkspaceMode) => {
    navigate(path);
    if (onNavigateAdminSub) {
      onNavigateAdminSub(mode);
    }
  };

  const displayFullName = fullName || sessionStorage.getItem('qc_auth_full_name') || employeeId || 'Admin';
  const displayEmpId = employeeId || sessionStorage.getItem('qc_auth_employee_id') || 'admin';

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-2 z-10 max-w-7xl mx-auto my-auto">
      {/* Central Header Section - Compact to fit 100% in viewport */}
      <section className="flex flex-col items-center text-center mb-3 sm:mb-4">
        {/* Shield Brand Badge */}
        <div className="relative mb-1.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 shadow-md shadow-blue-500/35 flex items-center justify-center text-white ring-3 ring-blue-200/50">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Main Portal Header Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
          QA Admin Dashboard
        </h1>

        {/* Logged in Admin Identity Banner */}
        <div className="flex items-center gap-2 mt-1 mb-1.5">
          <span className="text-xs text-slate-500 font-medium">Logged in as:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 stroke-[2.2]" />
            <span>{displayFullName}</span>
            <span className="text-indigo-400 font-mono text-[11px] font-normal">({displayEmpId})</span>
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-slate-600 text-xs sm:text-sm font-normal max-w-xl leading-relaxed">
          Manage system access, quality specifications, and audit analytics
        </p>
      </section>

      {/* Admin Action Cards Grid - RBAC adjusted: 4 cards for SUPER_ADMIN/ADMIN, 3 cards if User Management hidden */}
      <div className="w-full my-auto flex items-center justify-center">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${canManageUsers ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4.5 w-full`}>
          {/* CARD 1: User Management - Shown strictly to SUPER_ADMIN and ADMIN accounts */}
          {canManageUsers && (
            <div 
              onClick={() => handleNavigate('/admin/users', 'admin-users')}
              className="group relative bg-white/95 hover:bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center portal-glass-card transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md border border-white/95 cursor-pointer"
              id="admin-user-mgmt-card"
            >
              <div className="relative mb-2.5 sm:mb-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50/90 flex items-center justify-center border border-blue-100/70 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-xs">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs"></span>
              </div>

              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1 tracking-tight">
                User Management
              </h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-3.5 flex-grow line-clamp-2">
                Provision QA inspector credentials, assign operational roles, and manage permissions.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate('/admin/users', 'admin-users');
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs shadow-blue-500/25 transition-all duration-200 cursor-pointer"
                id="btn-admin-manage-users"
              >
                <span>Manage Users</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          )}


          {/* CARD 2: Specification Controls */}
          <div 
            onClick={() => handleNavigate('/admin/specs', 'admin-specs')}
            className="group relative bg-white/95 hover:bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center portal-glass-card transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-xs hover:shadow-md border border-white/95"
            id="admin-specs-card"
          >
            <div className="relative mb-2.5 sm:mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50/90 flex items-center justify-center border border-blue-100/70 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-xs">
                <Sliders className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs"></span>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1 tracking-tight">
              Specification Controls
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed mb-3.5 flex-grow line-clamp-2">
              Configure QA inspection forms, register test specifications, and customize operational inspection cards.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate('/admin/specs', 'admin-specs');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs shadow-blue-500/25 transition-all duration-200 cursor-pointer"
              id="btn-admin-manage-specs"
            >
              <span>Specification Controls</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* CARD 3: Inspection Records */}
          <div 
            onClick={() => handleNavigate('/admin/records', 'admin-records')}
            className="group relative bg-white/95 hover:bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center portal-glass-card transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-xs hover:shadow-md border border-white/95"
            id="admin-records-card"
          >
            <div className="relative mb-2.5 sm:mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50/90 flex items-center justify-center border border-blue-100/70 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-xs">
                <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs"></span>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1 tracking-tight">
              Inspection Records
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed mb-3.5 flex-grow line-clamp-2">
              Query historical audit logs, verify digital auditor sign-offs, and export PDF compliance registers.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate('/admin/records', 'admin-records');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs shadow-blue-500/25 transition-all duration-200 cursor-pointer"
              id="btn-admin-view-records"
            >
              <span>View Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* CARD 4: Defect Analytics */}
          <div 
            onClick={() => handleNavigate('/admin/analytics', 'admin-analytics')}
            className="group relative bg-white/95 hover:bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center portal-glass-card transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-xs hover:shadow-md border border-white/95"
            id="admin-analytics-card"
          >
            <div className="relative mb-2.5 sm:mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50/90 flex items-center justify-center border border-blue-100/70 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-xs">
                <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs"></span>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1 tracking-tight">
              Defect Analytics
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed mb-3.5 flex-grow line-clamp-2">
              Analyze yield trends, defect Pareto distributions, and supplier quality metrics.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate('/admin/analytics', 'admin-analytics');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs shadow-blue-500/25 transition-all duration-200 cursor-pointer"
              id="btn-admin-view-analytics"
            >
              <span>Analytics & KPI</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Return to Workspace Selection Button */}
      <div className="w-full flex justify-center pt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-xs shadow-2xs border border-slate-200/80 backdrop-blur-md transition-all cursor-pointer group hover:shadow-xs"
          id="btn-return-from-admin"
          title="Back to Previous Screen"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Workspaces</span>
        </button>
      </div>
    </div>
  );
};
