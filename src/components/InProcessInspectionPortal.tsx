import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Bot, 
  Sparkles, 
  LayoutGrid, 
  Zap, 
  Factory, 
  Building2, 
  Check, 
  X, 
  Plus, 
  Activity,
  ClipboardCheck,
  AlertCircle,
  Cpu,
  Gauge,
  SlidersHorizontal
} from 'lucide-react';
import { InProcessCategoryItem, InProcessCategoryType, InspectionRecord } from '../types';
import { IN_PROCESS_CATEGORIES, SAMPLE_IN_PROCESS_CHECKPOINTS, InProcessSampleCheckpoint } from '../inProcessData';

interface InProcessInspectionPortalProps {
  onBack: () => void;
  onOpenLiveInspection: (categoryName?: string) => void;
  onAddInspectionRecord?: (item: InspectionRecord) => void;
  userId: string;
}

export const InProcessInspectionPortal: React.FC<InProcessInspectionPortalProps> = ({
  onBack,
  onOpenLiveInspection,
  onAddInspectionRecord,
  userId,
}) => {
  // Selected category for active inspection view / modal
  const [selectedCategory, setSelectedCategory] = useState<InProcessCategoryItem | null>(null);
  
  // In-process checkpoints state
  const [checkpoints, setCheckpoints] = useState<InProcessSampleCheckpoint[]>(SAMPLE_IN_PROCESS_CHECKPOINTS);
  
  // Quick inspection check form inside the modal
  const [showLogForm, setShowLogForm] = useState(false);
  const [newCheckId, setNewCheckId] = useState(`CHK-INP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedStation, setSelectedStation] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newMeasuredVal, setNewMeasuredVal] = useState('');
  const [defectSeverity, setDefectSeverity] = useState<'none' | 'minor' | 'major'>('none');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Category Icon resolver matching the clean visual style
  const getCategoryIcon = (name: InProcessCategoryType) => {
    switch (name) {
      case 'Automation':
        return <Bot className="w-9 h-9 stroke-[1.8]" />;
      case 'White Series':
        return <Sparkles className="w-9 h-9 stroke-[1.8]" />;
      case 'Modular/Nature':
        return <LayoutGrid className="w-9 h-9 stroke-[1.8]" />;
      case 'LED':
        return <Zap className="w-9 h-9 stroke-[1.8]" />;
      case 'Injection Molding':
        return <Factory className="w-9 h-9 stroke-[1.8]" />;
      default:
        return <Activity className="w-9 h-9 stroke-[1.8]" />;
    }
  };

  const handleStartInspection = (category: InProcessCategoryItem) => {
    setSelectedCategory(category);
    setNewCheckId(`CHK-${category.code}-${Math.floor(1000 + Math.random() * 9000)}`);
    setSelectedStation(category.lineStations[0] || 'Assembly Station 01');
    setNewPartName(category.sampleItems[0] || 'Standard Production Unit');
    setNewMeasuredVal('Pass (Conforms to Standard)');
    setDefectSeverity('none');
    setShowLogForm(false);
    setVerifiedSuccess(false);
  };

  const handleLogVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newPartName.trim()) return;

    const newCheckpoint: InProcessSampleCheckpoint = {
      id: `chk-${Date.now()}`,
      checkId: newCheckId,
      category: selectedCategory.name,
      lineId: selectedStation,
      partName: newPartName,
      station: selectedStation,
      nominalSpec: 'Standard In-Line Engineering Tolerance',
      measuredSpec: `${newMeasuredVal || 'Conforms'} (Logged by ${userId})`,
      status: defectSeverity === 'none' ? 'pass' : 'fail',
      inspector: userId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setCheckpoints(prev => [newCheckpoint, ...prev]);

    if (onAddInspectionRecord) {
      const record: InspectionRecord = {
        id: `INS-PROC-${Date.now()}`,
        lotNumber: `LOT-INP-${Math.floor(10000 + Math.random() * 90000)}`,
        batchId: `B-PROC-${Math.floor(1000 + Math.random() * 9000)}`,
        partNumber: `${selectedCategory.code}-${Math.floor(100 + Math.random() * 900)}`,
        partName: newPartName,
        module: 'in-process',
        supplierOrLine: selectedStation,
        nominalValue: 50.0,
        toleranceMin: 49.9,
        toleranceMax: 50.1,
        measuredValue: defectSeverity === 'none' ? 50.02 : 49.85,
        unit: 'mm',
        status: defectSeverity === 'none' ? 'pass' : 'fail',
        defectSeverity: defectSeverity,
        defectType: defectSeverity === 'none' ? undefined : 'In-Process Dimensional Variance',
        inspectorId: userId,
        inspectorName: `Inspector ${userId}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: `Online/In-Process quality check completed for line: ${selectedCategory.name} (${selectedStation}).`,
        verifiedBy: `Verified By ${userId}`,
      };
      onAddInspectionRecord(record);
    }

    setVerifiedSuccess(true);
    setTimeout(() => {
      setVerifiedSuccess(false);
      setShowLogForm(false);
    }, 1500);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-6 z-10 max-w-7xl mx-auto min-h-[calc(100vh-6rem)]">
      
      {/* Top Section: Corporate Brand & Back Button */}
      <div className="w-full flex flex-col items-center">
        {/* Prominently Highlighted Company Brand Banner matching before pages */}
        <div 
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/95 border-2 border-blue-500/25 shadow-lg shadow-blue-500/10 backdrop-blur-md mb-6 hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 group"
          id="company-highlight-badge-inprocess"
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

        {/* Main Portal Title & Icon matching exactly the conditions of the before pages */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-3.5 mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-4 ring-white">
              <Activity className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Online/In-Process Inspection
            </h1>
          </div>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto font-medium">
            Select an active production line category to begin in-process quality audits
          </p>
        </div>
      </div>

      {/* 5 Cards Grid: (Automation, White Series, Modular/Nature, LED, Injection Molding) */}
      <div className="w-full max-w-7xl my-auto mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-7">
          {IN_PROCESS_CATEGORIES.map((category) => {
            return (
              <div
                key={category.id}
                onClick={() => handleStartInspection(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStartInspection(category);
                  }
                }}
                className="portal-glass-card rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer select-none border border-white/90 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                id={`card-${category.name.toLowerCase().replace(/[\s/]+/g, '-')}`}
              >
                {/* Top Module Icon with decorative orbital accent dot */}
                <div className="flex flex-col items-center w-full">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      {getCategoryIcon(category.name)}
                    </div>
                    {/* Orbit accent dot matching before pages */}
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-xs group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Card Title matching the user request names exactly */}
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>

                  {/* Minimal Separator Accent Line */}
                  <div className="w-10 h-1 bg-slate-100 rounded-full mb-3 flex items-center justify-center">
                    <span className="w-2.5 h-1 bg-blue-500 rounded-full group-hover:w-6 transition-all duration-300"></span>
                  </div>

                  {/* Concise Description */}
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6 font-normal line-clamp-3">
                    {category.description}
                  </p>
                </div>

                {/* Card Action Button matching the before pages */}
                <div className="w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartInspection(category);
                    }}
                    className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/35 cursor-pointer"
                    id={`btn-start-${category.name.toLowerCase().replace(/[\s/]+/g, '-')}`}
                  >
                    <span>Start Inspection</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Return to QA Inspection Button at bottom */}
      <div className="w-full flex justify-center pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-xs sm:text-sm shadow-sm border border-slate-200/80 backdrop-blur-md transition-all cursor-pointer group hover:shadow-md"
          id="btn-return-to-qa-portal-inprocess"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to QA Inspection Modules</span>
        </button>
      </div>

      {/* Category Inspection Audit & Verification Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  {getCategoryIcon(selectedCategory.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {selectedCategory.name}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      {selectedCategory.code}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Production Line Standard: <strong className="text-slate-700">{selectedCategory.inspectionStandard}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 my-5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Active Lines</span>
                <span className="text-lg font-bold text-slate-900">{selectedCategory.activeLines} Lines</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Yield Rate</span>
                <span className="text-lg font-bold text-emerald-600">{selectedCategory.yieldRate}%</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Auditor</span>
                <span className="text-lg font-bold text-blue-600">{userId}</span>
              </div>
            </div>

            {/* Key In-Process Quality Checkpoints */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Standard In-Line Checkpoints & Tests
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedCategory.sampleItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Station Feeds */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Operational Workstations & Cells
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategory.lineStations.map((st, i) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                    {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Verification Form Section */}
            {showLogForm ? (
              <form onSubmit={handleLogVerification} className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-blue-600" />
                    <span>Log In-Line Station Audit</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowLogForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Check / Audit ID</label>
                    <input
                      type="text"
                      value={newCheckId}
                      readOnly
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Active Station / Cell</label>
                    <select
                      value={selectedStation}
                      onChange={(e) => setSelectedStation(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {selectedCategory.lineStations.map((st, idx) => (
                        <option key={idx} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Inspected Part / Operation</label>
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Enter component or assembly item name"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Audit Observation / Value</label>
                    <input
                      type="text"
                      value={newMeasuredVal}
                      onChange={(e) => setNewMeasuredVal(e.target.value)}
                      placeholder="e.g. 50.02 mm / Pass"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quality Assessment</label>
                    <select
                      value={defectSeverity}
                      onChange={(e) => setDefectSeverity(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">Conforming (Pass)</option>
                      <option value="minor">Minor Tolerance Variance</option>
                      <option value="major">Non-Conforming (Hold Line)</option>
                    </select>
                  </div>
                </div>

                {verifiedSuccess ? (
                  <div className="p-3 bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>In-Process Verification Recorded Successfully!</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Sign-Off Audit</span>
                  </button>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Conduct Active Station Inspection</h4>
                  <p className="text-[11px] text-slate-500">Record line measurements, torque checks, or optical conformity.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  id="btn-open-inprocess-audit-form"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Station Audit</span>
                </button>
              </div>
            )}

            {/* Action Buttons in Modal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  onOpenLiveInspection(selectedCategory.name);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                id="btn-modal-open-live-inspect-inprocess"
              >
                <span>Open In-Line Records Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
