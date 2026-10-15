import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Layers, 
  Calendar, 
  User, 
  ShieldCheck, 
  AlertTriangle, 
  Paperclip, 
  ChevronRight, 
  Clock, 
  Sparkles,
  ClipboardCheck,
  Tag,
  Database,
  Check
} from 'lucide-react';
import { DeployedInspectionForm } from '../deployedFormsData';
import { InspectionRecord, QAStatus } from '../types';
import { InspectionHierarchyCard } from '../inspectionHierarchyData';
import { TableRowSchema } from './FormEditorStudio';
import { RoundClockTimePickerModal } from './RoundClockTimePickerModal';
import { fetchItems, DbItem, lookupDatabaseItem, SEED_FACTORY_ITEMS } from '../backend/itemService';

interface DeployedInspectionFormViewProps {
  form: DeployedInspectionForm;
  mainCard: InspectionHierarchyCard;
  childCard: InspectionHierarchyCard;
  userId: string;
  initialAuditTime?: string;
  dbItems?: DbItem[];
  onBackToList: () => void;
  onSubmitRecord: (record: InspectionRecord) => void;
}

export const DeployedInspectionFormView: React.FC<DeployedInspectionFormViewProps> = ({
  form,
  mainCard,
  childCard,
  userId,
  initialAuditTime,
  dbItems,
  onBackToList,
  onSubmitRecord,
}) => {
  // Traceability & Audit Metadata
  const categoryPrefix = (childCard.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()) || 'QC';
  const [lotNumber] = useState(`LOT-${categoryPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [batchId, setBatchId] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [auditTime, setAuditTime] = useState<string>(() => {
    if (initialAuditTime && initialAuditTime.trim()) return initialAuditTime.trim();
    const d = new Date();
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const m = Math.round(d.getMinutes() / 5) * 5;
    return `${String(h).padStart(2, '0')}:${String(m >= 60 ? 55 : m).padStart(2, '0')} ${ampm}`;
  });
  const [itemCode, setItemCode] = useState('');
  const [productDesc, setProductDesc] = useState(form.documentHeader.productType || childCard.name);

  // Database items from Supabase with instant fallback catalog (guarantees 559 -> 3000000559 is ready at all times)
  const [itemsList, setItemsList] = useState<DbItem[]>(() => {
    if (dbItems && dbItems.length > 0) return dbItems;
    return SEED_FACTORY_ITEMS;
  });
  const [matchedDbItem, setMatchedDbItem] = useState<DbItem | null>(null);

  // Load items from Supabase database if not passed via props
  useEffect(() => {
    let isMounted = true;
    if (!dbItems || dbItems.length === 0) {
      fetchItems().then(data => {
        if (isMounted && data && data.length > 0) {
          setItemsList(data);
          // If user already typed an item code like "559", re-evaluate lookup with fresh items
          if (itemCode.trim()) {
            const match = lookupDatabaseItem(itemCode, data, childCard.name);
            if (match) {
              setProductDesc(match.description);
              setMatchedDbItem(match);
            }
          }
        }
      }).catch(err => {
        console.error('Failed to fetch items from Supabase:', err);
      });
    } else {
      setItemsList(dbItems);
    }
    return () => { isMounted = false; };
  }, [dbItems]);

  // Handle Item Code Reference change with automatic lookup from the database:
  // e.g. entering "559" automatically matches "3000000559" -> "MSFZ 13- 13A S/Socket Outlet -Wh. Series"
  const handleItemCodeChange = (rawInput: string) => {
    setItemCode(rawInput);
    const trimmed = rawInput.trim();
    if (!trimmed) {
      setMatchedDbItem(null);
      return;
    }

    const match = lookupDatabaseItem(trimmed, itemsList, childCard.name);

    if (match) {
      setProductDesc(match.description);
      setMatchedDbItem(match);
    } else {
      setMatchedDbItem(null);
    }
  };
  
  // Footer and Inspector Signoff (ensure no dummy names or emp numbers)
  const sanitizeName = (val?: string) => {
    if (!val || val === 'H. P. Karunaratne' || val === 'M. Vigneshwaran' || val.includes('Karunaratne') || val.includes('Vigneshwaran')) return '';
    return val;
  };
  const sanitizeEmp = (val?: string) => {
    if (!val || val === 'EMP-4102' || val === 'QC-Lead-09' || val.includes('4102') || val.includes('QC-Lead')) return '';
    return val;
  };

  const [onlineInspectorName, setOnlineInspectorName] = useState(sanitizeName(form.footer?.onlineInspectorName));
  const [onlineEmpNo, setOnlineEmpNo] = useState(sanitizeEmp(form.footer?.onlineEmpNo) || sanitizeEmp(userId) || '');
  const [finalInspectorName, setFinalInspectorName] = useState(sanitizeName(form.footer?.finalInspectorName));
  const [finalEmpNo, setFinalEmpNo] = useState(sanitizeEmp(form.footer?.finalEmpNo));
  const [remarks, setRemarks] = useState(form.footer?.remarks || '');
  
  // Attachments
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; name: string; size: string }>>(
    form.footer?.attachments || []
  );

  // Dynamic values stored for all table rows across all sections
  // Key format: `${sectionId}-${rowId}-${colId}` -> string
  const [cellValues, setCellValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    form.sections.forEach(sec => {
      sec.elements.forEach(el => {
        if (el.tableConfig) {
          el.tableConfig.rows.forEach(r => {
            if (!r.isGroupHeader) {
              el.tableConfig?.columns.forEach(c => {
                const key = `${sec.id}-${r.id}-${c.id}`;
                // Default value from cell, or '--Select--' for dropdown, '' for text field
                if (r.cells[c.id] !== undefined) {
                  initial[key] = r.cells[c.id];
                } else if (c.type === 'dropdown') {
                  initial[key] = '--Select--';
                } else {
                  initial[key] = '';
                }
              });
            }
          });
        }
      });
    });
    return initial;
  });

  // Time headers inside column headers (e.g. time 1 -> '08:30 AM')
  const [columnTimeHeaders, setColumnTimeHeaders] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    form.sections.forEach(sec => {
      sec.elements.forEach(el => {
        if (el.tableConfig) {
          let firstTimeCol = true;
          el.tableConfig.columns.forEach(c => {
            if (c.hasTimeHeader || /time/i.test(c.header)) {
              if (firstTimeCol && initialAuditTime) {
                map[`${sec.id}-${c.id}`] = c.defaultHeaderTime || initialAuditTime;
                firstTimeCol = false;
              } else {
                map[`${sec.id}-${c.id}`] = c.defaultHeaderTime || '';
              }
            }
          });
        }
      });
    });
    return map;
  });

  // 12-hour round clock time picker modal state
  const [activeClockPicker, setActiveClockPicker] = useState<{
    isOpen: boolean;
    timeKey: string;
    headerTitle: string;
    currentValue: string;
  } | null>(null);

  // General field values for non-table elements (e.g. Section 1 data fields)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {};
    form.sections.forEach(sec => {
      if (sec.savedData) {
        Object.assign(vals, sec.savedData);
      }
    });
    // Sanitize dummy data for batch number reference, item code reference, item code
    Object.keys(vals).forEach(k => {
      const v = vals[k] || '';
      if (
        v.startsWith('BATCH-2026-') ||
        v.startsWith('KEV-') ||
        v.startsWith('LOT-LED-') ||
        v.startsWith('ITEM-') ||
        k === 'el-batch' ||
        k === 'el-item-code'
      ) {
        vals[k] = '';
      }
    });
    return vals;
  });

  // Submission state
  const [submitted, setSubmitted] = useState(false);
  const [submittedRecordId, setSubmittedRecordId] = useState('');

  // Handle cell change
  const handleCellChange = (sectionId: string, rowId: string, colId: string, val: string) => {
    setCellValues(prev => ({
      ...prev,
      [`${sectionId}-${rowId}-${colId}`]: val,
    }));
  };

  // Handle file upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const newAtt = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      };
      setAttachedFiles(prev => [...prev, newAtt]);
    }
  };

  // Submit Inspection
  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();

    // Check overall pass/fail status based on any 'Fail' values in dropdown cells
    let hasFailures = false;
    Object.values(cellValues).forEach(v => {
      if (v === 'Fail' || v === 'Reject') hasFailures = true;
    });

    const status: QAStatus = hasFailures ? 'fail' : 'pass';
    const recId = `REC-${categoryPrefix}-${Date.now().toString().slice(-6)}`;

    const newRecord: InspectionRecord = {
      id: recId,
      lotNumber,
      batchId: batchId || `BATCH-${Date.now().toString().slice(-4)}`,
      partNumber: itemCode || (matchedDbItem?.item_code) || `ITEM-${categoryPrefix}-01`,
      partName: productDesc || form.productType || form.documentHeader.productType || childCard.name,
      module: (mainCard.moduleId as any) || 'in-process',
      supplierOrLine: `${childCard.name} Station`,
      nominalValue: 100,
      toleranceMin: 98,
      toleranceMax: 102,
      measuredValue: hasFailures ? 95 : 100,
      unit: '% Yield',
      status,
      defectSeverity: hasFailures ? 'major' : 'none',
      defectType: hasFailures ? 'Tolerance / Dimensional Deviation' : undefined,
      inspectorId: onlineEmpNo || userId || 'QA-8941',
      inspectorName: onlineInspectorName || 'Certified QC Inspector',
      timestamp: new Date().toISOString(),
      notes: remarks || `Verified against standard ${form.documentHeader.refStandard || 'SLS 734'} for ${productDesc || form.productType}.`,
      verifiedBy: finalInspectorName ? `Final Lead: ${finalInspectorName}` : 'QA Lead Signoff',
      category: childCard.name,
    };

    onSubmitRecord(newRecord);
    setSubmittedRecordId(recId);
    setSubmitted(true);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-6 z-10 max-w-6xl mx-auto min-h-[calc(100vh-7rem)] animate-in fade-in duration-300">
      
      {/* Top Breadcrumb Navigation */}
      <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <button 
            type="button"
            onClick={onBackToList}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            {mainCard.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button 
            type="button"
            onClick={onBackToList}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            {childCard.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            type="button"
            onClick={onBackToList}
            className="hover:text-blue-600 cursor-pointer transition-colors"
          >
            Make New Inspection
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-700 font-bold truncate max-w-[200px] sm:max-w-md">
            {form.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to Deployed Forms List</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Print or Save Form as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Submission Success Alert */}
      {submitted && (
        <div className="w-full mb-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-emerald-950">
                Inspection Form Certified &amp; Saved Successfully!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Audit Record <strong className="font-mono">{submittedRecordId}</strong> has been logged into the quality register for Product: <strong>{productDesc || form.productType || form.documentHeader.productType}</strong> (Item Code: <strong className="font-mono">{itemCode || matchedDbItem?.item_code || 'N/A'}</strong>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackToList}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              Done • Return to Forms List &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Full Live Inspection Form Container */}
      <form onSubmit={handleSubmitInspection} className="w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden mb-10">
        
        {/* Form Header Banner - Centered topics layout as previously styled */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-slate-800 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-3">
            {/* Centered Company Name & Department */}
            <div>
              <div className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">
                ABC COMPANY PVT LTD
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                QA &amp; QUALITY ASSURANCE PORTAL • QUALITY MEETS PRECISION
              </div>
            </div>

            {/* Centered Document Title & Deployed Badge */}
            <div className="space-y-2 flex flex-col items-center justify-center text-center w-full">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  {form.documentHeader.documentType || form.name}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white tracking-wide shadow-2xs">
                  Deployed Form
                </span>
              </div>

              {/* Centered Product Description / Type Prominent Badge */}
              <div className="pt-0.5 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/70 border border-red-600/80 text-red-300 text-xs sm:text-sm font-bold shadow-2xs">
                  <Tag className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-slate-300 font-medium">Product Description / Type:</span>
                  <span className="text-white font-extrabold">
                    {productDesc || form.productType || form.documentHeader.productType || childCard.name}
                  </span>
                </div>
              </div>

              {/* Centered Document Meta-Information Line */}
              <div className="text-[11px] text-slate-300 font-medium tracking-wide flex flex-wrap items-center justify-center gap-2 pt-1">
                <span>Destination: <strong className="text-white">{mainCard.name} → {childCard.name}</strong></span>
                <span className="text-slate-600">|</span>
                <span>Doc No: <strong className="font-mono text-white">{form.documentHeader.documentNo || 'F 17/3-2.1'}</strong></span>
                <span className="text-slate-600">|</span>
                <span>Rev: <strong className="font-mono text-white">{form.documentHeader.revisionNo || '04'}</strong></span>
                <span className="text-slate-600">|</span>
                <span>Date: <strong className="text-white">{form.documentHeader.dateOfIssue || '2024-03-20'}</strong></span>
                {form.documentHeader.refStandard && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span>Std: <strong className="font-mono text-white">{form.documentHeader.refStandard}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Centered Controlled Copy and Inspection Status Badges */}
            <div className="flex items-center flex-wrap justify-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-600/80 text-purple-300 text-[11px] font-bold tracking-wider shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>CONTROLLED COPY</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-600/80 text-emerald-300 text-[11px] font-bold tracking-wider shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>ACTIVE INSPECTION LOG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Document Control Meta-Data Table Bar - Centered items */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs text-center items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Doc Number</span>
            <span className="font-mono font-bold text-slate-800">{form.documentHeader.documentNo || 'F 17/3-2.1'}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Date of Issue</span>
            <span className="font-medium text-slate-800">{form.documentHeader.dateOfIssue || '2024-03-20'}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Revision</span>
            <span className="font-mono font-bold text-slate-800">{form.documentHeader.revisionNo || '04'}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Standard</span>
            <span className="font-mono font-bold text-slate-800">{form.documentHeader.refStandard || 'SLS 734'}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Inspection Lot</span>
            <span className="font-mono font-bold text-blue-700">{lotNumber}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Audit Date</span>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-center"
            />
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Inspection Time</span>
            <button
              type="button"
              onClick={() => {
                setActiveClockPicker({
                  isOpen: true,
                  timeKey: 'meta-audit-time',
                  headerTitle: 'Inspection Audit Time',
                  currentValue: auditTime,
                });
              }}
              className="mt-0.5 inline-flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-blue-700 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 cursor-pointer shadow-2xs transition select-none group"
              title="Click to open 12 hrs round clock time picker"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition shrink-0" />
              <span>{auditTime || 'Select Time'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          
          {/* SECTION 1: Item Identification & Batch Tracking */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Section 1: Traceability & Production Batch Identification</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Standard Factory Traceability
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Product Description / Type
                  </label>
                  {matchedDbItem && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Auto-filled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Product Type"
                />
                {matchedDbItem ? (
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1 truncate" title={`${matchedDbItem.series || ''} • ${matchedDbItem.category || ''}`}>
                    <Database className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">Database item ({matchedDbItem.series || childCard.name})</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Auto-fills when entering item code (e.g. 559)
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Item Code Reference
                  </label>
                  <span className="text-[9px] font-mono text-blue-600">
                    Live Lookup
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="db-item-codes-datalist"
                    value={itemCode}
                    onChange={(e) => handleItemCodeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Enter item code (e.g. 559)"
                  />
                  <datalist id="db-item-codes-datalist">
                    {itemsList.slice(0, 50).map(it => (
                      <option key={it.item_code} value={it.item_code}>
                        {it.description}
                      </option>
                    ))}
                  </datalist>
                </div>
                {matchedDbItem ? (
                  <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-in fade-in">
                    <span className="truncate flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{matchedDbItem.item_code}</span>
                    </span>
                    {itemCode.trim() !== matchedDbItem.item_code && (
                      <button
                        type="button"
                        onClick={() => setItemCode(matchedDbItem.item_code)}
                        className="text-emerald-700 hover:text-emerald-950 font-bold underline shrink-0 cursor-pointer text-[9px]"
                        title="Set full 10-digit code"
                      >
                        Set full ({matchedDbItem.item_code})
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Type <strong>559</strong> &rarr; matches 3000000559
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Batch Number Reference
                </label>
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Enter Batch Number Reference"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Inspection Time
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveClockPicker({
                      isOpen: true,
                      timeKey: 'meta-audit-time',
                      headerTitle: 'Inspection Time',
                      currentValue: auditTime,
                    });
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 hover:border-blue-500 text-xs font-mono font-bold text-blue-700 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-2xs transition"
                  title="Click to enter inspection time (12 hrs round clock)"
                >
                  <span>{auditTime || 'Click to select time'}</span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Inspection Standard Reference
                </label>
                <input
                  type="text"
                  defaultValue={form.documentHeader.refStandard || 'SLS 734'}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC SECTIONS & TABLE GRIDS */}
          {form.sections.map((section, sIdx) => {
            // Find table element in section if any
            const tableEl = section.elements.find(el => el.tableConfig);
            const nonTableEls = section.elements.filter(el => !el.tableConfig);

            return (
              <div 
                key={section.id || sIdx}
                className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
              >
                {/* Section Title Header */}
                <div className="bg-slate-100/90 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">
                      {section.sectionNumber || sIdx + 1}
                    </span>
                    <span>{section.title}</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {section.elements.length} Form Elements
                  </span>
                </div>

                {/* Non-table elements if present */}
                {nonTableEls.length > 0 && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/50">
                    {nonTableEls.map(el => (
                      <div key={el.id}>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          {el.name}
                        </label>
                        {el.type === 'date_picker' ? (
                          <input
                            type="date"
                            value={fieldValues[el.id] || inspectionDate}
                            onChange={(e) => setFieldValues({ ...fieldValues, [el.id]: e.target.value })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                          />
                        ) : el.type === 'time_picker' || /time|hour|clock/i.test(el.name) ? (
                          <div
                            onClick={() => {
                              setActiveClockPicker({
                                isOpen: true,
                                timeKey: `field-${el.id}`,
                                headerTitle: el.name,
                                currentValue: fieldValues[el.id] || auditTime || '08:30 AM',
                              });
                            }}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-blue-700 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition"
                            title="Click to open 12 hrs round clock time picker"
                          >
                            <span className="font-mono">{fieldValues[el.id] || auditTime || 'Select Time'}</span>
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={fieldValues[el.id] || ''}
                            onChange={(e) => setFieldValues({ ...fieldValues, [el.id]: e.target.value })}
                            placeholder={el.name}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Table Grid if configured */}
                {tableEl && tableEl.tableConfig && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200/80 text-slate-800 font-bold border-b border-slate-300">
                          {tableEl.tableConfig.columns.map(col => {
                            const timeKey = `${section.id}-${col.id}`;
                            const isTimeCol = col.hasTimeHeader || /time|interval|shift/i.test(col.header);

                            return (
                              <th 
                                key={col.id} 
                                className="px-3.5 py-3 text-center first:text-left last:text-left border-r border-slate-300/80 last:border-r-0"
                                style={{ width: col.width }}
                              >
                                <div>
                                  <span className="block text-[11px] uppercase tracking-wider">{col.header}</span>
                                  {isTimeCol && (
                                    <div 
                                      onClick={() => {
                                        setActiveClockPicker({
                                          isOpen: true,
                                          timeKey,
                                          headerTitle: col.header,
                                          currentValue: columnTimeHeaders[timeKey] || col.defaultHeaderTime || '08:30 AM',
                                        });
                                      }}
                                      className="mt-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 hover:bg-blue-50/40 transition cursor-pointer select-none group"
                                      title={`Click to open 12 hrs round clock time picker for ${col.header}`}
                                    >
                                      <span className="text-[9px] text-slate-500 font-bold font-mono">Time:</span>
                                      <span className="w-16 text-[10px] font-mono font-bold text-center text-blue-700 select-none">
                                        {columnTimeHeaders[timeKey] || col.defaultHeaderTime || '08:30 AM'}
                                      </span>
                                      <span
                                        className="text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition shrink-0 p-0.5"
                                        title="Open 12 hrs round clock time picker"
                                      >
                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {tableEl.tableConfig.rows.map((row) => {
                          if (row.isGroupHeader) {
                            return (
                              <tr key={row.id} className="bg-slate-100 font-bold text-slate-800">
                                <td 
                                  colSpan={tableEl.tableConfig?.columns.length} 
                                  className="px-4 py-2 text-xs uppercase tracking-wider font-extrabold text-blue-900 bg-blue-50/70 border-y border-blue-200"
                                >
                                  {row.groupTitle || 'Group Section'}
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                              {tableEl.tableConfig?.columns.map((col) => {
                                const cellKey = `${section.id}-${row.id}-${col.id}`;
                                const isParamCol = col.id === 'col-param' || col.id === 'col-fi-param' || /parameter/i.test(col.header);
                                const isMicCol = col.id === 'col-mic' || col.id === 'col-fi-mic' || /mic/i.test(col.header);
                                const isSpecCol = col.id === 'col-specs' || col.id === 'col-fi-specs' || /specification/i.test(col.header);
                                const isDropdownCol = col.type === 'dropdown';
                                const isTextInputRow = row.inputType === 'text' || row.inputType === 'number';

                                // Text label columns (MIC NO, Specifications)
                                if (isMicCol) {
                                  return (
                                    <td key={col.id} className="px-3.5 py-2.5 font-mono text-[11px] font-bold text-slate-600 border-r border-slate-200/80">
                                      {row.cells[col.id] || '-'}
                                    </td>
                                  );
                                }

                                if (isParamCol) {
                                  return (
                                    <td key={col.id} className="px-3.5 py-2.5 font-bold text-slate-900 text-xs border-r border-slate-200/80">
                                      <div className="flex items-center justify-between">
                                        <span>{row.cells[col.id] || '-'}</span>
                                        {row.unit && (
                                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold ml-1">
                                            {row.unit}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }

                                if (isSpecCol) {
                                  return (
                                    <td key={col.id} className="px-3.5 py-2.5 text-slate-600 text-[11px] leading-relaxed border-r border-slate-200/80">
                                      {row.cells[col.id] || '-'}
                                    </td>
                                  );
                                }

                                // Interactive input cells: Either dropdown or manual text entry
                                if (isDropdownCol) {
                                  // If this row specifically requires manual text input (e.g. Voltage drop test):
                                  if (isTextInputRow) {
                                    return (
                                      <td key={col.id} className="px-2 py-2 text-center border-r border-slate-200/80">
                                        <input
                                          type="text"
                                          value={cellValues[cellKey] || ''}
                                          onChange={(e) => handleCellChange(section.id, row.id, col.id, e.target.value)}
                                          placeholder={row.unit ? `e.g. 14.5 ${row.unit}` : 'Enter value...'}
                                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                                        />
                                      </td>
                                    );
                                  }

                                  // Standard Dropdown list with --Select--
                                  const options = col.options || ['Pass', 'Fail', 'N/A'];
                                  const currentVal = cellValues[cellKey] || '--Select--';

                                  return (
                                    <td key={col.id} className="px-2 py-2 text-center border-r border-slate-200/80">
                                      <select
                                        value={currentVal}
                                        onChange={(e) => handleCellChange(section.id, row.id, col.id, e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-bold border transition-colors shadow-2xs cursor-pointer ${
                                          currentVal === 'Pass'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            : currentVal === 'Fail'
                                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                                            : 'bg-white text-slate-700 border-slate-300'
                                        }`}
                                      >
                                        <option value="--Select--">--Select--</option>
                                        {options.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    </td>
                                  );
                                }

                                return (
                                  <td key={col.id} className="px-3.5 py-2.5 text-center text-slate-700 border-r border-slate-200/80">
                                    {row.cells[col.id] || '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* ATTACHMENTS & REMARKS SECTION */}
          <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-600" />
                <span>Inspection Remarks & File Attachments</span>
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                Resized for multi-sentence observations
              </span>
            </div>

            {/* Remarks Section resized larger for 1-2+ sentences */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Audit Observations & Remarks (Multi-Sentence)
              </label>
              <textarea
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any non-conformance notes, sample observation details, or assembly line shift remarks here..."
                className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* File attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Attach Technical Reports / Photos</span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachedFiles.map(att => (
                    <div 
                      key={att.id} 
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                      <span>{att.name}</span>
                      <span className="text-[10px] text-slate-400">({att.size})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER SECTION: SIGN-OFF & AUDITOR CREDENTIALS */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Inspection Sign-off & Verification Footer</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                ISO 9001:2015 Approved Signoff
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Online Inspected By */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <span className="text-xs font-bold text-blue-300 block uppercase tracking-wider">
                  Online Inspected By
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Inspector Name
                    </label>
                    <input
                      type="text"
                      value={onlineInspectorName}
                      onChange={(e) => setOnlineInspectorName(e.target.value)}
                      placeholder="Inspector Name"
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      EMP No.
                    </label>
                    <input
                      type="text"
                      value={onlineEmpNo}
                      onChange={(e) => setOnlineEmpNo(e.target.value)}
                      placeholder="EMP No."
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Final Inspected By */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <span className="text-xs font-bold text-indigo-300 block uppercase tracking-wider">
                  Final Inspected By
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Inspector Name
                    </label>
                    <input
                      type="text"
                      value={finalInspectorName}
                      onChange={(e) => setFinalInspectorName(e.target.value)}
                      placeholder="Inspector Name"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      EMP No.
                    </label>
                    <input
                      type="text"
                      value={finalEmpNo}
                      onChange={(e) => setFinalEmpNo(e.target.value)}
                      placeholder="EMP No."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onBackToList}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Deployed Forms List</span>
            </button>

            <div className="w-full sm:w-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Form</span>
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-initial px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                id="btn-submit-deployed-inspection"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Submit & Certify Inspection</span>
              </button>
            </div>
          </div>

        </div>
      </form>

      {/* 12-Hour Round Clock Time Picker Modal */}
      {activeClockPicker && (
        <RoundClockTimePickerModal
          isOpen={activeClockPicker.isOpen}
          title={`Set Time for ${activeClockPicker.headerTitle || 'Interval'}`}
          initialValue={activeClockPicker.currentValue || ''}
          onClose={() => setActiveClockPicker(null)}
          onSelectTime={(newTime) => {
            if (activeClockPicker.timeKey === 'meta-audit-time') {
              setAuditTime(newTime);
            } else if (activeClockPicker.timeKey.startsWith('field-')) {
              const fId = activeClockPicker.timeKey.replace('field-', '');
              setFieldValues(prev => ({ ...prev, [fId]: newTime }));
            } else {
              setColumnTimeHeaders(prev => ({
                ...prev,
                [activeClockPicker.timeKey]: newTime,
              }));
            }
            setActiveClockPicker(null);
          }}
        />
      )}
    </div>
  );
};
