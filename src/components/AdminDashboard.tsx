import React from 'react';
import { ShieldCheck, Users, Sliders, FileSpreadsheet, BarChart3, ArrowRight } from 'lucide-react';
import { WorkspaceMode } from '../types';

interface AdminDashboardProps {
  onNavigateAdminSub: (mode: WorkspaceMode) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateAdminSub,
}) => {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 py-6 z-10 max-w-[1560px] mx-auto">
      {/* Central Header Section */}
      <section className="flex flex-col items-center text-center mt-2 mb-8 sm:mb-10">
        {/* Shield Brand Badge */}
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/35 flex items-center justify-center text-white ring-4 ring-blue-200/50">
            <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>

        {/* Main Portal Header Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          QA Admin Dashboard
        </h1>

        {/* Subtitle */}
        <p className="text-slate-600 text-base font-normal max-w-2xl leading-relaxed">
          Manage system access, quality specifications, and audit analytics
        </p>
      </section>

      {/* Admin Action Cards Grid */}
      <main className="w-full pb-6 flex-1 flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {/* CARD 1: User Management */}
          <div 
            className="group relative bg-white/90 hover:bg-white rounded-3xl p-7 flex flex-col items-center text-center portal-glass-card transition-all duration-300 hover:-translate-y-1"
            id="admin-user-mgmt-card"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-50/90 flex items-center justify-center border border-blue-100/70 text-blue-600 transition-colors group-hover:bg-blue-100/70 shadow-xs">
                <Users className="w-9 h-9 stroke-[1.8]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs"></span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
              User Management
            </h2>
            <p className="text-slate-500 text-[13.5px] leading-relaxed mb-7 flex-grow">
              Provision QA inspector credentials, assign operational roles, and manage system access permissions.
            </p>

            <button
              onClick={() => onNavigateAdminSub('admin-users')}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/25 transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
              id="btn-admin-manage-users"
            >
              <span>Manage Users</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* CARD 2: Specification Controls */}
          <div 
            className="group relative bg-white/90 hover:bg-white rounded-3xl p-7 flex flex-col items-center text-center portal-glass-card transition-all duration-300 hover:-translate-y-1"
            id="admin-specs-card"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-50/90 flex items-center justify-center border border-blue-100/70 text-blue-600 transition-colors group-hover:bg-blue-100/70 shadow-xs">
                <Sliders className="w-9 h-9 stroke-[1.8]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs"></span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
              Specification Controls
            </h2>
            <p className="text-slate-500 text-[13.5px] leading-relaxed mb-7 flex-grow">
              Configure component tolerances, update inspection standards, and deploy QA criteria benchmarks.
            </p>

            <button
              onClick={() => onNavigateAdminSub('admin-specs')}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/25 transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
              id="btn-admin-manage-specs"
            >
              <span>Manage Specs</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* CARD 3: Inspection Records */}
          <div 
            className="group relative bg-white/90 hover:bg-white rounded-3xl p-7 flex flex-col items-center text-center portal-glass-card transition-all duration-300 hover:-translate-y-1"
            id="admin-records-card"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-50/90 flex items-center justify-center border border-blue-100/70 text-blue-600 transition-colors group-hover:bg-blue-100/70 shadow-xs">
                <FileSpreadsheet className="w-9 h-9 stroke-[1.8]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs"></span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
              Inspection Records
            </h2>
            <p className="text-slate-500 text-[13.5px] leading-relaxed mb-7 flex-grow">
              Audit complete inspection logs, investigate defect flags, and verify compliance sign-offs.
            </p>

            <button
              onClick={() => onNavigateAdminSub('admin-records')}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/25 transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
              id="btn-admin-review-records"
            >
              <span>Review Records</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* CARD 4: QA Analytics & Metrics */}
          <div 
            className="group relative bg-white/90 hover:bg-white rounded-3xl p-7 flex flex-col items-center text-center portal-glass-card transition-all duration-300 hover:-translate-y-1"
            id="admin-analytics-card"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-50/90 flex items-center justify-center border border-blue-100/70 text-blue-600 transition-colors group-hover:bg-blue-100/70 shadow-xs">
                <BarChart3 className="w-9 h-9 stroke-[1.8]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-white shadow-xs"></span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
              QA Analytics & Metrics
            </h2>
            <p className="text-slate-500 text-[13.5px] leading-relaxed mb-7 flex-grow">
              Monitor live quality yield rates, defect severity trends, and critical compliance KPIs.
            </p>

            <button
              onClick={() => onNavigateAdminSub('admin-analytics')}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/25 transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
              id="btn-admin-view-analytics"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
