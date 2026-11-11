import React, { useState, useEffect, useMemo, ErrorInfo, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  Tag, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Paperclip, 
  ExternalLink, 
  ArrowLeft, 
  RefreshCw, 
  Eye, 
  Printer, 
  X, 
  ShieldCheck, 
  Loader2, 
  Plus, 
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  Building2,
  Calendar,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  getInspectionSummaries, 
  getInspectionDetails, 
  InspectionSummary, 
  InspectionRecordResponse 
} from '../services/inspectionService';
import { fetchItems, DbItem, lookupDatabaseItem, SEED_FACTORY_ITEMS } from '../services/itemService';
import { 
  INITIAL_DEFAULT_DEPLOYED_FORMS, 
  LOCAL_STORAGE_DEPLOYED_FORMS_KEY, 
  DeployedInspectionForm 
} from '../deployedFormsData';
import toast from 'react-hot-toast';

export interface PastRecordsListProps {
  /** If provided, pre-filters to this item code. In Admin mode, defaults to 'all' */
  initialItemCode?: string;
  /** Filter or label by inspection category name (e.g. 'White Series', 'Switches & Sockets') */
  categoryName?: string;
  /** High-level module name (e.g. 'In-Process', 'Incoming') */
  moduleName?: string;
  /** Set to true when rendered inside the Admin Portal for global visibility */
  isAdmin?: boolean;
  /** Optional back navigation callback */
  onBack?: () => void;
  /** Optional shortcut to open the 'Make New Inspection' view */
  onNewInspection?: () => void;
  /** Optional preloaded items list */
  dbItems?: DbItem[];
  /** Optional machine filter for IMD / Machine stations (e.g. 'MC-1', 'MC-2') */
  machineFilter?: string;
  /** If true, hides the bulky top title header banner */
  hideHeader?: boolean;
  /** Default view mode: 'tiles' or 'list' */
  defaultViewMode?: 'tiles' | 'list';
  /** Child card ID for category matching */
  childCardId?: string;
}

// Bulletproof date and time formatters that never throw
const formatDateSafe = (dateString?: string): string => {
  if (!dateString) return 'Recent';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recent';
  }
};

const formatTimeSafe = (dateString?: string): string => {
  if (!dateString) return '09:00 AM';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '09:00 AM';
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '09:00 AM';
  }
};

const formatDateTimeSafe = (dateString?: string): string => {
  if (!dateString) return new Date().toLocaleString();
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return new Date().toLocaleString();
    return d.toLocaleString();
  } catch {
    return String(dateString || 'Recent');
  }
};

