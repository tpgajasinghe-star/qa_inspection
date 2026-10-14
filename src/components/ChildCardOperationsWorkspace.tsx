import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  FileCheck2, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Layers, 
  History, 
  ClipboardCheck, 
  Building2, 
  Sparkles,
  Printer,
  ChevronRight,
  ExternalLink,
  Tag,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { InspectionRecord, QAStatus, DefectSeverity } from '../types';
import { InspectionHierarchyCard } from '../inspectionHierarchyData';
import { InspectionCardIconRenderer } from './InspectionCardIconRenderer';
import { fetchItems, DbItem } from '../backend/itemService';
import { 
  getStoredDeployedForms, 
  getDeployedFormsForChildCard, 
  DeployedInspectionForm, 
  DEPLOYED_FORMS_UPDATED_EVENT 
} from '../deployedFormsData';
import { DeployedInspectionFormView } from './DeployedInspectionFormView';

interface ChildCardOperationsWorkspaceProps {
  mainCard: InspectionHierarchyCard;
  childCard: InspectionHierarchyCard;
  userId: string;
  inspections: InspectionRecord[];
  onAddInspectionRecord?: (item: InspectionRecord) => void;
  onBackToChildCards: () => void;
}

export const ChildCardOperationsWorkspace: React.FC<ChildCardOperationsWorkspaceProps> = ({
  mainCard,
  childCard,
  userId,
  inspections,
  onAddInspectionRecord,
  onBackToChildCards,
}) => {
  // Current view: 'operation-cards' | 'new-inspection' | 'past-records'
  const [currentView, setCurrentView] = useState<'operation-cards' | 'new-inspection' | 'past-records'>('operation-cards');

  // Supabase items
  const [dbItems, setDbItems] = useState<DbItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(true);

  // Local state for inspections specific to this category (initial + newly added)
  const [localRecords, setLocalRecords] = useState<InspectionRecord[]>([]);

  // Selected inspection record for certificate modal
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<InspectionRecord | null>(null);

  // Search & Filter state for past records
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QAStatus>('all');

  // ===================== DEPLOYED FORMS STATE (Make New Inspection) =====================
  const [deployedForms, setDeployedForms] = useState<DeployedInspectionForm[]>(() => 
    getDeployedFormsForChildCard(childCard.id, mainCard.id)
  );
  const [selectedDeployedForm, setSelectedDeployedForm] = useState<DeployedInspectionForm | null>(null);
  const [showStandardFallbackForm, setShowStandardFallbackForm] = useState<boolean>(false);

  // Keep deployed forms synced when updated
  useEffect(() => {
    const refreshDeployed = () => {
      setDeployedForms(getDeployedFormsForChildCard(childCard.id, mainCard.id));
    };
    window.addEventListener(DEPLOYED_FORMS_UPDATED_EVENT, refreshDeployed);
    return () => {
      window.removeEventListener(DEPLOYED_FORMS_UPDATED_EVENT, refreshDeployed);
    };
  }, [childCard.id, mainCard.id]);

  // ===================== FORM STATE (Make New Inspection) =====================
  const categoryCodePrefix = (childCard.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()) || 'QC';
  const generateNewLot = () => `LOT-${categoryCodePrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const [formLotNumber, setFormLotNumber] = useState(generateNewLot());
  const [formBatchId, setFormBatchId] = useState(`B-${Math.floor(2000 + Math.random() * 8000)}`);
  const [formItemCode, setFormItemCode] = useState('');
  const [formPartName, setFormPartName] = useState('');
  const [formPartNumber, setFormPartNumber] = useState('');
  const [formSupplierOrLine, setFormSupplierOrLine] = useState('');
  const [formParameter, setFormParameter] = useState('Critical Dimensional & Functional Spec');
  const [formNominal, setFormNominal] = useState('45.00');
  const [formTolMin, setFormTolMin] = useState('44.95');
  const [formTolMax, setFormTolMax] = useState('45.05');
  const [formMeasured, setFormMeasured] = useState('45.02');
  const [formUnit, setFormUnit] = useState('mm');
  const [formStatus, setFormStatus] = useState<QAStatus>('pass');
  const [formDefectSeverity, setFormDefectSeverity] = useState<DefectSeverity>('none');
  const [formDefectType, setFormDefectType] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState('');

  // Fetch Supabase items on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoadingItems(true);
      const items = await fetchItems();
      if (mounted) {
        setDbItems(items);
        setIsLoadingItems(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter relevant items for this child card
  const relevantItems = useMemo(() => {
    const cardName = childCard.name.toLowerCase();
    const filtered = dbItems.filter(item => {
      const s = (item.series || '').toLowerCase();
      const c = (item.category || '').toLowerCase();
      const d = (item.description || '').toLowerCase();
      if (cardName.includes('led')) return s.includes('led') || c.includes('led') || d.includes('led');
      if (cardName.includes('raw')) return s.includes('conduit') || s.includes('enclosure') || d.includes('sheet') || d.includes('box');
      if (cardName.includes('fan')) return s.includes('fan') || d.includes('fan') || s.includes('accessories');
      if (cardName.includes('protection')) return s.includes('protection') || c.includes('protection');
      if (cardName.includes('automation')) return s.includes('accessories') || c.includes('gang') || c.includes('controller');
      if (cardName.includes('white')) return s.includes('white') || c.includes('white');
      if (cardName.includes('modular') || cardName.includes('nature')) return s.includes('modular') || s.includes('nature');
      if (cardName.includes('injection')) return s.includes('frames') || s.includes('socket') || s.includes('enclosure');
      if (cardName.includes('subcontractor sf')) return s.includes('modular') || c.includes('controller');
      if (cardName.includes('subcontractor fg')) return s.includes('kevilton') || c.includes('bell');
      if (cardName.includes('packing')) return s.includes('box') || s.includes('outlet');
      return s.includes(cardName) || c.includes(cardName) || d.includes(cardName);
    });
    return filtered.length > 0 ? filtered : dbItems.slice(0, 15);
  }, [dbItems, childCard.name]);

  // Seed / Initialize records for this child card if none exist
  useEffect(() => {
    // Check if system inspections already have matching records
    const matchingFromApp = inspections.filter(
      item => 
        (item.category && item.category.toLowerCase() === childCard.name.toLowerCase()) ||
        (item.partName && item.partName.toLowerCase().includes(childCard.name.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(childCard.name.toLowerCase()))
    );

    if (matchingFromApp.length > 0) {
      setLocalRecords(matchingFromApp);
      return;
    }

    // Otherwise generate 4 realistic historical records for this child card
    const prefixes = ['LOT-A', 'LOT-B', 'LOT-C', 'LOT-D'];
    const seeded: InspectionRecord[] = [
      {
        id: `INS-${categoryCodePrefix}-101`,
        lotNumber: `LOT-${categoryCodePrefix}-2026-8812`,
        batchId: 'B-6401',
        partNumber: `${categoryCodePrefix}-450-TI`,
        partName: `${childCard.name} Certified Sample A`,
        module: (mainCard.moduleId as any) || 'incoming',
        supplierOrLine: mainCard.moduleId === 'in-process' ? 'Assembly Cell Line 02' : 'Premier Certified Supplier Ltd',
        nominalValue: 45.0,
        toleranceMin: 44.95,
        toleranceMax: 45.05,
        measuredValue: 45.02,
        unit: 'mm',
        status: 'pass',
        defectSeverity: 'none',
        inspectorId: 'QA-8941',
        inspectorName: 'Marcus Vance',
        timestamp: '2026-09-11 08:30:15',
        notes: `Conforms strictly to ${childCard.name} quality audit protocol. Dimensions & visual specs verified.`,
        verifiedBy: 'Lead AD-1004',
        category: childCard.name,
      },
      {
        id: `INS-${categoryCodePrefix}-102`,
        lotNumber: `LOT-${categoryCodePrefix}-2026-8814`,
        batchId: 'B-6403',
        partNumber: `${categoryCodePrefix}-452-REV`,
        partName: `${childCard.name} Production Batch B`,
        module: (mainCard.moduleId as any) || 'incoming',
        supplierOrLine: mainCard.moduleId === 'in-process' ? 'Robotic Workstation 01' : 'Apex Precision Components',
        nominalValue: 50.0,
        toleranceMin: 49.90,
        toleranceMax: 50.10,
        measuredValue: 50.04,
        unit: 'mm',
        status: 'pass',
        defectSeverity: 'none',
        inspectorId: 'QA-8941',
        inspectorName: 'Marcus Vance',
        timestamp: '2026-09-12 11:15:42',
        notes: `Calibration check approved. 100% sample pass rate in conformity test.`,
        verifiedBy: 'Lead AD-1004',
        category: childCard.name,
      },
      {
        id: `INS-${categoryCodePrefix}-103`,
        lotNumber: `LOT-${categoryCodePrefix}-2026-8818`,
        batchId: 'B-6407',
        partNumber: `${categoryCodePrefix}-458-VAR`,
        partName: `${childCard.name} Verification Lot C`,
        module: (mainCard.moduleId as any) || 'incoming',
        supplierOrLine: mainCard.moduleId === 'in-process' ? 'Station Line 03' : 'Global Tech Alliance',
        nominalValue: 25.0,
        toleranceMin: 24.95,
        toleranceMax: 25.05,
        measuredValue: 25.12,
        unit: 'mm',
        status: 'fail',
        defectSeverity: 'minor',
        defectType: 'Minor Tolerance Variance',
        inspectorId: 'QA-8941',
        inspectorName: 'Marcus Vance',
        timestamp: '2026-09-13 14:40:08',
        notes: `Minor deviation observed (+0.07mm). Batch flagged for engineering re-calibration.`,
        verifiedBy: 'Lead AD-1004',
        category: childCard.name,
      },
      {
        id: `INS-${categoryCodePrefix}-104`,
        lotNumber: `LOT-${categoryCodePrefix}-2026-8822`,
        batchId: 'B-6411',
        partNumber: `${categoryCodePrefix}-460-MOD`,
        partName: `${childCard.name} High Reliability Run`,
        module: (mainCard.moduleId as any) || 'incoming',
        supplierOrLine: mainCard.moduleId === 'in-process' ? 'Final Quality Station 04' : 'Certified OEM Partner',
        nominalValue: 12.0,
        toleranceMin: 11.95,
        toleranceMax: 12.05,
        measuredValue: 12.01,
        unit: 'mm',
        status: 'pass',
        defectSeverity: 'none',
        inspectorId: 'QA-8941',
        inspectorName: 'Marcus Vance',
        timestamp: '2026-09-14 09:20:55',
        notes: `AQL 1.0 General Inspection Level II passed without anomalies. Certificate generated.`,
        verifiedBy: 'Lead AD-1004',
        category: childCard.name,
      },
    ];

    setLocalRecords(seeded);
  }, [childCard.name, inspections, categoryCodePrefix, mainCard.moduleId]);

  // Handle auto-selecting first registered item when opening form
  useEffect(() => {
    if (relevantItems.length > 0 && !formItemCode) {
      const first = relevantItems[0];
      setFormItemCode(first.item_code);
      setFormPartName(first.description);
      setFormPartNumber(first.item_code);
      setFormSupplierOrLine(first.series || (mainCard.moduleId === 'in-process' ? 'Production Line Station 01' : 'Certified Supplier Partner'));
    }
  }, [relevantItems, formItemCode, mainCard.moduleId]);

  // Calculation of deviation
  const measuredNum = parseFloat(formMeasured) || 0;
  const nominalNum = parseFloat(formNominal) || 0;
  const deviation = measuredNum - nominalNum;
  const tolMinNum = parseFloat(formTolMin) || 0;
  const tolMaxNum = parseFloat(formTolMax) || 0;
  const isWithinTol = measuredNum >= tolMinNum && measuredNum <= tolMaxNum;

  // Handle Form Submission
  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartName.trim()) return;

    const newId = `INS-${categoryCodePrefix}-${Date.now().toString().slice(-4)}`;
    const newRecord: InspectionRecord = {
      id: newId,
      lotNumber: formLotNumber,
      batchId: formBatchId,
      partNumber: formPartNumber || formItemCode || `${categoryCodePrefix}-PART-01`,
      partName: formPartName,
      module: (mainCard.moduleId as any) || 'incoming',
      supplierOrLine: formSupplierOrLine || 'Quality Audited Station',
      nominalValue: nominalNum,
      toleranceMin: tolMinNum,
      toleranceMax: tolMaxNum,
      measuredValue: measuredNum,
      unit: formUnit,
      status: formStatus,
      defectSeverity: formStatus === 'pass' ? 'none' : formDefectSeverity,
      defectType: formStatus === 'pass' ? undefined : (formDefectType || 'Tolerance Deviation'),
      inspectorId: userId || 'QA-8941',
      inspectorName: `Inspector ${userId || 'QA-8941'}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes: formNotes || `Inspection completed for ${childCard.name}. Specification standard verified. Status: ${formStatus.toUpperCase()}.`,
      verifiedBy: `Lead Auditor ${userId || 'QA-8941'}`,
      category: childCard.name,
    };

    // Add to local category records list so it immediately appears in past records
    setLocalRecords(prev => [newRecord, ...prev]);

    // Also notify root App state if provided
    if (onAddInspectionRecord) {
      onAddInspectionRecord(newRecord);
    }

    setLastSubmittedId(newId);
    setSubmissionSuccess(true);
  };

  const handleResetForAnother = () => {
    setFormLotNumber(generateNewLot());
    setFormBatchId(`B-${Math.floor(2000 + Math.random() * 8000)}`);
    setFormMeasured(formNominal);
    setFormStatus('pass');
    setFormDefectSeverity('none');
    setFormDefectType('');
    setFormNotes('');
    setSubmissionSuccess(false);
  };

  // Filtered past records for display
  const displayedRecords = useMemo(() => {
    return localRecords.filter(rec => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !q ||
        rec.lotNumber.toLowerCase().includes(q) ||
        rec.partName.toLowerCase().includes(q) ||
        rec.partNumber.toLowerCase().includes(q) ||
        rec.inspectorId.toLowerCase().includes(q) ||
        rec.supplierOrLine.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localRecords, searchQuery, statusFilter]);

  // Metrics for Past Records
  const totalCount = localRecords.length;
  const passCount = localRecords.filter(r => r.status === 'pass').length;
  const failCount = localRecords.filter(r => r.status === 'fail').length;
  const passRate = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : '100.0';

  // =========================================================================
  // RENDER 1: OPERATION SELECTION VIEW (THE TWO CARDS)
  // =========================================================================
  if (currentView === 'operation-cards') {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-6 z-10 max-w-7xl mx-auto min-h-[calc(100vh-7rem)] animate-in fade-in duration-300">
        
        {/* Top Header & Breadcrumbs */}
        <div className="w-full max-w-5xl flex flex-col items-center text-center mb-8">
          
          {/* Breadcrumb Trail */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 text-slate-600 text-xs font-semibold mb-5 border border-slate-200/80 shadow-2xs">
            <span 
              onClick={onBackToChildCards} 
              className="hover:text-blue-600 cursor-pointer transition-colors"
            >
              {mainCard.name}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-700 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              {childCard.name}
            </span>
          </div>

          {/* Child Card Icon & Heading */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-4 ring-white">
              <InspectionCardIconRenderer iconName={childCard.iconName} className="w-8 h-8 stroke-[1.9]" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                {childCard.name}
              </h1>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* THE TWO OPERATION CARDS (Smaller, Compact & Neatly Sized)         */}
        {/* 1. Make New Inspection                                            */}
        {/* 2. View Past Inspection Records                                   */}
        {/* ================================================================= */}
        <div className="w-full max-w-xl mx-auto my-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          
          {/* CARD 1: MAKE TO NEW INSPECTION */}
          <div
            onClick={() => setCurrentView('new-inspection')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentView('new-inspection');
              }
            }}
            className="portal-glass-card rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center justify-between relative group transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer select-none border border-slate-200/90 hover:border-blue-400 bg-white/95 focus:outline-none focus:ring-3 focus:ring-blue-500/20"
            id="card-make-new-inspection"
          >
            <div className="flex flex-col items-center w-full py-2">
              {/* Icon Container */}
              <div className="relative mb-3.5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-2xs group-hover:shadow-blue-500/25">
                  <ClipboardCheck className="w-7 h-7 stroke-[1.9]" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-2xs group-hover:scale-110 transition-transform" />
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                Make New Inspection
              </h2>
            </div>

            {/* Primary Action Button */}
            <div className="w-full mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentView('new-inspection');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
                id="btn-open-make-new-inspection"
              >
                <span>Make New Inspection</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* CARD 2: VIEW PAST INSPECTION RECORDS */}
          <div
            onClick={() => setCurrentView('past-records')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentView('past-records');
              }
            }}
            className="portal-glass-card rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center justify-between relative group transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer select-none border border-slate-200/90 hover:border-indigo-400 bg-white/95 focus:outline-none focus:ring-3 focus:ring-indigo-500/20"
            id="card-view-past-inspection-records"
          >
            <div className="flex flex-col items-center w-full py-2">
              {/* Icon Container */}
              <div className="relative mb-3.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shadow-2xs group-hover:shadow-indigo-500/25">
                  <History className="w-7 h-7 stroke-[1.9]" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full shadow-2xs group-hover:scale-110 transition-transform" />
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                View Past Inspection Records
              </h2>
            </div>

            {/* Primary Action Button */}
            <div className="w-full mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentView('past-records');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm shadow-indigo-500/25 flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
                id="btn-open-view-past-records"
              >
                <span>View Past Inspection Records</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Back Button */}
        <div className="w-full flex justify-center pt-2">
          <button
            onClick={onBackToChildCards}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-xs sm:text-sm shadow-sm border border-slate-200/80 backdrop-blur-md transition-all cursor-pointer group hover:shadow-md"
            id="btn-back-to-child-cards"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to {mainCard.name} Categories</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: MAKE NEW INSPECTION VIEW
  // =========================================================================
  if (currentView === 'new-inspection') {
    // 1. Live Interactive Deployed Form View if a deployed form was chosen
    if (selectedDeployedForm) {
      return (
        <DeployedInspectionFormView
          form={selectedDeployedForm}
          mainCard={mainCard}
          childCard={childCard}
          userId={userId}
          onBackToList={() => setSelectedDeployedForm(null)}
          onSubmitRecord={(record) => {
            setLocalRecords(prev => [record, ...prev]);
            if (onAddInspectionRecord) onAddInspectionRecord(record);
            setSelectedRecordForModal(record);
          }}
        />
      );
    }

    // 2. Standard Single Checkpoint Form if inspector toggled it
    if (showStandardFallbackForm) {
      return (
        <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-6 z-10 max-w-5xl mx-auto min-h-[calc(100vh-7rem)] animate-in fade-in duration-300">
          
          {/* Breadcrumbs Navigation */}
          <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <button 
                onClick={onBackToChildCards}
                className="hover:text-blue-600 cursor-pointer transition-colors"
              >
                {mainCard.name}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button 
                onClick={() => setCurrentView('operation-cards')}
                className="hover:text-blue-600 cursor-pointer transition-colors"
              >
                {childCard.name}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button 
                onClick={() => setShowStandardFallbackForm(false)}
                className="hover:text-blue-600 cursor-pointer transition-colors"
              >
                Make New Inspection
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-blue-700 font-bold">
                Standard Form
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowStandardFallbackForm(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Back to Deployed Forms List</span>
              </button>
              <button
                onClick={() => setCurrentView('past-records')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>View Past Records ({totalCount})</span>
              </button>
            </div>
          </div>

        {/* Smaller Two Operation Cards Switcher */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl border-2 border-blue-600 bg-blue-50/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ClipboardCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-blue-900">Make New Inspection</p>
                <p className="text-[11px] text-blue-600 font-medium">Currently Active Form</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">Active</span>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('past-records')}
            className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-indigo-50/50 hover:border-indigo-300 shadow-xs flex items-center justify-between transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <History className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">View Past Inspection Records</p>
                <p className="text-[11px] text-slate-500 font-medium">{totalCount} Past Records</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 flex items-center gap-1 transition-colors">
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden mb-8">
          
          {/* Header Banner */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
                <InspectionCardIconRenderer iconName={childCard.iconName} className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Record New Inspection
                  </h2>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white">
                    {childCard.name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1">
                  Quality Audit Standard: ISO 2859-1 Level II • Verified by Auditor: <span className="font-mono font-bold">{userId || 'QA-8941'}</span>
                </p>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-right">
              <span className="text-[10px] text-blue-200 uppercase font-bold block">Generated Audit ID</span>
              <span className="font-mono text-xs font-extrabold text-white">{formLotNumber}</span>
            </div>
          </div>

          {/* Submission Success Banner */}
          {submissionSuccess && (
            <div className="p-6 bg-emerald-50 border-b border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-900">
                    Inspection Certified & Saved Successfully!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Audit ID <strong className="font-mono">{lastSubmittedId}</strong> has been logged to the inspection database and verified for {childCard.name}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs transition cursor-pointer shadow-2xs"
                >
                  Make Another Inspection
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('past-records')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  View in Past Records →
                </button>
              </div>
            </div>
          )}

          {/* Actual Form */}
          <form onSubmit={handleSubmitInspection} className="p-6 sm:p-8 space-y-7">
            
            {/* SECTION 1: Item & Lot Information */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>1. Item Identification & Batch Tracking</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {isLoadingItems ? 'Connecting to database...' : `${relevantItems.length} registered items available`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Registered Part Select from Supabase */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Select Part Name / Registered Item
                  </label>
                  {isLoadingItems ? (
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 animate-pulse">
                      Loading registered parts from Supabase...
                    </div>
                  ) : (
                    <select
                      value={formItemCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setFormItemCode(code);
                        const found = dbItems.find(it => it.item_code === code);
                        if (found) {
                          setFormPartName(found.description);
                          setFormPartNumber(found.item_code);
                          setFormSupplierOrLine(found.series || 'Certified Partner Supply');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value="" disabled>-- Select Registered Component / Item --</option>
                      {relevantItems.map((it) => (
                        <option key={it.item_code} value={it.item_code}>
                          {it.description} ({it.item_code}) {it.series ? `• ${it.series}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Part Number / Code */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Part / Item Number
                  </label>
                  <input
                    type="text"
                    value={formPartNumber}
                    onChange={(e) => setFormPartNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    placeholder="e.g. AL-6061-PIN"
                  />
                </div>

                {/* Lot Number */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Inspection Lot Number
                  </label>
                  <input
                    type="text"
                    value={formLotNumber}
                    onChange={(e) => setFormLotNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Batch ID */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Production Batch ID
                  </label>
                  <input
                    type="text"
                    value={formBatchId}
                    onChange={(e) => setFormBatchId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Supplier or Assembly Line */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {mainCard.moduleId === 'in-process' ? 'Workstation / Cell' : 'Supplier / Vendor'}
                  </label>
                  <input
                    type="text"
                    value={formSupplierOrLine}
                    onChange={(e) => setFormSupplierOrLine(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    placeholder="e.g. Line 02 / Premier Supply Ltd"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Test Parameters & Measurements */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>2. Measurement Criteria & Specification Tolerances</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Test Parameter Description */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Inspection Test Parameter / Characteristic
                  </label>
                  <input
                    type="text"
                    value={formParameter}
                    onChange={(e) => setFormParameter(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    placeholder="e.g. Outer Diameter Dimension Tolerance / Continuity Test"
                  />
                </div>

                {/* Nominal Value */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Nominal Target Spec
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formNominal}
                    onChange={(e) => setFormNominal(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Tolerance Min */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tolerance Lower Limit (Min)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formTolMin}
                    onChange={(e) => setFormTolMin(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Tolerance Max */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tolerance Upper Limit (Max)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formTolMax}
                    onChange={(e) => setFormTolMax(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Measurement Unit */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Engineering Unit
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="mm">mm (Millimeters)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="V">V (Volts)</option>
                    <option value="mA">mA (MilliAmps)</option>
                    <option value="ohm">Ω (Resistance)</option>
                    <option value="N·m">N·m (Torque)</option>
                    <option value="pcs">pcs (Count)</option>
                    <option value="lux">lux (Luminous Flux)</option>
                  </select>
                </div>

                {/* Measured Value & Live Feedback */}
                <div className="sm:col-span-2 lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block mb-1.5">
                        Actual Measured Value ({formUnit})
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={formMeasured}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormMeasured(val);
                          const num = parseFloat(val);
                          if (!isNaN(num)) {
                            if (num >= tolMinNum && num <= tolMaxNum) {
                              setFormStatus('pass');
                              setFormDefectSeverity('none');
                            } else {
                              setFormStatus('fail');
                              setFormDefectSeverity('minor');
                            }
                          }
                        }}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-white text-base font-mono font-extrabold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    </div>

                    {/* Live Variance Calculation */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-500">Calculated Variance (Δ):</span>
                        <span className={`font-mono font-extrabold ${deviation === 0 ? 'text-slate-800' : deviation > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                          {deviation > 0 ? `+${deviation.toFixed(3)}` : deviation.toFixed(3)} {formUnit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-500">Tolerance Conformance:</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                          isWithinTol 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isWithinTol ? 'Within Tolerance Limits ✅' : 'Out of Tolerance Spec ⚠️'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 3: Conformance & Sign-Off */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>3. QA Assessment & Certification Sign-Off</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                
                {/* Status Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Final Quality Determination
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => {
                      const st = e.target.value as QAStatus;
                      setFormStatus(st);
                      if (st === 'pass') {
                        setFormDefectSeverity('none');
                        setFormDefectType('');
                      } else {
                        setFormDefectSeverity('minor');
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs ${
                      formStatus === 'pass' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}
                  >
                    <option value="pass">PASS - Certified Conforming</option>
                    <option value="fail">FAIL - Non-Conforming / Deviant</option>
                    <option value="pending">PENDING - Quarantine Review</option>
                  </select>
                </div>

                {/* Defect Severity */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Severity Level
                  </label>
                  <select
                    value={formDefectSeverity}
                    onChange={(e) => setFormDefectSeverity(e.target.value as DefectSeverity)}
                    disabled={formStatus === 'pass'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="none">None (Conforming)</option>
                    <option value="minor">Minor Tolerance Deviation</option>
                    <option value="major">Major Defect (Hold Lot)</option>
                    <option value="critical">Critical Safety / Dimension Fail</option>
                  </select>
                </div>

                {/* Inspector ID */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Auditor / Inspector ID
                  </label>
                  <input
                    type="text"
                    value={userId || 'QA-8941'}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-700 shadow-2xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Inspection Remarks & Certificate Notes
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  placeholder={`Add inspection comments, caliper optical verification details, or material testing remarks for ${childCard.name}...`}
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentView('operation-cards')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                Cancel & Return to Operations
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  id="btn-submit-inspection-form"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm & Save Inspection</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    );
  }

  // 3. DEFAULT FOR "MAKE NEW INSPECTION": DEPLOYED FORMS LIST
  // User Requirement: "When i clicked make new inspection button redirect new page and need to show deployed Form as list."
  // "And it save as Product Type in the form header."
  // 3. DEFAULT FOR "MAKE NEW INSPECTION": DEPLOYED FORMS LIST
  // Only shows forms deployed to this category, in a clean list with only Product Type name and button
  const currentListForms = deployedForms;

  return (
    <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-6 z-10 max-w-5xl mx-auto min-h-[calc(100vh-7rem)] animate-in fade-in duration-300">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button 
            onClick={onBackToChildCards}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            {mainCard.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button 
            onClick={() => setCurrentView('operation-cards')}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            {childCard.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-700 font-bold">
            Make New Inspection
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowStandardFallbackForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Launch Standard Quick Inspection Form"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Standard Quick Form</span>
          </button>
          <button
            onClick={() => setCurrentView('past-records')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>View Past Records ({totalCount})</span>
          </button>
          <button
            onClick={() => setCurrentView('operation-cards')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Operations Cards</span>
          </button>
        </div>
      </div>

      {/* DEPLOYED FORMS LIST (Shows ONLY Product Type name and button) */}
      <div className="w-full">
        {currentListForms.length === 0 ? (
          <div className="w-full py-12 px-6 text-center bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center shadow-xs">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
              No forms deployed for {childCard.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-md">
              Deploy inspection forms from the Form Generator to see them listed here.
            </p>
            <button
              type="button"
              onClick={() => setShowStandardFallbackForm(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Use Standard Quick Form
            </button>
          </div>
        ) : (
          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-200">
            {currentListForms.map((form) => {
              const productTypeName = form.productType || form.documentHeader?.productType || childCard.name;

              return (
                <div
                  key={form.id}
                  className="px-6 py-4.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  {/* ONLY Product Type Name */}
                  <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {productTypeName}
                  </span>

                  {/* ONLY Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedDeployedForm(form)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>Start Inspection</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

  // =========================================================================
  // RENDER 3: VIEW PAST INSPECTION RECORDS
  // =========================================================================
  return (
    <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-6 z-10 max-w-7xl mx-auto min-h-[calc(100vh-7rem)] animate-in fade-in duration-300">
      
      {/* Breadcrumbs Navigation */}
      <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button 
            onClick={onBackToChildCards}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            {mainCard.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button 
            onClick={() => setCurrentView('operation-cards')}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            {childCard.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-indigo-700 font-bold">
            Past Inspection Records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('new-inspection')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            id="btn-records-make-new-inspection"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Make New Inspection</span>
          </button>
          <button
            onClick={() => setCurrentView('operation-cards')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Operations Cards</span>
          </button>
        </div>
      </div>

      {/* Smaller Two Operation Cards Switcher */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setCurrentView('new-inspection')}
          className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-blue-50/50 hover:border-blue-300 shadow-xs flex items-center justify-between transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <ClipboardCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Make New Inspection</p>
              <p className="text-[11px] text-slate-500 font-medium">New Quality Audit</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
            <span>Open</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>

        <div className="p-3.5 rounded-2xl border-2 border-indigo-600 bg-indigo-50/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <History className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-indigo-900">View Past Inspection Records</p>
              <p className="text-[11px] text-indigo-600 font-medium">{totalCount} Total Records</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider">Active</span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <InspectionCardIconRenderer iconName={childCard.iconName} className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Past Inspection Records: {childCard.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Historical audit log, verified lot numbers, measured tolerances, and quality certifications
            </p>
          </div>
        </div>

        <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
          Module: {mainCard.name}
        </span>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Audits</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalCount} Lots</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pass Rate</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{passRate}%</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Deviations / Failures</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{failCount} Batches</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Inspector</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{userId || 'QA-8941'}</span>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="w-full bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lot #, part name, code, auditor..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Records ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('pass')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'pass'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Conforming ({passCount})
          </button>
          <button
            onClick={() => setStatusFilter('fail')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'fail'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Deviations ({failCount})
          </button>
        </div>
      </div>

      {/* Records Table Card */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden mb-8">
        {displayedRecords.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Inspection Records Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No matching records for {childCard.name} with current filters. Click "Make New Inspection" to log the first audit!
            </p>
            <button
              onClick={() => setCurrentView('new-inspection')}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              + Make New Inspection Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Lot / Audit ID</th>
                  <th className="py-3.5 px-4">Component & Part Number</th>
                  <th className="py-3.5 px-4">{mainCard.moduleId === 'in-process' ? 'Workstation' : 'Supplier / Line'}</th>
                  <th className="py-3.5 px-4">Measured Spec</th>
                  <th className="py-3.5 px-4">Audit Status</th>
                  <th className="py-3.5 px-4">Date & Inspector</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRecords.map((record) => (
                  <tr 
                    key={record.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedRecordForModal(record)}
                  >
                    {/* Lot Number */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors">
                          {record.lotNumber}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {record.id} • Batch {record.batchId}
                        </span>
                      </div>
                    </td>

                    {/* Part Name & Code */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col max-w-xs">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {record.partName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {record.partNumber}
                        </span>
                      </div>
                    </td>

                    {/* Supplier / Line */}
                    <td className="py-4 px-4 text-xs font-medium text-slate-600">
                      {record.supplierOrLine}
                    </td>

                    {/* Measured vs Spec */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {record.measuredValue} {record.unit}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Target: {record.nominalValue} ± {(record.toleranceMax - record.nominalValue).toFixed(2)} {record.unit}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {record.status === 'pass' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pass</span>
                        </span>
                      ) : record.status === 'fail' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Defect</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Date & Inspector */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700 font-medium">
                          {record.timestamp.slice(0, 10)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {record.inspectorId}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecordForModal(record);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition cursor-pointer"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Navigation Buttons */}
      <div className="w-full flex items-center justify-center gap-3">
        <button
          onClick={() => setCurrentView('operation-cards')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-sm border border-slate-200 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Operations Cards</span>
        </button>

        <button
          onClick={onBackToChildCards}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
        >
          <span>Back to {mainCard.name} Categories</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* CERTIFICATE OF CONFORMANCE / AUDIT REPORT MODAL                   */}
      {/* ================================================================= */}
      {selectedRecordForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Official QA Inspection Report</h3>
                  <span className="font-mono text-xs text-blue-300">
                    Certificate ID: {selectedRecordForModal.id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecordForModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Product Info Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lot & Component</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                    selectedRecordForModal.status === 'pass'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedRecordForModal.status === 'pass' ? 'Conforming (PASS)' : 'Non-Conforming (FAIL)'}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">{selectedRecordForModal.partName}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Part #: {selectedRecordForModal.partNumber}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Inspection Lot</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRecordForModal.lotNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Production Batch</span>
                    <span className="font-mono font-bold text-slate-800">{selectedRecordForModal.batchId}</span>
                  </div>
                </div>
              </div>

              {/* Measured Specification Details */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nominal Spec</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                    {selectedRecordForModal.nominalValue} {selectedRecordForModal.unit}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tolerance Range</span>
                  <span className="font-mono font-semibold text-slate-700 text-xs mt-1 block">
                    {selectedRecordForModal.toleranceMin} - {selectedRecordForModal.toleranceMax} {selectedRecordForModal.unit}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Measured Value</span>
                  <span className="font-mono font-extrabold text-blue-900 text-sm mt-0.5 block">
                    {selectedRecordForModal.measuredValue} {selectedRecordForModal.unit}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Quality Remarks & Inspector Notes
                </span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedRecordForModal.notes || 'No deviations noted. Sample complies with engineering drawing.'}
                </p>
              </div>

              {/* Auditor Sign-off stamp */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Audited By</span>
                  <span className="font-bold text-slate-800">{selectedRecordForModal.inspectorName || selectedRecordForModal.inspectorId}</span>
                  <span className="text-slate-400 block text-[10px]">{selectedRecordForModal.timestamp}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase text-center">
                  QA Certified Stamp
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecordForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
