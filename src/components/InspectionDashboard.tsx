import React from 'react';
import { CheckCircle2, Box, ClipboardCheck, Building2, ArrowRight } from 'lucide-react';
import { InspectionModule } from '../types';

interface InspectionDashboardProps {
  onSelectModule: (module: InspectionModule) => void;
}

export const InspectionDashboard: React.FC<InspectionDashboardProps> = ({
  onSelectModule,
}) => {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 z-10 max-w-7xl mx-auto">
      {/* Portal Header */}
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4 ring-4 ring-blue-100/60">
          <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          QA Inspection Portal
        </h1>
        <p className="text-slate-500 font-medium mt-1.5 text-base sm:text-lg">
          Select an inspection module to begin quality audits
        </p>
      </div>

      {/* 3 Core Module Cards Grid matching reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 w-full max-w-6xl">
        {/* Card 1: Incoming Inspection */}
        <div 
          onClick={() => onSelectModule('incoming')}
          className="portal-glass-card rounded-3xl p-8 flex flex-col items-center text-center relative group transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
          id="module-incoming-card"
        >
          {/* Module Icon with subtle decorative halo */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Box className="w-9 h-9 stroke-[1.8]" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white shadow-xs"></span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
            Incoming Inspection
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 max-w-xs">
            Verify incoming raw materials, LED, fans, protection components, subcontractors & packaging.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectModule('incoming');
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/35 cursor-pointer"
            id="btn-start-incoming"
          >
            <span>Start Inspection</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 2: Online / In-Process Inspection */}
        <div 
          onClick={() => onSelectModule('in-process')}
          className="portal-glass-card rounded-3xl p-8 flex flex-col items-center text-center relative group transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
          id="module-inprocess-card"
        >
          {/* Module Icon with subtle decorative halo */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <ClipboardCheck className="w-9 h-9 stroke-[1.8]" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white shadow-xs"></span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
            Online / In-Process
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 max-w-xs">
            Perform live assembly line quality checks, tolerance calibrations, and real-time defect tracking.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectModule('in-process');
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/35 cursor-pointer"
            id="btn-start-inprocess"
          >
            <span>Start Inspection</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 3: Subcontracting Inspection */}
        <div 
          className="portal-glass-card rounded-3xl p-8 flex flex-col items-center text-center relative group transition-all duration-300 hover:-translate-y-1.5"
          id="module-subcontracting-card"
        >
          {/* Module Icon with subtle decorative halo */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Building2 className="w-9 h-9 stroke-[1.8]" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white shadow-xs"></span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
            Subcontracting Inspection
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 max-w-xs">
            Audit outsourced manufacturing batches, external processing stages, and subcontracted deliveries.
          </p>

          <button
            onClick={() => onSelectModule('subcontracting')}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/35 cursor-pointer"
            id="btn-start-subcontracting"
          >
            <span>Start Inspection</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
