import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, ClipboardCheck, Building2 } from 'lucide-react';

interface WorkspaceSelectionProps {
  onSelectWorkspace: (workspace: 'inspection' | 'admin') => void;
  onOpenSignIn: (workspace: 'inspection' | 'admin') => void;
}

export const WorkspaceSelection: React.FC<WorkspaceSelectionProps> = ({
  onSelectWorkspace,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[calc(100vh-5rem)] py-6 z-10">
      {/* Prominently Highlighted Company Brand Banner */}
      <div 
        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/95 border-2 border-blue-500/25 shadow-lg shadow-blue-500/10 backdrop-blur-md mb-6 hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 group"
        id="company-highlight-badge"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            ABC Company Private Limited
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified Enterprise
          </span>
        </div>
      </div>

      {/* Main Title & Brand Icon */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-3.5 mb-3">
          {/* Blue Shield / Check Icon Badge matching screenshot */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-4 ring-white">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            QA Inspection Portal
          </h1>
        </div>
        <p className="text-slate-500 text-base sm:text-lg max-w-md mx-auto font-medium">
          Select your workspace to continue
        </p>
      </div>

      {/* Workspace Selection Cards Grid */}
      <div className="w-full max-w-5xl px-4 sm:px-6 my-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8 lg:gap-10">
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
            className="group bg-white/95 backdrop-blur-sm rounded-3xl p-8 sm:p-10 border border-white/80 portal-glass-card transition-all duration-300 flex flex-col items-center text-center justify-between relative hover:-translate-y-2 hover:shadow-2xl hover:border-blue-200/80 cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            id="workspace-inspection-card"
          >
            <div className="flex flex-col items-center w-full">
              {/* Icon Container with subtle orbital dot */}
              <div className="relative mb-7 sm:mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-50 to-indigo-50/70 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  {/* Digital Checklist Icon */}
                  <ClipboardCheck className="w-11 h-11 stroke-[1.8]" />
                </div>
                {/* Orbit Accent Dot */}
                <span className="absolute top-1 -right-0.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-sm group-hover:scale-125 transition-transform"></span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors duration-200">
                Inspection
              </h2>

              {/* Minimal Separator Dot */}
              <div className="w-12 h-1 bg-slate-100 rounded-full mb-4 flex items-center justify-center">
                <span className="w-2.5 h-1 bg-blue-500 rounded-full group-hover:w-8 transition-all duration-300"></span>
              </div>

              {/* Description */}
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-sm mb-9 font-normal">
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
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 transform group-hover:shadow-xl cursor-pointer"
                id="btn-continue-inspection"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1.5" />
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
            className="group bg-white/95 backdrop-blur-sm rounded-3xl p-8 sm:p-10 border border-white/80 portal-glass-card transition-all duration-300 flex flex-col items-center text-center justify-between relative hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-200/80 cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
            id="workspace-admin-card"
          >
            <div className="flex flex-col items-center w-full">
              {/* Icon Container with subtle orbital dot */}
              <div className="relative mb-7 sm:mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-50 to-indigo-50/70 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  {/* Admin Shield Icon */}
                  <ShieldCheck className="w-11 h-11 stroke-[1.8]" />
                </div>
                {/* Orbit Accent Dot */}
                <span className="absolute top-1.5 -right-0.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full shadow-sm group-hover:scale-125 transition-transform"></span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors duration-200">
                Admin Panel
              </h2>

              {/* Minimal Separator Dot */}
              <div className="w-12 h-1 bg-slate-100 rounded-full mb-4 flex items-center justify-center">
                <span className="w-2.5 h-1 bg-indigo-500 rounded-full group-hover:w-8 transition-all duration-300"></span>
              </div>

              {/* Description */}
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-sm mb-9 font-normal">
                Manage QA teams, calibrate tolerances, access audit trails, and system configuration.
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
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 transform group-hover:shadow-xl cursor-pointer"
                id="btn-continue-admin"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Corporate Footer Note */}
      <div className="mt-8 text-center text-xs text-slate-400 font-medium">
        <span>ISO 9001:2015 & IATF 16949 Certified Quality Management System</span>
      </div>
    </div>
  );
};
