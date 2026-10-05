import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Box, 
  ClipboardCheck, 
  Building2,
  FileCheck2,
  SlidersHorizontal,
  UploadCloud,
  Check
} from 'lucide-react';
import { InspectionRecord, InspectionModule, QAStatus, DefectSeverity } from '../types';

interface LiveInspectionWorkspaceProps {
  currentModule: InspectionModule;
  onSelectModule: (mod: InspectionModule) => void;
  inspections: InspectionRecord[];
  onAddInspection: (item: InspectionRecord) => void;
  onUpdateStatus: (id: string, newStatus: QAStatus) => void;
  onOpenIncomingPortal?: () => void;
  onOpenInProcessPortal?: () => void;
}

export const LiveInspectionWorkspace: React.FC<LiveInspectionWorkspaceProps> = ({
  currentModule,
  onSelectModule,
  inspections,
  onAddInspection,
  onUpdateStatus,
  onOpenIncomingPortal,
  onOpenInProcessPortal,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QAStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | DefectSeverity>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Inspection Form State
  const [formPartName, setFormPartName] = useState('Precision CNC Bushing');
  const [formPartNumber, setFormPartNumber] = useState('BSH-450-TI');
  const [formLotNumber, setFormLotNumber] = useState(`LOT-2026-${Math.floor(8950 + Math.random() * 100)}`);
  const [formNominal, setFormNominal] = useState('50.00');
  const [formTolMin, setFormTolMin] = useState('49.95');
  const [formTolMax, setFormTolMax] = useState('50.05');
  const [formMeasured, setFormMeasured] = useState('50.02');
  const [formNotes, setFormNotes] = useState('Digital vernier optical test passed nominal spec.');
  const [formSeverity, setFormSeverity] = useState<DefectSeverity>('none');

  // Filtered Inspections for the active module
  const moduleInspections = useMemo(() => {
    return inspections.filter(item => item.module === currentModule);
  }, [inspections, currentModule]);

  // Apply search & status filters
  const filteredInspections = useMemo(() => {
    return moduleInspections.filter(item => {
      const matchesSearch = 
        item.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplierOrLine.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || item.defectSeverity === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [moduleInspections, searchQuery, statusFilter, severityFilter]);

  // Calculate Metrics
  const totalCount = moduleInspections.length;
  const passCount = moduleInspections.filter(i => i.status === 'pass').length;
  const failCount = moduleInspections.filter(i => i.status === 'fail').length;
  const pendingCount = moduleInspections.filter(i => i.status === 'pending').length;
  const yieldRate = totalCount > 0 ? ((passCount / (totalCount - pendingCount || 1)) * 100).toFixed(1) : '100.0';
  const criticalDefects = moduleInspections.filter(i => i.defectSeverity === 'critical').length;

  // Pagination
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInspections.slice(start, start + itemsPerPage);
  }, [filteredInspections, currentPage, itemsPerPage]);

  // Simulate FastAPI/Flask JSON Export
  const handleExportFastAPI = () => {
    const payload = {
      source: "ABC_COMPANY_PVT_LTD_QA_SYSTEM",
      export_timestamp: new Date().toISOString(),
      module_type: currentModule,
      fastapi_endpoint_target: "/api/v1/qa/inspection-sync",
      batch_summary: {
        total_inspections: totalCount,
        pass_count: passCount,
        fail_count: failCount,
        pending_count: pendingCount,
        yield_rate_percent: parseFloat(yieldRate),
      },
      records: filteredInspections,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `qa_inspection_${currentModule}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSyncNotice('FastAPI-ready JSON exported successfully!');
    setTimeout(() => setSyncNotice(''), 3500);
  };

  // Simulate Cloud Sync
  const handleSyncCloud = () => {
    setIsSyncing(true);
    setSyncNotice('Synchronizing batches with Python FastAPI backend...');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice('FastAPI synchronization completed: 200 OK');
      setTimeout(() => setSyncNotice(''), 3000);
    }, 900);
  };

  // Submit Modal
  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const measuredNum = parseFloat(formMeasured) || 0;
    const tolMinNum = parseFloat(formTolMin) || 0;
    const tolMaxNum = parseFloat(formTolMax) || 0;

    let autoStatus: QAStatus = 'pass';
    if (measuredNum < tolMinNum || measuredNum > tolMaxNum) {
      autoStatus = 'fail';
    }

    const newRecord: InspectionRecord = {
      id: `INS-${Math.floor(9050 + Math.random() * 500)}`,
      lotNumber: formLotNumber,
      batchId: `B-${Math.floor(7800 + Math.random() * 200)}`,
      partNumber: formPartNumber,
      partName: formPartName,
      module: currentModule,
      supplierOrLine: currentModule === 'incoming' 
        ? 'Apex Raw Materials Ltd' 
        : currentModule === 'in-process' 
        ? 'Cell 4 - High Precision Milling' 
        : 'TechFinish Anodizing Corp',
      nominalValue: parseFloat(formNominal) || 50,
      toleranceMin: tolMinNum,
      toleranceMax: tolMaxNum,
      measuredValue: measuredNum,
      unit: 'mm',
      status: autoStatus,
      defectType: autoStatus === 'fail' ? 'Dimensional Out-Of-Tolerance' : undefined,
      defectSeverity: autoStatus === 'fail' ? formSeverity === 'none' ? 'major' : formSeverity : 'none',
      inspectorId: 'QA-8941',
      inspectorName: 'Marcus Vance',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes: formNotes,
      verifiedBy: autoStatus === 'pass' ? 'Lead AD-1004' : undefined,
    };

    onAddInspection(newRecord);
    setIsModalOpen(false);
    setSyncNotice(`Inspection recorded: ${newRecord.partNumber} [${newRecord.status.toUpperCase()}]`);
    setTimeout(() => setSyncNotice(''), 4000);
  };

  const getModuleTitle = () => {
    switch (currentModule) {
      case 'incoming': return 'Incoming Raw Material & Component Inspection';
      case 'in-process': return 'Online / In-Process Assembly Line QA Verification';
      case 'subcontracting': return 'Subcontracted Batches & Surface Treatment Audit';
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col max-w-7xl mx-auto px-3 sm:px-6 py-4 z-10 space-y-6">
      {/* Top Banner & Module Selector */}
      <div className="portal-glass-card rounded-3xl p-5 sm:p-6 border border-white/95 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-100 text-blue-800 border border-blue-200">
                ACTIVE WORKBENCH
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                FastAPI Stream: <span className="text-emerald-600">CONNECTED</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {getModuleTitle()}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live batch tolerance validation, automated pass/fail qualification, and defect quarantine tracking.
            </p>
          </div>

          {/* Module Switcher Buttons */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1 border border-slate-200/70 self-start lg:self-center">
            <button
              onClick={() => { onSelectModule('incoming'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentModule === 'incoming'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4 text-blue-600" />
              <span>Incoming</span>
            </button>

            <button
              onClick={() => { onSelectModule('in-process'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentModule === 'in-process'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span>In-Process</span>
            </button>

            <button
              onClick={() => { onSelectModule('subcontracting'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentModule === 'subcontracting'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Subcontracting</span>
            </button>
          </div>
        </div>

        {/* Incoming Categories Gateway Bar */}
        {currentModule === 'incoming' && onOpenIncomingPortal && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="font-bold text-slate-800">
                Incoming Inspection Categories:
              </span>
              <span className="text-slate-600 hidden md:inline">
                Raw Material, LED, Fan, Protection, Subcontractor SF/FG, Packing Items, Others
              </span>
            </div>
            <button
              onClick={onOpenIncomingPortal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer self-start sm:self-auto"
              id="btn-switch-to-incoming-portal"
            >
              <span>View Incoming Category Portal</span>
              <Box className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Online/In-Process Categories Gateway Bar */}
        {currentModule === 'in-process' && onOpenInProcessPortal && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="font-bold text-slate-800">
                Online / In-Process Categories:
              </span>
              <span className="text-slate-600 hidden md:inline">
                Automation, White Series, Modular/Nature, LED, Injection Molding
              </span>
            </div>
            <button
              onClick={onOpenInProcessPortal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer self-start sm:self-auto"
              id="btn-switch-to-inprocess-portal"
            >
              <span>View In-Process Category Portal</span>
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Sync notification toast */}
        {syncNotice && (
          <div className="mt-4 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-blue-600" />
            <span>{syncNotice}</span>
          </div>
        )}
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Batch Yield */}
        <div className="portal-glass-card rounded-2xl p-4 sm:p-5 border border-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Quality Yield Rate</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
              Target: 98.0%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {yieldRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {parseFloat(yieldRate) >= 98.0 ? 'Optimal' : 'Investigate'}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                parseFloat(yieldRate) >= 98 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(parseFloat(yieldRate), 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Pass Count */}
        <div className="portal-glass-card rounded-2xl p-4 sm:p-5 border border-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Passed Inspections</span>
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              {passCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">units certified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Zero critical deviations logged</p>
        </div>

        {/* Card 3: Fail Count */}
        <div className="portal-glass-card rounded-2xl p-4 sm:p-5 border border-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Defects / Rejections</span>
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {failCount}
            </span>
            <span className="text-xs font-semibold text-rose-500">
              ({criticalDefects} Critical)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Quarantined for engineering review</p>
        </div>

        {/* Card 4: Pending Inspections */}
        <div className="portal-glass-card rounded-2xl p-4 sm:p-5 border border-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Sign-off</span>
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {pendingCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">in queue</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Awaiting lab coupon verification</p>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="portal-glass-card rounded-2xl p-4 border border-white/95 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by Part #, Lot ID, Component, or Line..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
          />
        </div>

        {/* Filters and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-700">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setStatusFilter('pass'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'pass' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pass
            </button>
            <button
              onClick={() => { setStatusFilter('fail'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'fail' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Defect
            </button>
            <button
              onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'pending' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending
            </button>
          </div>

          {/* New Inspection Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer"
            id="btn-log-inspection"
          >
            <Plus className="w-4 h-4" />
            <span>Log Inspection</span>
          </button>

          {/* Sync FastAPI Button */}
          <button
            onClick={handleSyncCloud}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition cursor-pointer"
            title="Trigger Python FastAPI synchronization"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Sync API</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={handleExportFastAPI}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition cursor-pointer"
            title="Download formatted JSON payload"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>

      {/* Main Inspection Data Table */}
      <div className="portal-glass-card rounded-3xl overflow-hidden border border-white/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Lot / Batch ID</th>
                <th className="py-3.5 px-4">Part & Specification</th>
                <th className="py-3.5 px-4">Target vs Measured</th>
                <th className="py-3.5 px-4 text-center">Status Tag</th>
                <th className="py-3.5 px-4">Severity / Defect</th>
                <th className="py-3.5 px-4">Inspector & Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No inspection logs matching search or filters for this module.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isOutOfSpec = item.measuredValue < item.toleranceMin || item.measuredValue > item.toleranceMax;
                  const delta = (item.measuredValue - item.nominalValue).toFixed(3);
                  const isPositive = parseFloat(delta) >= 0;

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-blue-50/40 transition-colors group"
                      id={`row-${item.id}`}
                    >
                      {/* Lot / Batch ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">{item.lotNumber}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Batch: {item.batchId}</div>
                      </td>

                      {/* Part Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.partName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.partNumber}</div>
                        <div className="text-[10px] text-blue-600/80 mt-0.5">{item.supplierOrLine}</div>
                      </td>

                      {/* Target vs Measured with Visual Bar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {item.measuredValue} {item.unit}
                          </span>
                          <span 
                            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                              item.status === 'pass' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : item.status === 'fail'
                                ? 'bg-rose-50 text-rose-700 font-bold'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {isPositive ? `+${delta}` : delta}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Nominal: {item.nominalValue} ({item.toleranceMin} ~ {item.toleranceMax})
                        </div>
                      </td>

                      {/* Status Tag (High contrast factory floor color coding) */}
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'pass' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            <span>PASS / APPROVED</span>
                          </span>
                        )}
                        {item.status === 'fail' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                            <span>DEFECT / FAIL</span>
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                            <span>PENDING AUDIT</span>
                          </span>
                        )}
                      </td>

                      {/* Severity / Defect */}
                      <td className="py-3.5 px-4">
                        {item.status === 'fail' ? (
                          <div>
                            <span 
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.defectSeverity === 'critical'
                                  ? 'bg-rose-600 text-white'
                                  : item.defectSeverity === 'major'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {item.defectSeverity}
                            </span>
                            <div className="text-xs text-rose-700 font-medium mt-0.5">
                              {item.defectType || 'Non-conforming spec'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">— Within Tolerance</span>
                        )}
                      </td>

                      {/* Inspector & Timestamp */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{item.inspectorName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.timestamp}</div>
                        {item.verifiedBy && (
                          <div className="text-[10px] text-emerald-600 font-medium">✓ {item.verifiedBy}</div>
                        )}
                      </td>

                      {/* Row Action Controls */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {item.status !== 'pass' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'pass')}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Approve & Certify"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {item.status !== 'fail' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'fail')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Flag as Defect"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => alert(`Inspection Details for Lot ${item.lotNumber}:\n\nPart: ${item.partName}\nNominal: ${item.nominalValue} ${item.unit}\nMeasured: ${item.measuredValue} ${item.unit}\nNotes: ${item.notes || 'No extra notes'}\nSigned by: ${item.verifiedBy || 'Pending verification'}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="View Full Spec Card"
                          >
                            <FileCheck2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900">{filteredInspections.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-slate-900">
              {Math.min(currentPage * itemsPerPage, filteredInspections.length)}
            </strong> of <strong className="text-slate-900">{filteredInspections.length}</strong> recorded lots
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2 font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Inspection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Record Inspection Verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">Module: {getModuleTitle()}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInspection} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Part Name</label>
                  <input
                    type="text"
                    required
                    value={formPartName}
                    onChange={(e) => setFormPartName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Part Number</label>
                  <input
                    type="text"
                    required
                    value={formPartNumber}
                    onChange={(e) => setFormPartNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Lot / Serial Number</label>
                <input
                  type="text"
                  required
                  value={formLotNumber}
                  onChange={(e) => setFormLotNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 font-mono"
                />
              </div>

              {/* Tolerance inputs */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nominal (mm)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formNominal}
                    onChange={(e) => setFormNominal(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Tolerance</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formTolMin}
                    onChange={(e) => setFormTolMin(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Tolerance</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formTolMax}
                    onChange={(e) => setFormTolMax(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono text-slate-700"
                  />
                </div>
              </div>

              {/* Measured Value Input with live calculation indicator */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Actual Measured Value</span>
                  {parseFloat(formMeasured) >= parseFloat(formTolMin) && parseFloat(formMeasured) <= parseFloat(formTolMax) ? (
                    <span className="text-emerald-600 text-xs font-bold">● IN SPECIFICATION (PASS)</span>
                  ) : (
                    <span className="text-rose-600 text-xs font-bold">● OUT OF SPECIFICATION (FAIL)</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={formMeasured}
                  onChange={(e) => setFormMeasured(e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl font-mono font-bold ${
                    parseFloat(formMeasured) >= parseFloat(formTolMin) && parseFloat(formMeasured) <= parseFloat(formTolMax)
                      ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-700'
                  }`}
                />
              </div>

              {/* Defect severity if out of spec */}
              {(parseFloat(formMeasured) < parseFloat(formTolMin) || parseFloat(formMeasured) > parseFloat(formTolMax)) && (
                <div>
                  <label className="block text-xs font-semibold text-rose-700 uppercase mb-1">Defect Severity Level</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as DefectSeverity)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-rose-50/50 border border-rose-300 rounded-xl text-rose-900 font-medium"
                  >
                    <option value="minor">Minor (Non-critical cosmetic/edge burr)</option>
                    <option value="major">Major (Dimensional interference - rework required)</option>
                    <option value="critical">Critical (Safety/Structural failure - immediate quarantine)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Auditor Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Enter observation notes, gauge serial number, calibration status..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/25 transition cursor-pointer"
                >
                  Confirm & Commit to Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
