import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, ClipboardCheck } from 'lucide-react';

interface WorkspaceSelectionProps {
  onSelectWorkspace: (workspace: 'inspection' | 'admin') => void;
  onOpenSignIn: (workspace: 'inspection' | 'admin') => void;
}

export const WorkspaceSelection: React.FC<WorkspaceSelectionProps> = ({
  onSelectWorkspace,
}) => {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-2 px-4 z-10 my-auto">

      {/* Main Title & Brand Icon - Compact to ensure 100% viewport fit */}
      <div className="text-center mb-3 sm:mb-4">
        <div className="flex items-center justify-center gap-2.5 mb-1.5">
          {/* Blue Shield / Check Icon Badge */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-3 ring-white">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            QA Inspection Portal
          </h1>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto font-medium">
          Select your workspace to continue
        </p>
      </div>

      {/* Workspace Selection Cards Grid */}
      <div className="w-full max-w-3xl px-2 sm:px-4 my-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Inspection */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectWorkspace('inspection')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectWorkspace('inspection');
              }
            }}
            className="group bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/80 portal-glass-card transition-all duration-300 flex flex-col items-center text-center justify-between relative hover:-translate-y-1 hover:shadow-lg hover:border-blue-200/80 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            id="workspace-inspection-card"
          >
            <div className="flex flex-col items-center w-full">
              {/* Icon Container */}
              <div className="relative mb-3 sm:mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-blue-50 to-indigo-50/70 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <ClipboardCheck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
                </div>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full shadow-xs" />
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 tracking-tight group-hover:text-blue-600 transition-colors duration-200">
                Inspection
              </h2>

              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mb-4 font-normal">
                Access digital inspection forms, live batch verification, and quality defect logs.
              </p>
            </div>

            {/* Action Button */}
            <div className="w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWorkspace('inspection');
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 transition-all duration-200 cursor-pointer"
                id="btn-continue-inspection"
              >
                <span>Continue to Inspection</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Admin Panel */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectWorkspace('admin')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectWorkspace('admin');
              }
            }}
            className="group bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/80 portal-glass-card transition-all duration-300 flex flex-col items-center text-center justify-between relative hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200/80 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            id="workspace-admin-card"
          >
            <div className="flex flex-col items-center w-full">
              {/* Icon Container */}
              <div className="relative mb-3 sm:mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-blue-50 to-indigo-50/70 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
                </div>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-600 border-2 border-white rounded-full shadow-xs" />
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 tracking-tight group-hover:text-indigo-600 transition-colors duration-200">
                Admin Panel
              </h2>

              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mb-4 font-normal">
                Manage QA user credentials, configure inspection specifications, and review analytics.
              </p>
            </div>

            {/* Action Button */}
            <div className="w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWorkspace('admin');
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-500/25 transition-all duration-200 cursor-pointer"
                id="btn-continue-admin"
              >
                <span>Continue to Admin Panel</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