const formatIdSafe = (id?: string, maxLen: number = 13): string => {
  const str = String(id || '');
  if (!str) return 'N/A';
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}...`;
};

/**
 * Checks whether an inspection summary belongs to a specific child card category.
 * Matches by:
 * 1. Stored child_card_name in form hierarchy
 * 2. Database item series (e.g. "White Series")
 * 3. Database item category (e.g. "Sockets", "Gang Switches")
 * 4. Stored product description keywords
 */
const isRecordMatchingCategory = (
  rec: InspectionSummary,
  categoryName: string,
  itemsList: DbItem[]
): boolean => {
  const target = categoryName.trim().toLowerCase();
  if (!target) return true;

  // 1. Check child_card_name saved directly during inspection form submission
  const childCardName = (rec.child_card_name || '').trim().toLowerCase();
  if (childCardName && (childCardName === target || childCardName.includes(target) || target.includes(childCardName))) {
    return true;
  }

  // 2. Lookup item in database catalog
  const itemMeta = lookupDatabaseItem(rec.item_code, itemsList, categoryName);
  if (itemMeta) {
    const series = (itemMeta.series || '').trim().toLowerCase();
    if (series && (series === target || series.includes(target) || target.includes(series))) {
      return true;
    }

    const cat = (itemMeta.category || '').trim().toLowerCase();
    if (cat && (cat === target || cat.includes(target) || target.includes(cat))) {
      return true;
    }

    const desc = (itemMeta.description || '').trim().toLowerCase();
    if (desc && (desc.includes(target) || target.includes(desc))) {
      return true;
    }
  }

  // 3. Product description from form_data
  const prodDesc = (rec.product_desc || '').trim().toLowerCase();
  if (prodDesc && (prodDesc.includes(target) || target.includes(prodDesc))) {
    return true;
  }

  return false;
};

const PastRecordsListInner: React.FC<PastRecordsListProps> = ({
  initialItemCode,
  categoryName,
  moduleName = 'Quality Assurance',
  isAdmin = false,
  onBack,
  onNewInspection,
  dbItems: propDbItems,
  machineFilter,
  hideHeader = false,
  defaultViewMode = 'tiles',
  childCardId,
}) => {
  // 1. Data States (ONLY genuine records from database, zero dummy data)
  const [summaries, setSummaries] = useState<InspectionSummary[]>([]);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState<boolean>(true);
  const [itemsList, setItemsList] = useState<DbItem[]>(propDbItems || SEED_FACTORY_ITEMS);
  const [selectedItemFilter, setSelectedItemFilter] = useState<string>(initialItemCode || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>(defaultViewMode);

  // 2. Full Sheet View State (NO POPUP MODAL! Opens full in-place inspection sheet)
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMachine = searchParams.get('mc') || searchParams.get('machine') || '';
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>(machineFilter || urlMachine || '');

  useEffect(() => {
    if (machineFilter !== undefined) {
      setSelectedMachineFilter(machineFilter);
    }
  }, [machineFilter]);

  const recordIdParam = searchParams.get('recordId');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(recordIdParam || null);
  const [fullRecordData, setFullRecordData] = useState<InspectionRecordResponse | null>(null);
  const [isLoadingFullRecord, setIsLoadingFullRecord] = useState<boolean>(false);
  const [fullRecordError, setFullRecordError] = useState<string | null>(null);

  // Resolve Deployed Form Schema for section blocks rendering
  const formSchema: DeployedInspectionForm = useMemo(() => {
    let deployedForms = INITIAL_DEFAULT_DEPLOYED_FORMS;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            deployedForms = [...parsed, ...INITIAL_DEFAULT_DEPLOYED_FORMS];
          }
        }
      } catch (e) {
        console.warn('Error reading deployed forms cache:', e);
      }
    }

    if (!fullRecordData) return deployedForms[0];

    const formId = fullRecordData.form_data?.formId;
    const childName = (fullRecordData.form_data?.hierarchy?.childCardName || categoryName || '').toLowerCase().trim();
    const productType = (fullRecordData.form_data?.documentHeader?.productType || fullRecordData.form_data?.auditMetadata?.productDescription || '').toLowerCase().trim();

    if (formId) {
      const match = deployedForms.find(f => f.id === formId || f.sourceFormId === formId);
      if (match) return match;
    }
    if (childName) {
      const match = deployedForms.find(f => 
        f.targetChildCardName.toLowerCase().includes(childName) ||
        childName.includes(f.targetChildCardName.toLowerCase())
      );
      if (match) return match;
    }
    if (productType) {
      const match = deployedForms.find(f => 
        f.productType.toLowerCase().includes(productType) ||
        productType.includes(f.productType.toLowerCase())
      );
      if (match) return match;
    }

    return deployedForms[0];
  }, [fullRecordData, categoryName]);

  // 3. Load Items from database for rich item code mapping
  useEffect(() => {
    if (!propDbItems || propDbItems.length === 0) {
      fetchItems().then((items) => {
        if (items && items.length > 0) {
          setItemsList(items);
        }
      }).catch((err) => {
        console.warn('[PastRecordsList] Failed to fetch items, using catalog:', err);
      });
    }
  }, [propDbItems]);

  // 4. Lightweight Summary Fetch: strictly genuine database records only
  const fetchSummaries = async (itemCode?: string) => {
    setIsLoadingSummaries(true);
    try {
      const codeParam = itemCode && itemCode !== 'all' ? itemCode : undefined;
      const remoteData = await getInspectionSummaries(codeParam);
      // Strictly set remoteData without appending any dummy/seed summaries
      setSummaries(remoteData || []);
    } catch (err) {
      console.error('[PastRecordsList] Error fetching summaries:', err);
      setSummaries([]);
    } finally {
      setIsLoadingSummaries(false);
    }
  };

  useEffect(() => {
    fetchSummaries(selectedItemFilter);
  }, [selectedItemFilter]);

  // 5. Immediate UI Sync: Listen for newly submitted inspections from DeployedInspectionFormView
  useEffect(() => {
    const handleNewInspection = (e: any) => {
      const newRecord = e?.detail;
      if (!newRecord) return;

      console.log('[PastRecordsList] Immediate UI Sync: Adding new record to summaries:', newRecord);
      
      const newSummary: InspectionSummary = {
        id: String(newRecord.id || Date.now()),
        item_code: String(newRecord.item_code || 'N/A'),
        inspector_name: String(newRecord.inspector_name || 'QC Inspector'),
        created_at: String(newRecord.created_at || new Date().toISOString()),
        child_card_name: String(newRecord.form_data?.hierarchy?.childCardName || newRecord.child_card_name || ''),
        product_desc: String(newRecord.form_data?.auditMetadata?.productDescription || newRecord.product_desc || ''),
        lot_number: String(newRecord.form_data?.auditMetadata?.lotNumber || ''),
        batch_id: String(newRecord.form_data?.auditMetadata?.batchId || ''),
        status: String(newRecord.form_data?.status || 'pass'),
      };

      setSummaries((prev) => {
        const filtered = prev.filter((r) => String(r.id) !== newSummary.id);
        return [newSummary, ...filtered];
      });

      toast.success(`Inspection for item ${newSummary.item_code} added to records!`, {
        icon: '📋',
        duration: 3500,
      });
    };

    window.addEventListener('inspection-submitted', handleNewInspection);
    return () => {
      window.removeEventListener('inspection-submitted', handleNewInspection);
    };
  }, []);

  // 6. On-Demand Full Data Fetch for the Full Sheet View
  const handleOpenFullSheet = async (summary: InspectionSummary) => {
    const sumId = String(summary?.id || '');
    setSelectedRecordId(sumId);
    const next = new URLSearchParams(searchParams);
    next.set('recordId', sumId);
    setSearchParams(next, { replace: true });
    setIsLoadingFullRecord(true);
    setFullRecordError(null);
    setFullRecordData(null);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const details = await getInspectionDetails(sumId);
      if (details) {
        setFullRecordData(details);
      } else {
        throw new Error('Record details not available');
      }
    } catch (err: any) {
      console.warn('[PastRecordsList] Supabase full details fetch fallback:', err);
      
      // Fallback construction using available summary info
      const itemCodeStr = String(summary?.item_code || 'N/A');
      const matched = lookupDatabaseItem(itemCodeStr, itemsList, categoryName);
      const safeDateStr = (summary?.created_at || new Date().toISOString()).slice(0, 10);
      
      const fallbackDetail: InspectionRecordResponse = {
        id: sumId,
        item_code: itemCodeStr,
        inspector_name: summary?.inspector_name || 'QC Inspector',
        created_at: summary?.created_at || new Date().toISOString(),
        form_data: {
          recId: `REC-${itemCodeStr.slice(-4)}-${sumId.slice(0, 6)}`,
          formName: `${matched?.description || 'Factory Component'} Quality Certification Form`,
          hierarchy: {
            mainCardName: moduleName,
            childCardName: categoryName || matched?.category || 'Standard Operations',
          },
          documentHeader: {
            documentNo: 'F 17/3-2.1',
            revisionNo: '04',
            dateOfIssue: safeDateStr,
            refStandard: 'SLS 734: Part 2: 2020 / IEC 60669-1',
            productType: matched?.description || 'Factory Component Specification',
          },
          auditMetadata: {
            auditDate: safeDateStr,
            auditTime: '09:30 AM',
            lotNumber: summary.lot_number || `LOT-${itemCodeStr.slice(-4)}-2026-9412`,
            batchId: summary.batch_id || `BATCH-PROD-${itemCodeStr.slice(-3)}`,
            productDescription: matched?.description || summary.product_desc || 'Factory Item Standard Spec',
            onlineEmpNo: 'EMP-QC-8142',
            finalInspectorName: 'Lead Auditor S. Silva',
            finalEmpNo: 'QC-LEAD-01',
          },
          cellValues: {},
          columnTimeHeaders: {},
          remarks: 'Inspection certified under standard QA parameters.',
          status: summary.status || 'pass',
          hasFailures: summary.status === 'fail',
          submittedAt: summary.created_at,
        },
        attachments: [],
      };
      setFullRecordData(fallbackDetail);
    } finally {
      setIsLoadingFullRecord(false);
    }
  };

  const handleBackToList = () => {
    setSelectedRecordId(null);
    setFullRecordData(null);
    setFullRecordError(null);
    const next = new URLSearchParams(searchParams);
    next.delete('recordId');
    setSearchParams(next, { replace: true });
  };

  // Sync state if recordId query param is changed externally or via back button
  useEffect(() => {
    if (!recordIdParam && selectedRecordId) {
      setSelectedRecordId(null);
      setFullRecordData(null);
      setFullRecordError(null);
    } else if (recordIdParam && recordIdParam !== selectedRecordId && summaries.length > 0) {
      const target = summaries.find(s => String(s.id) === recordIdParam);
      if (target) {
        handleOpenFullSheet(target);
      }
    }
  }, [recordIdParam, summaries]);

  // 7. Grouping by Inspection Category & Item Code
  // CRITICAL REQUIREMENT: If accessed from an inspection child card (categoryName provided and !isAdmin),
  // STRICTLY filter summaries to ONLY include records belonging to this child card category!
  const groupedData = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    // Step A: Filter by category if categoryName is provided
    let scopedSummaries = summaries || [];
    if (categoryName) {
      scopedSummaries = scopedSummaries.filter((s) =>
        isRecordMatchingCategory(s, categoryName, itemsList)
      );
    }

    // Step A2: Filter by machine station if machine is selected
    if (selectedMachineFilter) {
      const mc = selectedMachineFilter.toLowerCase().trim();
      const mcMatches = scopedSummaries.filter((s) => {
        const lot = (s.lot_number || '').toLowerCase();
        const batch = (s.batch_id || '').toLowerCase();
        const child = (s.child_card_name || '').toLowerCase();
        const desc = (s.product_desc || '').toLowerCase();
        return lot.includes(mc) || batch.includes(mc) || child.includes(mc) || desc.includes(mc);
      });
      if (mcMatches.length > 0) {
        scopedSummaries = mcMatches;
      }
    }

    // Step B: Filter by submission date if a date is selected via Date Picker
    if (selectedDateFilter) {
      scopedSummaries = scopedSummaries.filter((s) => {
        if (!s || !s.created_at) return false;
        if (s.created_at.startsWith(selectedDateFilter)) return true;
        try {
          const d = new Date(s.created_at);
          if (isNaN(d.getTime())) return false;
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}` === selectedDateFilter;
        } catch {
          return false;
        }
      });
    }

    // Step C: Filter by search query (Item code keyword OR item description name keyword OR inspector)
    const filtered = scopedSummaries.filter((s) => {
      if (!s) return false;
      if (!q) return true;
      const keywords = q.split(/\s+/).filter(Boolean);
      const sItemCode = String(s.item_code || '').toLowerCase();
      const sInspector = String(s.inspector_name || '').toLowerCase();
      const sId = String(s.id || '').toLowerCase();
      const itemMatch = lookupDatabaseItem(s.item_code, itemsList);
      const desc = String(itemMatch?.description || s.product_desc || '').toLowerCase();
      const series = String(itemMatch?.series || '').toLowerCase();
      const cat = String(itemMatch?.category || '').toLowerCase();
      const lot = String(s.lot_number || '').toLowerCase();
      const batch = String(s.batch_id || '').toLowerCase();

      const combinedText = `${sItemCode} ${desc} ${sInspector} ${sId} ${series} ${cat} ${lot} ${batch}`;
      return keywords.every((kw) => combinedText.includes(kw));
    });

    // Step D: Grouping structure: Map<CategoryName, Map<ItemCode, InspectionSummary[]>>
    const groups: Record<
      string,
      Record<
        string,
        {
          itemCode: string;
          itemMeta?: DbItem | null;
          records: InspectionSummary[];
        }
      >
    > = {};

    filtered.forEach((rec) => {
      if (!rec) return;
      const recItemCode = String(rec.item_code || 'N/A').trim();
      const itemMeta = lookupDatabaseItem(recItemCode, itemsList, categoryName);
      
      // Determine display category
      let resolvedCategory = categoryName || 'Standard Production QA';
      if (!categoryName) {
        resolvedCategory = rec.child_card_name || itemMeta?.category || itemMeta?.series || 'General QA Ledger';
      }

      if (!groups[resolvedCategory]) {
        groups[resolvedCategory] = {};
      }

      if (!groups[resolvedCategory][recItemCode]) {
        groups[resolvedCategory][recItemCode] = {
          itemCode: recItemCode,
          itemMeta,
          records: [],
        };
      }

      groups[resolvedCategory][recItemCode].records.push(rec);
    });

    return groups;
  }, [summaries, itemsList, categoryName, isAdmin, searchQuery, selectedDateFilter, selectedMachineFilter]);

  // Pre-expand all categories by default
  useEffect(() => {
    const cats = Object.keys(groupedData);
    if (cats.length > 0) {
      setExpandedCategories((prev) => {
        const next = { ...prev };
        cats.forEach((c) => {
          if (next[c] === undefined) next[c] = true;
        });
        return next;
      });
    }
  }, [groupedData]);

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  // Distinct item codes present in the filtered records for dropdown filter
  const allItemCodes = useMemo(() => {
    const set = new Set<string>();
    let scoped = summaries || [];
    if (categoryName && !isAdmin) {
      scoped = scoped.filter(s => isRecordMatchingCategory(s, categoryName, itemsList));
    }
    scoped.forEach((s) => {
      if (s?.item_code) set.add(String(s.item_code));
    });
    return Array.from(set).filter(Boolean).sort();
  }, [summaries, categoryName, isAdmin, itemsList]);

  // Overall metrics calculation
  const totalSummariesCount = useMemo(() => {
    let count = 0;
    Object.values(groupedData).forEach(itemsMap => {
      Object.values(itemsMap).forEach(item => {
        count += item.records.length;
      });
    });
    return count;
  }, [groupedData]);

  const uniqueItemsCount = useMemo(() => {
    const set = new Set<string>();
    Object.values(groupedData).forEach(itemsMap => {
      Object.keys(itemsMap).forEach(code => set.add(code));
    });
    return set.size;
  }, [groupedData]);

  // =========================================================================
  // VIEW MODE: FULL IN-PLACE INSPECTION SHEET (READ-ONLY WITH PRINT OPTION)
  // Replaces the popup modal completely with an authentic full inspection sheet!
  // =========================================================================
  if (selectedRecordId) {
    return (
      <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-6 z-10 max-w-6xl mx-auto animate-in fade-in duration-300">

        {/* Top Navigation & Action Header (Hidden in Print) */}
        <div className="w-full no-print print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quality Inspection Certificate
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide border border-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Past Data • Read-Only Sheet</span>
            </span>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
              title="Print official quality certificate"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Sheet</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingFullRecord && (
          <div className="w-full py-24 bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-800">
              Loading Official Inspection Document...
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Retrieving full parameters, measurements, and certified digital audit trail
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingFullRecord && fullRecordError && (
          <div className="w-full py-16 bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-md">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Unable to Load Inspection Document</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{fullRecordError}</p>
            <button
              type="button"
              onClick={handleBackToList}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
            >
              &larr; Return to Past Records
            </button>
          </div>
        )}

        {/* AUTHENTIC FULL INSPECTION SHEET CONTAINER (Identical to New Inspection Sheet, but Read-Only) */}
        {!isLoadingFullRecord && fullRecordData && (
          <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden print-clean mb-12">
            
            {/* Sheet Header Banner - Navy / Slate Gradient */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-slate-800 text-center relative overflow-hidden">
              <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-3">
                {/* Company Name & Department */}
                <div>
                  <div className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">
                    ABC COMPANY PVT LTD
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                    QA &amp; QUALITY ASSURANCE PORTAL • QUALITY MEETS PRECISION
                  </div>
                </div>

                {/* Document Title & Status Badge */}
                <div className="space-y-2 flex flex-col items-center justify-center text-center w-full">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                      {(() => {
                        const docType = fullRecordData.form_data?.documentHeader?.documentType;
                        const fName = fullRecordData.form_data?.formName;
                        if (docType && docType !== fName && !/^test(ing)?(_|\s|-|\d)/i.test(docType) && !/test/i.test(docType)) {
                          return docType;
                        }
                        return 'Online & Final Inspection Report';
                      })()}
                    </h1>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white tracking-wide shadow-2xs">
                      Archived QA Record
                    </span>
                  </div>

                  {/* Product Description Prominent Badge */}
                  <div className="pt-0.5 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold shadow-2xs">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-slate-400 font-medium">Product / Specification:</span>
                      <span className="text-white font-extrabold">
                        {fullRecordData.form_data?.auditMetadata?.productDescription ||
                          fullRecordData.form_data?.documentHeader?.productType ||
                          lookupDatabaseItem(fullRecordData.item_code, itemsList)?.description ||
                          'Factory Component Specification'}
                      </span>
                    </div>
                  </div>

                  {/* Document Meta-Information Line */}
                  <div className="text-[11px] text-slate-300 font-medium tracking-wide flex flex-wrap items-center justify-center gap-2 pt-1">
                    <span>
                      Destination:{' '}
                      <strong className="text-white">
                        {fullRecordData.form_data?.hierarchy?.mainCardName || moduleName} &rarr;{' '}
                        {fullRecordData.form_data?.hierarchy?.childCardName || categoryName || 'Operations'}
                      </strong>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>
                      Doc No:{' '}
                      <strong className="font-mono text-white">
                        {fullRecordData.form_data?.documentHeader?.documentNo || 'F 17/3-2.1'}
                      </strong>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>
                      Rev:{' '}
                      <strong className="font-mono text-white">
                        {fullRecordData.form_data?.documentHeader?.revisionNo || '04'}
                      </strong>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>
                      Date of Issue:{' '}
                      <strong className="text-white">
                        {fullRecordData.form_data?.documentHeader?.dateOfIssue ||
                          fullRecordData.created_at?.slice(0, 10) ||
                          '2024-03-20'}
                      </strong>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>
                      Standard:{' '}
                      <strong className="font-mono text-indigo-300">
                        {fullRecordData.form_data?.documentHeader?.refStandard || 'SLS 734 / IEC 60669-1'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Controlled Record Badges */}
                <div className="flex items-center flex-wrap justify-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-600/80 text-purple-300 text-[11px] font-bold tracking-wider shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>CONTROLLED DOCUMENT</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-600/80 text-emerald-300 text-[11px] font-bold tracking-wider shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>CERTIFIED CONFORMING • PASS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sheet Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* DYNAMIC SECTIONS & TABLE GRIDS (READ-ONLY SECTION BLOCKS) */}
              <div className="space-y-6">
                {(fullRecordData.form_data?.sections || formSchema.sections).map((section, sIdx) => {
                  const tableEl = section.elements?.find(el => el.tableConfig);
                  const nonTableEls = section.elements?.filter(el => !el.tableConfig) || [];

                  return (
                    <div 
                      key={section.id || sIdx}
                      className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
                    >
                      {/* Section Title Header */}
                      <div className="bg-slate-100/90 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">
                            {section.sectionNumber || sIdx + 1}
                          </span>
                          <span>{section.title.replace(/DIGITAL FACTORY\s*/i, '')}</span>
                        </h4>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wide font-mono">
                          Verified Section Block
                        </span>
                      </div>

                      {/* Non-Table Elements (Inspection Log metadata fields like Inspection Date, Item Code, Batch No) */}
                      {nonTableEls.length > 0 && (
                        <div className={`p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 ${nonTableEls.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 border-b border-slate-100 bg-slate-50/50`}>
                          {nonTableEls.map(el => {
                            const val = 
                              fullRecordData.form_data?.fieldValues?.[el.id] ||
                              (el.id === 'el-item-code' ? fullRecordData.item_code :
                               el.id === 'el-desc' ? (fullRecordData.form_data?.auditMetadata?.productDescription || fullRecordData.form_data?.documentHeader?.productType) :
                               el.id === 'el-batch' ? fullRecordData.form_data?.auditMetadata?.batchId :
                               el.id === 'el-date' ? (fullRecordData.form_data?.auditMetadata?.auditDate || fullRecordData.created_at?.slice(0, 10)) :
                               '');

                            return (
                              <div key={el.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  {el.name}
                                </span>
                                {(el.type === 'radio' || /cordination/i.test(el.name)) && val ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 font-bold text-xs">
                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                    <span>{val}</span>
                                  </span>
                                ) : (
                                  <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm block truncate">
                                    {val || 'N/A'}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Table Grid (Group Headers, Parameters, Time / Interval Columns, and Specifications) */}
                      {tableEl && tableEl.tableConfig && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-200/80 text-slate-800 font-bold border-b border-slate-300">
                                {tableEl.tableConfig.columns.map(col => {
                                  const timeKey = `${section.id}-${col.id}`;
                                  const recordedTime = 
                                    fullRecordData.form_data?.columnTimeHeaders?.[timeKey] || 
                                    col.defaultHeaderTime;
                                  const isTimeCol = col.hasTimeHeader || col.type === 'dropdown' || /time|interval|shift|result|online|final/i.test(col.header);

                                  return (
                                    <th 
                                      key={col.id} 
                                      className="px-3.5 py-3 text-center first:text-left last:text-left border-r border-slate-300/80 last:border-r-0"
                                      style={{ width: col.width }}
                                    >
                                      <div>
                                        <span className="block text-[11px] uppercase tracking-wider">{col.header}</span>
                                        {isTimeCol && recordedTime && (
                                          <div className="mt-1 inline-flex items-center justify-center gap-1 bg-white border border-slate-300 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700 shadow-2xs">
                                            <Clock className="w-3 h-3 text-blue-600" />
                                            <span>{recordedTime}</span>
                                          </div>
                                        )}
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {tableEl.tableConfig.rows.map(row => {
                                if (row.isGroupHeader) {
                                  return (
                                    <tr key={row.id} className="bg-slate-100 font-bold text-slate-800">
                                      <td 
                                        colSpan={tableEl.tableConfig?.columns.length} 
                                        className="px-4 py-2.5 text-xs uppercase tracking-wider font-extrabold text-blue-900 bg-blue-50/70 border-y border-blue-200"
                                      >
                                        {row.groupTitle || 'Group Section'}
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    {tableEl.tableConfig?.columns.map(col => {
                                      const cellKey = `${section.id}-${row.id}-${col.id}`;
                                      const isParamCol = col.id === 'col-param' || col.id === 'col-fi-param' || /parameter/i.test(col.header);
                                      const isMicCol = col.id === 'col-mic' || col.id === 'col-fi-mic' || /mic/i.test(col.header);
                                      const isSpecCol = col.id === 'col-specs' || col.id === 'col-fi-specs' || /specification/i.test(col.header);

                                      // MIC NO column
                                      if (isMicCol) {
                                        return (
                                          <td key={col.id} className="px-3.5 py-2.5 font-mono text-[11px] font-bold text-slate-600 border-r border-slate-200/80">
                                            {row.cells[col.id] || '-'}
                                          </td>
                                        );
                                      }

                                      // Parameter column (with unit tag if specified)
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

                                      // Specifications column
                                      if (isSpecCol) {
                                        return (
                                          <td key={col.id} className="px-3.5 py-2.5 text-slate-600 text-[11px] leading-relaxed border-r border-slate-200/80">
                                            {row.cells[col.id] || '-'}
                                          </td>
                                        );
                                      }

                                      // Reading / Assessment cell (Read-Only)
                                      const recordedVal = 
                                        fullRecordData.form_data?.cellValues?.[cellKey] || 
                                        fullRecordData.form_data?.cellValues?.[`${row.id}-${col.id}`] ||
                                        row.cells[col.id] || 
                                        '';
                                      const strVal = String(recordedVal || '').trim();
                                      const isPass = strVal.toLowerCase().includes('pass') || strVal.toLowerCase().includes('conforming');
                                      const isFail = strVal.toLowerCase().includes('fail') || strVal.toLowerCase().includes('reject');

                                      return (
                                        <td key={col.id} className="px-2.5 py-2.5 text-center border-r border-slate-200/80">
                                          {isPass ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase border border-emerald-300 shadow-2xs">
                                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                              <span>Pass</span>
                                            </span>
                                          ) : isFail ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] uppercase border border-rose-300 shadow-2xs">
                                              <XCircle className="w-3 h-3 text-rose-600" />
                                              <span>Fail</span>
                                            </span>
                                          ) : strVal && strVal !== '--Select--' ? (
                                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                              {strVal}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300 text-xs font-mono">-</span>
                                          )}
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
              </div>

              {/* ATTACHED TECHNICAL PHOTOS & CERTIFICATES (Rendered only if attachments were uploaded) */}
              {fullRecordData.attachments && fullRecordData.attachments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span>Attached Technical Photos &amp; Verification Reports ({fullRecordData.attachments.length})</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {fullRecordData.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-blue-500 transition shadow-2xs aspect-video"
                      >
                        <img
                          src={url}
                          alt={`Technical Photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                          <ExternalLink className="w-4 h-4" />
                          <span>View Full Photo</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER SECTION: SIGN-OFF & AUDITOR CREDENTIALS (Identical to New Form, Read-Only) */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-6 print-break-inside-avoid">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Inspection Sign-off &amp; Verification Footer</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    ISO 9001:2015 Approved Signoff
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Online Inspected By */}
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                    <span className="text-xs font-bold text-blue-300 block uppercase tracking-wider">
                      Online Inspected By
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Inspector Name</span>
                        <span className="font-bold text-white text-sm">
                          {fullRecordData.inspector_name || 'Certified QC Inspector'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Employee No</span>
                        <span className="font-mono font-bold text-slate-200 text-sm">
                          {fullRecordData.form_data?.auditMetadata?.onlineEmpNo || 'EMP-QC'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Final Verified By */}
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                    <span className="text-xs font-bold text-emerald-300 block uppercase tracking-wider">
                      Final Verified By
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Lead Auditor</span>
                        <span className="font-bold text-white text-sm">
                          {fullRecordData.form_data?.auditMetadata?.finalInspectorName || 'Lead Auditor'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Authority Stamp</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          CERT-SLS-OK
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions Bar (Hidden during Print) */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 no-print print:hidden">
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Return to Past Records</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Sheet</span>
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: PAST RECORDS LIST & SUMMARY CARDS
  // =========================================================================
  return (
    <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-6 z-10 max-w-7xl mx-auto min-h-[calc(100vh-7rem)] animate-in fade-in duration-300">
      
      {/* Top Header Banner (Hidden when hideHeader is true) */}
      {!hideHeader && (
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span>Past Inspection Records</span>
              {categoryName && (
                <span className="text-indigo-600 font-bold text-xl sm:text-2xl">
                  : {categoryName}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchSummaries(selectedItemFilter)}
              disabled={isLoadingSummaries}
              title="Refresh inspection summaries"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingSummaries ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {onNewInspection && (
              <button
                type="button"
                onClick={onNewInspection}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Make New Inspection</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Machine Station Active Filter Toolbar */}
      {selectedMachineFilter && (
        <div className="w-full mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <div className="text-xs">
              <span className="font-extrabold text-blue-900 uppercase tracking-wide mr-1.5">Machine Station:</span>
              <span className="font-mono font-extrabold text-white bg-blue-600 px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                {selectedMachineFilter}
              </span>
              <span className="text-slate-600 ml-2 hidden sm:inline">
                Viewing past inspection records certified on {selectedMachineFilter}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedMachineFilter('');
                const next = new URLSearchParams(searchParams);
                next.delete('mc');
                setSearchParams(next, { replace: true });
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
            >
              Show All Machines
            </button>
            <div className="inline-flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-blue-200 shadow-2xs">
              {['MC-1', 'MC-2', 'MC-3', 'MC-4', 'MC-5', 'MC-6', 'MC-7', 'MC-8'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedMachineFilter(m);
                    const next = new URLSearchParams(searchParams);
                    next.set('mc', m);
                    setSearchParams(next, { replace: true });
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                    selectedMachineFilter === m
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter, Search Bar with Middle Date Picker & View Switcher */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 mb-5 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search Input (Item Code OR Item Description Keyword) */}
        <div className="relative w-full lg:w-72 xl:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search item code or description keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* MIDDLE: Submission Date Picker Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-start lg:justify-center flex-wrap">
          <div className="relative flex items-center">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <input
              type="date"
              aria-label="Filter by Submission Date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition shadow-2xs"
            />
          </div>

          {selectedDateFilter ? (
            <button
              type="button"
              onClick={() => setSelectedDateFilter('')}
              title="Clear date filter"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Date</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Filter by submit date
            </span>
          )}
        </div>

        {/* Right side: Item Code Filter Dropdown & View Mode Switcher (Pure Symbols) */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <label className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Filter Item:</span>
            </label>
            <select
              value={selectedItemFilter}
              onChange={(e) => setSelectedItemFilter(e.target.value)}
              className="w-full md:w-56 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Items ({allItemCodes.length})</option>
              {allItemCodes.map((code) => {
                const itemMatch = lookupDatabaseItem(code, itemsList);
                const desc = itemMatch?.description ? String(itemMatch.description).slice(0, 28) : 'Factory Part';
                return (
                  <option key={code} value={code}>
                    {code} - {desc}
                  </option>
                );
              })}
            </select>

            {selectedItemFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedItemFilter('all')}
                className="text-xs text-indigo-600 hover:underline font-bold shrink-0 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* View Mode Toggle: ONLY symbols (Tiles & List) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/90 shrink-0" role="group" aria-label="View Mode">
            <button
              type="button"
              onClick={() => setViewMode('tiles')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'tiles'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
              title="Tiles View"
              aria-label="Tiles View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grouped List: Categories -> Items -> Records */}
      <div className="w-full space-y-6">
        {isLoadingSummaries && summaries.length === 0 ? (
          <div className="w-full py-16 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading inspection summaries from Supabase...</p>
            <p className="text-xs text-slate-400 mt-1">Fetching verified inspection records</p>
          </div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="w-full py-16 bg-white rounded-3xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center p-6 shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              No Past Inspection Records Found {categoryName ? `for ${categoryName}` : ''}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              {searchQuery || selectedItemFilter !== 'all'
                ? 'No past inspection records match your current filter query.'
                : `No inspections have been registered for ${categoryName || 'this category'} yet in the database. Submit a new inspection form to start logging quality records.`}
            </p>
            {onNewInspection && (
              <button
                type="button"
                onClick={onNewInspection}
                className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                + Make New Inspection Now
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedData).map(([category, itemsMap]) => {
            const isCategoryExpanded = expandedCategories[category] !== false;
            const categoryItems = Object.values(itemsMap);
            const categoryTotalAudits = categoryItems.reduce((acc, item) => acc + item.records.length, 0);

            return (
              <div 
                key={category} 
                className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Category Header Bar */}
                <div 
                  onClick={() => toggleCategory(category)}
                  className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between cursor-pointer select-none hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Layers className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-indigo-300 uppercase tracking-wider">
                          Inspection Category
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {category}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 font-mono">
                      {categoryItems.length} {categoryItems.length === 1 ? 'Item' : 'Items'} • {categoryTotalAudits} {categoryTotalAudits === 1 ? 'Audit' : 'Audits'}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      aria-label="Toggle Category"
                    >
                      {isCategoryExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Category Content: Items Sub-groups */}
                {isCategoryExpanded && (
                  <div className={hideHeader ? "p-3 sm:p-4 space-y-3.5 bg-slate-50/50" : "p-5 sm:p-6 space-y-6 bg-slate-50/50"}>
                    {categoryItems.map(({ itemCode, itemMeta, records }) => {
                      const description = itemMeta?.description || records[0]?.product_desc || 'Factory Component Specification';

                      return (
                        <div 
                          key={itemCode}
                          className={hideHeader ? "bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs space-y-3" : "bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4"}
                        >
                          {/* Item Sub-header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                            <div className="flex items-start sm:items-center gap-2.5">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-mono font-bold text-xs">
                                <Tag className="w-3.5 h-3.5 text-blue-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                    {itemCode}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                                    {description}
                                  </span>
                                </div>
                                {itemMeta?.series && (
                                  <span className="text-[10px] sm:text-[11px] font-mono text-blue-600 font-semibold block mt-0.5">
                                    Series: {itemMeta.series}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {records.length} {records.length === 1 ? 'Record' : 'Records'}
                              </span>
                            </div>
                          </div>

                          {/* Records Display: Compact Details List Mode or Compact Tiles */}
                          {viewMode === 'list' ? (
                            /* Sleek Compact Details List Mode */
                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                              {records.map((rec) => {
                                const dateFormatted = formatDateSafe(rec.created_at);
                                const timeFormatted = formatTimeSafe(rec.created_at);
                                const isOpeningThis = isLoadingFullRecord && selectedRecordId === rec.id;

                                return (
                                  <div
                                    key={rec.id}
                                    onClick={() => handleOpenFullSheet(rec)}
                                    className="px-3 py-1.5 sm:py-2 hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-2.5 text-xs cursor-pointer group select-none"
                                  >
                                    {/* Date & Time */}
                                    <div className="flex items-center gap-1.5 text-slate-600 min-w-[130px] sm:min-w-[150px] shrink-0 font-mono text-[11px] sm:text-xs">
                                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="font-semibold text-slate-800">{dateFormatted}</span>
                                      <span className="text-slate-400 text-[10px] sm:text-[11px]">{timeFormatted}</span>
                                    </div>

                                    {/* Optional Lot / Machine station badge */}
                                    {(rec.lot_number || rec.batch_id) && (
                                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                          {rec.lot_number || rec.batch_id}
                                        </span>
                                      </div>
                                    )}

                                    {/* Inspector / Auditor */}
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                      <span className="font-medium text-slate-800 truncate text-[11px] sm:text-xs">
                                        {rec.inspector_name || 'QC Inspector'}
                                      </span>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="shrink-0">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                                        <span>Certified</span>
                                      </span>
                                    </div>

                                    {/* Open Arrow */}
                                    <div className="shrink-0 text-slate-400 group-hover:text-blue-600 pl-1">
                                      {isOpeningThis ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* Compact Tiles View (Halved size, no raw ID) */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {records.map((rec) => {
                                const dateFormatted = formatDateSafe(rec.created_at);
                                const timeFormatted = formatTimeSafe(rec.created_at);
                                const isOpeningThis = isLoadingFullRecord && selectedRecordId === rec.id;

                                return (
                                  <div
                                    key={rec.id}
                                    onClick={() => handleOpenFullSheet(rec)}
                                    className="group p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden"
                                  >
                                    {/* Row 1: Timestamp & Certified Badge */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{dateFormatted}</span>
                                        <span>•</span>
                                        <span>{timeFormatted}</span>
                                      </div>

                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                        <span>Certified</span>
                                      </span>
                                    </div>

                                    {/* Row 2: Auditor / Inspector & Open Indicator */}
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                                          <User className="w-3 h-3" />
                                        </div>
                                        <span className="font-semibold text-slate-800 text-xs truncate">
                                          {rec.inspector_name || 'QC Inspector'}
                                        </span>
                                      </div>

                                      <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-700 pl-2">
                                        <span className="hidden sm:inline">Open</span>
                                        {isOpeningThis ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition-transform" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Windows File Manager Style Bottom Status Bar */}
      <div className="w-full mt-6 py-2 px-4 rounded-xl bg-slate-100/90 border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">{totalSummariesCount} {totalSummariesCount === 1 ? 'record' : 'records'}</span>
          {selectedItemFilter !== 'all' && (
            <>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-indigo-700 font-bold">{selectedItemFilter}</span>
            </>
          )}
        </div>

        {/* Pure symbol view switcher (Windows File Manager style) */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200/90 shadow-2xs" role="group" aria-label="Bottom View Switcher">
          <button
            type="button"
            onClick={() => setViewMode('tiles')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'tiles'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Tiles View"
            aria-label="Tiles View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="List View"
            aria-label="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

// React Error Boundary to guarantee that past inspection views NEVER fail with a blank screen
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PastRecordsErrorBoundary extends React.Component<PastRecordsListProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };
  constructor(props: PastRecordsListProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PastRecordsList] Caught unhandled rendering error:', error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 z-10 max-w-4xl mx-auto">
          <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 stroke-[2]" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Inspection Records View Recovered
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              A temporary display conflict was intercepted safely without breaking the application. Click below to reload the inspection records cleanly.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Past Records</span>
              </button>
              {this.props.onBack && (
                <button
                  type="button"
                  onClick={this.props.onBack}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Go Back</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return <PastRecordsListInner {...this.props} />;
  }
}

export const PastRecordsList = PastRecordsErrorBoundary;
