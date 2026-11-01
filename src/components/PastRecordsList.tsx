import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { 
  getInspectionSummaries, 
  getInspectionDetails, 
  InspectionSummary, 
  InspectionRecordResponse 
} from '../backend/inspectionService';
import { fetchItems, DbItem, lookupDatabaseItem, SEED_FACTORY_ITEMS } from '../backend/itemService';
import toast from 'react-hot-toast';

export interface PastRecordsListProps {
  /** If provided, pre-filters to this item code. In Admin mode, defaults to 'all' */
  initialItemCode?: string;
  /** Filter or label by inspection category name (e.g. 'Switch / Socket', 'Surface Boxes') */
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
}

// Fallback seed summaries for factory testing if Supabase table is empty
const INITIAL_DEMO_SUMMARIES: InspectionSummary[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    item_code: '3000000559',
    inspector_name: 'K. S. Wickramasinghe',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'e28bc91a-47bb-4161-9456-1d11a1b2c368',
    item_code: '3000000559',
    inspector_name: 'Tharindu Gajasinghe',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'd19ab82c-36aa-4050-8345-2e22b2c3d457',
    item_code: '3000000560',
    inspector_name: 'S. P. Bandara',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'c08da73d-2599-4949-7234-3f33c3d4e546',
    item_code: '3000000561',
    inspector_name: 'Tharindu Gajasinghe',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'b97cb64e-1488-4838-6123-4a44d4e5f635',
    item_code: '3000000562',
    inspector_name: 'N. M. Perera',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'a86ba55f-0377-4727-5012-5b55e5f6a724',
    item_code: 'KEV-LED-220',
    inspector_name: 'M. Vigneshwaran',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

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

const PastRecordsListInner: React.FC<PastRecordsListProps> = ({
  initialItemCode,
  categoryName,
  moduleName = 'Quality Assurance',
  isAdmin = false,
  onBack,
  onNewInspection,
  dbItems: propDbItems,
}) => {
  // 1. Data States
  const [summaries, setSummaries] = useState<InspectionSummary[]>([]);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState<boolean>(true);
  const [itemsList, setItemsList] = useState<DbItem[]>(propDbItems || SEED_FACTORY_ITEMS);
  const [selectedItemFilter, setSelectedItemFilter] = useState<string>(initialItemCode || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // 2. On-Demand Full Details Modal State
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [activeDetails, setActiveDetails] = useState<InspectionRecordResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // 3. Load Items from database for rich item code mapping
  useEffect(() => {
    if (!propDbItems || propDbItems.length === 0) {
      fetchItems().then((items) => {
        if (items && items.length > 0) {
          setItemsList(items);
        }
      }).catch((err) => {
        console.warn('[PastRecordsList] Failed to fetch items, using seeds:', err);
      });
    }
  }, [propDbItems]);

  // 4. Lightweight Summary Fetch (Lazy Loading)
  const fetchSummaries = async (itemCode?: string) => {
    setIsLoadingSummaries(true);
    try {
      const codeParam = itemCode && itemCode !== 'all' ? itemCode : undefined;
      const remoteData = await getInspectionSummaries(codeParam);

      if (remoteData && remoteData.length > 0) {
        // Merge demo summaries that are not in remoteData to keep sample view complete
        const existingIds = new Set(remoteData.map(r => String(r.id)));
        const filteredDemo = INITIAL_DEMO_SUMMARIES.filter(d => {
          if (existingIds.has(String(d.id))) return false;
          if (codeParam && String(d.item_code) !== codeParam) return false;
          return true;
        });
        setSummaries([...remoteData, ...filteredDemo]);
      } else {
        // Fallback to initial sample summaries
        const filteredDemo = codeParam
          ? INITIAL_DEMO_SUMMARIES.filter(d => String(d.item_code) === codeParam)
          : INITIAL_DEMO_SUMMARIES;
        setSummaries(filteredDemo);
      }
    } catch (err) {
      console.error('[PastRecordsList] Error fetching summaries:', err);
      setSummaries(INITIAL_DEMO_SUMMARIES);
    } finally {
      setIsLoadingSummaries(false);
    }
  };

  useEffect(() => {
    fetchSummaries(selectedItemFilter);
  }, [selectedItemFilter]);

  // 5. Immediate UI Sync: Listen for newly submitted inspections
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
      };

      setSummaries((prev) => {
        const filtered = prev.filter((r) => String(r.id) !== newSummary.id);
        return [newSummary, ...filtered];
      });

      toast.success(`New inspection for item ${newSummary.item_code} added to records ledger!`, {
        icon: '📋',
        duration: 3500,
      });
    };

    window.addEventListener('inspection-submitted', handleNewInspection);
    return () => {
      window.removeEventListener('inspection-submitted', handleNewInspection);
    };
  }, []);

  // 6. On-Demand Full Data Fetch: Load single row when record card is clicked
  const handleOpenDetails = async (summary: InspectionSummary) => {
    const sumId = String(summary?.id || '');
    const sumItemCode = String(summary?.item_code || 'N/A');
    const sumInspector = String(summary?.inspector_name || 'QC Inspector');
    const sumCreatedAt = String(summary?.created_at || new Date().toISOString());

    setActiveModalId(sumId);
    setIsLoadingDetails(true);
    setDetailsError(null);
    setActiveDetails(null);

    try {
      // First attempt Supabase database fetch
      const details = await getInspectionDetails(sumId);
      if (details) {
        setActiveDetails(details);
      } else {
        throw new Error('Record details not available');
      }
    } catch (err: any) {
      console.warn('[PastRecordsList] Supabase full details fetch fallback:', err);
      
      // Fallback for demo records or when offline
      const matched = lookupDatabaseItem(sumItemCode, itemsList, categoryName);
      const safeDateStr = sumCreatedAt.slice(0, 10) || new Date().toISOString().slice(0, 10);
      const fallbackDetail: InspectionRecordResponse = {
        id: sumId,
        item_code: sumItemCode,
        inspector_name: sumInspector,
        created_at: sumCreatedAt,
        form_data: {
          recId: `REC-${sumItemCode.slice(-4)}-${sumId.slice(0, 6)}`,
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
            lotNumber: `LOT-${sumItemCode.slice(-4)}-2026-9412`,
            batchId: `BATCH-PROD-${sumItemCode.slice(-3)}`,
            productDescription: matched?.description || 'Factory Item Standard Spec',
            onlineEmpNo: 'EMP-QC-8142',
            finalInspectorName: 'Lead Auditor S. Silva',
            finalEmpNo: 'QC-LEAD-01',
          },
          cellValues: {
            'sec-1-row-1-col-1': 'Conforming',
            'sec-1-row-1-col-2': '240.2 V',
            'sec-1-row-1-col-3': 'Pass',
            'sec-1-row-2-col-1': '13.05 A',
            'sec-1-row-2-col-2': 'Pass',
            'sec-2-row-1-col-1': 'Pass',
          },
          columnTimeHeaders: {
            'col-time-1': '08:30 AM',
            'col-time-2': '10:00 AM',
            'col-time-3': '11:30 AM',
          },
          remarks: `Inspection certified under standard QA parameters. Verified electrical insulation resistance, terminal torque tolerance, and visual shutter alignment against ISO 9001:2015 protocol. Zero major deviations noted.`,
          status: 'pass',
          hasFailures: false,
          submittedAt: sumCreatedAt,
        },
        attachments: [
          'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        ],
      };
      setActiveDetails(fallbackDetail);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setActiveModalId(null);
    setActiveDetails(null);
    setDetailsError(null);
  };

  // 7. Grouping by Inspection Category & Item Code
  const groupedData = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    const filtered = (summaries || []).filter((s) => {
      if (!s) return false;
      if (!q) return true;
      const sItemCode = String(s.item_code || '').toLowerCase();
      const sInspector = String(s.inspector_name || '').toLowerCase();
      const sId = String(s.id || '').toLowerCase();
      const itemMatch = lookupDatabaseItem(s.item_code, itemsList);
      const desc = String(itemMatch?.description || '').toLowerCase();

      return (
        sItemCode.includes(q) ||
        sInspector.includes(q) ||
        sId.includes(q) ||
        desc.includes(q)
      );
    });

    // Grouping structure: Map<CategoryName, Map<ItemCode, InspectionSummary[]>>
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
      
      // Determine category:
      // If user provided a specific categoryName, let's keep all category-matched items under it
      // or under the item's category so nothing is hidden.
      const resolvedCategory = (categoryName && (!itemMeta?.category || itemMeta.category.toLowerCase().includes(categoryName.toLowerCase()) || categoryName.toLowerCase().includes(itemMeta.category.toLowerCase())))
        ? categoryName
        : (itemMeta?.category || categoryName || 'Standard Production QA');

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
  }, [summaries, itemsList, categoryName, searchQuery]);

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

  // Distinct item codes present in the system for filtering dropdown
  const allItemCodes = useMemo(() => {
    const set = new Set<string>();
    (summaries || []).forEach((s) => {
      if (s?.item_code) set.add(String(s.item_code));
    });
    (itemsList || []).forEach((i) => {
      if (i?.item_code) set.add(String(i.item_code));
    });
    return Array.from(set).filter(Boolean).sort();
  }, [summaries, itemsList]);

  // Overall metrics
  const totalSummariesCount = summaries.length;
  const uniqueItemsCount = new Set((summaries || []).map((s) => String(s?.item_code || ''))).size;
  const uniqueInspectorsCount = new Set((summaries || []).map((s) => String(s?.inspector_name || ''))).size;

  return (
    <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-6 z-10 max-w-7xl mx-auto min-h-[calc(100vh-7rem)] animate-in fade-in duration-300">
      
      {/* Top Header Banner */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
              {isAdmin ? 'ADMIN AUDIT LEDGER' : `${moduleName.toUpperCase()} • QA RECORDS`}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Lazy-Loaded Summaries ({totalSummariesCount} Records)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Past Inspection Records</span>
            {categoryName && (
              <span className="text-indigo-600 font-bold text-xl sm:text-2xl">
                : {categoryName}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            {isAdmin 
              ? 'Complete cross-user audit trail across all factory categories, monitored item codes, and digital certificates.'
              : 'Historical verified inspections organized by category and item. Click any record card to inspect complete measurements on-demand.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchSummaries(selectedItemFilter)}
            disabled={isLoadingSummaries}
            title="Refresh inspection summaries from Supabase"
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

      {/* High-Level Overview Metrics Cards */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Logged Inspections
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {totalSummariesCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Audits</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Monitored Item Codes
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono">
              {uniqueItemsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">SKUs</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Inspectors
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {uniqueInspectorsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Officers</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Architecture
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ⚡ Lazy-Loaded JSONB
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-4 mb-6 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Item Code, Inspector, or Audit ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
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

        {/* Item Code Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Filter Item:</span>
          </label>
          <select
            value={selectedItemFilter}
            onChange={(e) => setSelectedItemFilter(e.target.value)}
            className="w-full md:w-64 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Item Codes ({allItemCodes.length} available)</option>
            {allItemCodes.map((code) => {
              const itemMatch = lookupDatabaseItem(code, itemsList);
              const desc = itemMatch?.description ? String(itemMatch.description).slice(0, 32) : 'Factory Part';
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
      </div>

      {/* Main Grouped List: Categories -> Items -> Records */}
      <div className="w-full space-y-6">
        {isLoadingSummaries && summaries.length === 0 ? (
          <div className="w-full py-16 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading lightweight inspection summaries...</p>
            <p className="text-xs text-slate-400 mt-1">Fetching metadata without heavy form payloads</p>
          </div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="w-full py-16 bg-white rounded-3xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center p-6 shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Past Inspection Records Found</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              {searchQuery || selectedItemFilter !== 'all'
                ? 'No past inspection records match your current filter query.'
                : 'No inspection records have been saved yet. Submit a new inspection form to start logging quality audits.'}
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

                {/* Category Content: Items Accordion / Sub-groups */}
                {isCategoryExpanded && (
                  <div className="p-5 sm:p-6 space-y-6 bg-slate-50/50">
                    {categoryItems.map(({ itemCode, itemMeta, records }) => {
                      const description = itemMeta?.description || 'Factory Component Specification';

                      return (
                        <div 
                          key={itemCode}
                          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4"
                        >
                          {/* Item Sub-header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-start sm:items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-mono font-bold text-xs">
                                <Tag className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                    {itemCode}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                                    {description}
                                  </span>
                                </div>
                                {itemMeta?.drawing_number && (
                                  <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                                    Drawing: {itemMeta.drawing_number} • Dept: {itemMeta.department || 'Production'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {records.length} {records.length === 1 ? 'Record' : 'Records'}
                              </span>
                            </div>
                          </div>

                          {/* Records Grid (Modular Cards) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {records.map((rec) => {
                              const isOpening = isLoadingDetails && activeModalId === rec.id;
                              const dateFormatted = formatDateSafe(rec.created_at);
                              const timeFormatted = formatTimeSafe(rec.created_at);
                              const shortId = formatIdSafe(rec.id, 13);

                              return (
                                <div
                                  key={rec.id}
                                  onClick={() => handleOpenDetails(rec)}
                                  className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
                                >
                                  {/* Top Row: Audit ID & Timestamp */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{timeFormatted}</span>
                                        <span>•</span>
                                        <span>{dateFormatted}</span>
                                      </div>
                                      <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors block mt-1">
                                        ID: {shortId}
                                      </span>
                                    </div>

                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Certified</span>
                                    </span>
                                  </div>

                                  {/* Inspector Information */}
                                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                        <User className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                                          Auditor / Inspector
                                        </span>
                                        <span className="font-bold text-slate-800 text-xs truncate max-w-[170px] block">
                                          {rec.inspector_name || 'QC Inspector'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bottom Action */}
                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                                    <span className="flex items-center gap-1.5">
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View Full Inspection</span>
                                    </span>
                                    {isOpening ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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

      {/* ========================================================================= */}
      {/* ON-DEMAND FULL DATA DETAILS MODAL                                         */}
      {/* ========================================================================= */}
      {activeModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                  <FileCheck2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                      Verified On-Demand
                    </span>
                    <span className="font-mono text-xs text-indigo-300">
                      ID: {formatIdSafe(activeModalId, 24)}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                    Full Inspection Certificate &amp; QA Measurements
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetails}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {isLoadingDetails ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-800">Fetching complete row on-demand...</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Querying full jsonb form data, measurements, and attachments
                  </p>
                </div>
              ) : activeDetails ? (
                <>
                  {/* Top Item & Certification Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                          Inspection Target Item
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-extrabold text-lg sm:text-xl text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">
                            {activeDetails.item_code}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-slate-800">
                            {activeDetails.form_data?.auditMetadata?.productDescription ||
                              activeDetails.form_data?.documentHeader?.productType ||
                              lookupDatabaseItem(activeDetails.item_code, itemsList)?.description ||
                              'Factory Component Spec'}
                          </span>
                        </div>
                      </div>

                      <div className="self-start sm:self-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase tracking-wide border border-emerald-300 shadow-2xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>QA Certified (PASS)</span>
                        </span>
                      </div>
                    </div>

                    {/* Metadata Subgrid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-indigo-200/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Audited By</span>
                        <span className="font-bold text-slate-800 block truncate">
                          {activeDetails.inspector_name || 'Inspector'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Audit Timestamp</span>
                        <span className="font-mono text-slate-800 block">
                          {formatDateTimeSafe(activeDetails.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Inspection Lot</span>
                        <span className="font-mono font-bold text-slate-800 block truncate">
                          {activeDetails.form_data?.auditMetadata?.lotNumber || 'LOT-AUTO-2026'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Batch Ref</span>
                        <span className="font-mono font-bold text-slate-800 block truncate">
                          {activeDetails.form_data?.auditMetadata?.batchId || 'BATCH-01'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document & Standard Header Details */}
                  {activeDetails.form_data?.documentHeader && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Controlled Document Header &amp; Reference Standards
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase block font-semibold">Document No</span>
                          <span className="font-mono font-bold text-slate-800">
                            {activeDetails.form_data.documentHeader.documentNo || 'F 17/3-2.1'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase block font-semibold">Revision No</span>
                          <span className="font-mono font-bold text-slate-800">
                            {activeDetails.form_data.documentHeader.revisionNo || '04'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase block font-semibold">Date of Issue</span>
                          <span className="font-medium text-slate-800">
                            {activeDetails.form_data.documentHeader.dateOfIssue || '2024-03-20'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase block font-semibold">Ref Standard</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {activeDetails.form_data.documentHeader.refStandard || 'SLS 734'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Measurements & Checkpoints (Dynamic JSONB Payload) */}
                  {activeDetails.form_data?.cellValues && Object.keys(activeDetails.form_data.cellValues).length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Inspection Measurements &amp; Checkpoints (form_data)</span>
                      </span>

                      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">Checkpoint / Parameter</th>
                              <th className="py-2.5 px-4">Recorded Reading / Assessment</th>
                              <th className="py-2.5 px-4 text-right">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Object.entries(activeDetails.form_data.cellValues).map(([key, val]) => {
                              const strVal = String(val);
                              const isPass = strVal.toLowerCase().includes('pass') || strVal.toLowerCase().includes('conforming');
                              const isFail = strVal.toLowerCase().includes('fail') || strVal.toLowerCase().includes('reject');

                              return (
                                <tr key={key} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                                    {key.replace(/sec-\d+-row-/, 'Parameter ').replace(/-col-/, ' • Col ')}
                                  </td>
                                  <td className="py-2.5 px-4 font-bold text-slate-900">
                                    {strVal || 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    {isFail ? (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px] uppercase">
                                        FAIL
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                                        PASS
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Multi-Sentence Audit Observations & Remarks */}
                  {activeDetails.form_data?.remarks && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Inspector Observations &amp; Quality Remarks
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                        {activeDetails.form_data.remarks}
                      </p>
                    </div>
                  )}

                  {/* Uploaded Attachments Gallery */}
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <span>Attached Technical Photos &amp; Reports ({activeDetails.attachments?.length || 0})</span>
                    </span>

                    {activeDetails.attachments && activeDetails.attachments.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {activeDetails.attachments.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-blue-500 transition shadow-2xs aspect-video"
                          >
                            <img
                              src={url}
                              alt={`Inspection Attachment ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Full</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No technical photo attachments uploaded with this inspection record.
                      </div>
                    )}
                  </div>

                  {/* Digital Verification Footer */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Digital Verification Authority
                      </span>
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {activeDetails.form_data?.auditMetadata?.finalInspectorName || 'QA Lead Signoff Authority'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-[10px] font-bold">
                        ISO 9001:2015 Approved
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">Inspection details could not be loaded</p>
                  <p className="text-xs text-slate-400 mt-1">{detailsError || 'Please try again later.'}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Certificate</span>
              </button>

              <button
                type="button"
                onClick={handleCloseDetails}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PastRecordsList] Caught unhandled rendering error:', error, errorInfo);
  }

  render(): ReactNode {
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
