import React, { useState, useEffect } from 'react';
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
import { IN_PROCESS_CATEGORIES, InProcessSampleCheckpoint } from '../inProcessData';
import { fetchItems, DbItem } from '../backend/itemService';
import {
  getChildCards,
  InspectionHierarchyCard,
  HIERARCHY_UPDATED_EVENT
} from '../inspectionHierarchyData';
import { InspectionCardIconRenderer } from './InspectionCardIconRenderer';
import { ChildCardOperationsWorkspace } from './ChildCardOperationsWorkspace';

interface InProcessInspectionPortalProps {
  onBack: () => void;
  onOpenLiveInspection: (categoryName?: string) => void;
  onAddInspectionRecord?: (item: InspectionRecord) => void;
  userId: string;
  inspections?: InspectionRecord[];
}

export const InProcessInspectionPortal: React.FC<InProcessInspectionPortalProps> = ({
  onBack,
  onOpenLiveInspection,
  onAddInspectionRecord,
  userId,
  inspections = [],
}) => {
  // Active child card for operations workspace (1. Make New Inspection, 2. View Past Records)
  const [activeChildCard, setActiveChildCard] = useState<InspectionHierarchyCard | null>(null);

  // Selected category for active inspection view / modal (fallback)
  const [selectedCategory, setSelectedCategory] = useState<InProcessCategoryItem | null>(null);
  
  // Supabase items state
  const [items, setItems] = useState<DbItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(true);
  const [selectedItemCode, setSelectedItemCode] = useState<string>('');
  const [newPartNumber, setNewPartNumber] = useState<string>('');

  // In-process checkpoints state
  const [checkpoints, setCheckpoints] = useState<InProcessSampleCheckpoint[]>([]);
  
  // Quick inspection check form inside the modal
  const [showLogForm, setShowLogForm] = useState(false);
  const [newCheckId, setNewCheckId] = useState(`CHK-INP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedStation, setSelectedStation] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newMeasuredVal, setNewMeasuredVal] = useState('');
  const [defectSeverity, setDefectSeverity] = useState<'none' | 'minor' | 'major'>('none');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Configured child cards from inspection hierarchy
  const [configuredChildCards, setConfiguredChildCards] = useState<InspectionHierarchyCard[]>(() =>
    getChildCards('main-inprocess')
  );

  useEffect(() => {
    const handleUpdate = () => {
      setConfiguredChildCards(getChildCards('main-inprocess'));
    };
    window.addEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Fetch real items from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadItems() {
      setIsLoadingItems(true);
      const data = await fetchItems();
      if (isMounted) {
        setItems(data);
        setIsLoadingItems(false);
      }
    }
    loadItems();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter or prioritize items matching the in-process category
  const getCategoryItems = (categoryName?: string): DbItem[] => {
    if (!categoryName) return items;
    const cat = categoryName.toLowerCase();
    const matched = items.filter(it => {
      const s = (it.series || '').toLowerCase();
      const c = (it.category || '').toLowerCase();
      const d = (it.description || '').toLowerCase();
      if (cat.includes('white series')) return s.includes('white series');
      if (cat.includes('modular') || cat.includes('nature')) return s.includes('modular') || s.includes('nature');
      if (cat.includes('led')) return s.includes('led') || c.includes('led') || d.includes('led');
      if (cat.includes('injection')) return s.includes('enclosure') || s.includes('frames') || s.includes('conduit') || c.includes('socket');
      if (cat.includes('automation')) return s.includes('accessories') || c.includes('gang') || c.includes('controller') || c.includes('bell');
      return s.includes(cat) || c.includes(cat) || d.includes(cat);
    });
    return matched.length > 0 ? matched : items;
  };

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
    const relevant = getCategoryItems(category.name);
    if (relevant.length > 0) {
      setSelectedItemCode(relevant[0].item_code);
      setNewPartName(relevant[0].description);
      setNewPartNumber(relevant[0].item_code);
    } else {
      setSelectedItemCode('');
      setNewPartName('');
      setNewPartNumber('');
    }
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
        partNumber: newPartNumber || selectedItemCode || `${selectedCategory.code}-${Math.floor(100 + Math.random() * 900)}`,
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
        notes: `Online/In-Process quality check completed for ${newPartName} (${newPartNumber || selectedItemCode}) on line: ${selectedCategory.name} (${selectedStation}).`,
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

  // If a child card is clicked, open the operations workspace (1. Make New Inspection, 2. View Past Records)
  if (activeChildCard) {
    return (
      <ChildCardOperationsWorkspace
        mainCard={{
          id: 'main-inprocess',
          name: 'Online / In-Process',
          description: 'Perform live assembly line quality checks, tolerance calibrations, and real-time defect tracking.',
          iconName: 'ClipboardCheck',
          location: 'main',
          order: 2,
          moduleId: 'in-process',
        }}
        childCard={activeChildCard}
        userId={userId}
        inspections={inspections}
        onAddInspectionRecord={onAddInspectionRecord}
        onBackToChildCards={() => setActiveChildCard(null)}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-2 z-10 max-w-7xl mx-auto my-auto">
      
      {/* Top Section: Corporate Brand & Back Button */}
      <div className="w-full flex flex-col items-center">

        {/* Main Portal Title & Icon */}
        <div className="text-center mb-2 sm:mb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 ring-2 ring-white">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Online/In-Process Inspection
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto font-medium">
            Select an active production line category to begin in-process quality audits
          </p>
        </div>
      </div>

      {/* 5 Cards Grid: (Automation, White Series, Modular/Nature, LED, Injection Molding) */}
      <div className="w-full max-w-7xl my-auto mb-2 sm:mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {configuredChildCards.map((childCard) => {
            const matchedCategory = IN_PROCESS_CATEGORIES.find(
              c => c.name.toLowerCase() === childCard.name.toLowerCase() || c.id === childCard.id
            );
            const category: InProcessCategoryItem = matchedCategory ? {
              ...matchedCategory,
              name: childCard.name as any,
              description: childCard.description,
            } : {
              id: childCard.id,
              name: childCard.name as any,
              code: `PROC-${childCard.name.slice(0, 4).toUpperCase().replace(/[\s/]+/g, '')}`,
              description: childCard.description,
              activeLines: 3,
              yieldRate: 99.1,
              sampleItems: [`${childCard.name} Checkpoint 1`, `${childCard.name} Tolerance Verification`],
              inspectionStandard: 'ISO 9001:2015 / SLS 734',
              lineStations: ['Assembly Line 01', 'Automated Checkpoint'],
              tag: childCard.tag || 'In-Process QA',
            };

            return (
              <div
                key={childCard.id}
                onClick={() => setActiveChildCard(childCard)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveChildCard(childCard);
                  }
                }}
                className="portal-glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer select-none border border-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                id={`card-${childCard.name.toLowerCase().replace(/[\s/]+/g, '-')}`}
              >
                {/* Top Module Icon with decorative orbital accent dot */}
                <div className="flex flex-col items-center w-full">
                  <div className="relative mb-2.5 sm:mb-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                      <InspectionCardIconRenderer iconName={childCard.iconName} className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
                    </div>
                    {/* Orbit accent dot matching before pages */}
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full shadow-2xs group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Card Title */}
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {childCard.name}
                  </h3>
                </div>

                {/* Card Action Button */}
                <div className="w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChildCard(childCard);
                    }}
                    className="w-full py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-all duration-200 shadow-2xs shadow-blue-500/25 flex items-center justify-center gap-1 group-hover:shadow-xs cursor-pointer"
                    id={`btn-start-${childCard.name.toLowerCase().replace(/[\s/]+/g, '-')}`}
                  >
                    <span>Select Operations</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Return to QA Inspection Button at bottom */}
      <div className="w-full flex justify-center pt-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-xs shadow-2xs border border-slate-200/80 backdrop-blur-md transition-all cursor-pointer group hover:shadow-xs"
          id="btn-return-to-qa-portal-inprocess"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
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

            {/* Key In-Process Quality Checkpoints / Registered Items */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Registered Production Items (Supabase Database)
                </h4>
                <span className="text-xs font-semibold text-blue-600">
                  {isLoadingItems ? 'Connecting...' : `${getCategoryItems(selectedCategory.name).length} items`}
                </span>
              </div>
              {isLoadingItems ? (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>Loading production parts from Supabase...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {getCategoryItems(selectedCategory.name).slice(0, 12).map((item) => (
                    <div 
                      key={item.item_code} 
                      onClick={() => {
                        setSelectedItemCode(item.item_code);
                        setNewPartName(item.description);
                        setNewPartNumber(item.item_code);
                        setShowLogForm(true);
                      }}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        selectedItemCode === item.item_code 
                          ? 'bg-blue-50/80 border-blue-400 text-blue-900 ring-1 ring-blue-300' 
                          : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-blue-300 hover:bg-white'
                      }`}
                      title="Click to select for in-process inspection"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{item.description}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 font-bold">
                        {item.item_code}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Inspected Part Name / Item Selection
                  </label>
                  {isLoadingItems ? (
                    <div className="text-xs text-slate-500 py-2 animate-pulse">Loading items from Supabase...</div>
                  ) : (
                    <select
                      value={selectedItemCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedItemCode(code);
                        const sel = items.find(it => it.item_code === code);
                        if (sel) {
                          setNewPartName(sel.description);
                          setNewPartNumber(sel.item_code);
                        }
                      }}
                      required
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium truncate"
                    >
                      <option value="" disabled>-- Select Part Name / Item Code --</option>
                      {getCategoryItems(selectedCategory.name).map((item) => (
                        <option key={item.item_code} value={item.item_code}>
                          {item.description} ({item.item_code})
                        </option>
                      ))}
                    </select>
                  )}
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
