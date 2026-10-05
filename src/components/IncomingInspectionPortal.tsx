import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Fan as FanIcon, 
  ShieldCheck, 
  Cpu, 
  PackageCheck, 
  Package, 
  Boxes, 
  Building2, 
  Check, 
  X, 
  Plus, 
  SlidersHorizontal,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import { IncomingCategoryItem, IncomingCategoryType, InspectionRecord } from '../types';
import { INCOMING_CATEGORIES, SAMPLE_INCOMING_LOTS, IncomingSampleLot } from '../incomingData';

interface IncomingInspectionPortalProps {
  onBack: () => void;
  onOpenLiveInspection: (categoryName?: string) => void;
  onAddInspectionRecord?: (item: InspectionRecord) => void;
  userId: string;
}

export const IncomingInspectionPortal: React.FC<IncomingInspectionPortalProps> = ({
  onBack,
  onOpenLiveInspection,
  onAddInspectionRecord,
  userId,
}) => {
  // Selected category for active inspection view / modal
  const [selectedCategory, setSelectedCategory] = useState<IncomingCategoryItem | null>(null);
  
  // Lots state
  const [lots, setLots] = useState<IncomingSampleLot[]>(SAMPLE_INCOMING_LOTS);
  
  // Quick inspection check form inside the modal
  const [showLogForm, setShowLogForm] = useState(false);
  const [newLotNumber, setNewLotNumber] = useState(`LOT-IN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newPartName, setNewPartName] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newMeasuredVal, setNewMeasuredVal] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Category Icon resolver matching the clean visual style
  const getCategoryIcon = (name: IncomingCategoryType) => {
    switch (name) {
      case 'Raw Material':
        return <Layers className="w-9 h-9 stroke-[1.8]" />;
      case 'LED':
        return <Zap className="w-9 h-9 stroke-[1.8]" />;
      case 'Fan':
        return <FanIcon className="w-9 h-9 stroke-[1.8]" />;
      case 'Protection':
        return <ShieldCheck className="w-9 h-9 stroke-[1.8]" />;
      case 'Subcontractor SF':
        return <Cpu className="w-9 h-9 stroke-[1.8]" />;
      case 'Subcontractor FG':
        return <PackageCheck className="w-9 h-9 stroke-[1.8]" />;
      case 'Packing Items':
        return <Package className="w-9 h-9 stroke-[1.8]" />;
      case 'Others':
        return <Boxes className="w-9 h-9 stroke-[1.8]" />;
      default:
        return <Layers className="w-9 h-9 stroke-[1.8]" />;
    }
  };

  const handleStartInspection = (category: IncomingCategoryItem) => {
    setSelectedCategory(category);
    setNewLotNumber(`LOT-${category.code}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewPartName(category.sampleItems[0] || '');
    setNewSupplier(category.sampleItems.length > 0 ? 'Certified Partner Supply' : 'Global Materials Inc.');
    setNewMeasuredVal('45.02');
    setShowLogForm(false);
    setVerifiedSuccess(false);
  };

  const handleLogVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newPartName.trim()) return;

    const newLot: IncomingSampleLot = {
      id: `LOT-IN-${Date.now()}`,
      lotNumber: newLotNumber,
      category: selectedCategory.name,
      partNumber: `${selectedCategory.code}-${Math.floor(100 + Math.random() * 900)}`,
      partName: newPartName,
      supplier: newSupplier || 'Approved Supplier',
      quantity: 500,
      unit: selectedCategory.name === 'Raw Material' ? 'kg' : 'pcs',
      nominalSpec: 'Standard Tolerance Target ± 0.05 mm',
      measuredSpec: `${newMeasuredVal || '45.00'} mm (Inspected by ${userId})`,
      status: 'pass',
      receivedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setLots(prev => [newLot, ...prev]);

    if (onAddInspectionRecord) {
      const record: InspectionRecord = {
        id: `INS-IN-${Date.now()}`,
        lotNumber: newLotNumber,
        batchId: `B-${Math.floor(1000 + Math.random() * 9000)}`,
        partNumber: newLot.partNumber,
        partName: newLot.partName,
        module: 'incoming',
        supplierOrLine: newLot.supplier,
        nominalValue: 45.0,
        toleranceMin: 44.95,
        toleranceMax: 45.05,
        measuredValue: Number(newMeasuredVal) || 45.02,
        unit: 'mm',
        status: 'pass',
        defectSeverity: 'none',
        inspectorId: userId,
        inspectorName: `Inspector ${userId}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: `Incoming verification completed for category: ${selectedCategory.name}. Conformity certified.`,
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
          id="company-highlight-badge-incoming"
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
              <Boxes className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Incoming Inspection
            </h1>
          </div>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto font-medium">
            Select an incoming category to begin quality audits
          </p>
        </div>
      </div>

      {/* 8 Cards Grid: Exactly matching the aesthetic, layout, and conditions of the before pages */}
      <div className="w-full max-w-7xl my-auto mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {INCOMING_CATEGORIES.map((category) => {
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
                id={`card-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
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
                    id={`btn-start-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
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
          id="btn-return-to-qa-portal"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to QA Inspection Modules</span>
        </button>
      </div>

      {/* Category Inspection Audit & Verification Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            id="category-inspection-modal"
          >
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  {getCategoryIcon(selectedCategory.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {selectedCategory.name}
                    </h2>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      {selectedCategory.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Standard: {selectedCategory.inspectionStandard}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCategory(null)}
                className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Category Scope */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Inspection Scope & Material Criteria
                </span>
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 leading-relaxed font-medium">
                  {selectedCategory.description}
                </p>
              </div>

              {/* Sample Verified Materials */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Sample Receiving Parts Checklist
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCategory.sampleItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2 text-xs font-semibold text-slate-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inbound Lot Records */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Recent Verified Inbound Lots
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {lots.filter(l => l.category === selectedCategory.name).length} Verified
                  </span>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {lots
                    .filter(l => l.category === selectedCategory.name)
                    .map(lot => (
                      <div 
                        key={lot.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{lot.lotNumber}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                              PASS
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium text-[11px] mt-0.5">{lot.partName}</p>
                          <p className="text-slate-400 text-[10px]">Supplier: {lot.supplier} • Qty: {lot.quantity} {lot.unit}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 text-[11px] block">{lot.measuredSpec}</span>
                          <span className="text-[10px] text-slate-400">{lot.receivedDate}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Quick Record Inbound Inspection Form */}
              {showLogForm && (
                <form onSubmit={handleLogVerification} className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">
                      Record Inspection for {selectedCategory.name}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowLogForm(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {verifiedSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Lot verified and added to QC database successfully!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Lot Number</label>
                      <input 
                        type="text"
                        value={newLotNumber}
                        onChange={(e) => setNewLotNumber(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Part Name</label>
                      <input 
                        type="text"
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Supplier</label>
                      <input 
                        type="text"
                        value={newSupplier}
                        onChange={(e) => setNewSupplier(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Measured Value (mm)</label>
                      <input 
                        type="text"
                        value={newMeasuredVal}
                        onChange={(e) => setNewMeasuredVal(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Certify Pass</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {!showLogForm && (
                  <button
                    type="button"
                    onClick={() => setShowLogForm(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record New Inbound Lot</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    onOpenLiveInspection(selectedCategory.name);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4 text-blue-600" />
                  <span>Open Full Inspection Table</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
