import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Zap, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Factory, 
  Sparkles, 
  X, 
  Filter, 
  FileText, 
  Settings2, 
  RotateCcw,
  Tag,
  Check,
  Eye,
  Calendar,
  Save,
  ClipboardList,
  Clock,
  CircleDot,
  ListFilter,
  Type,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { fetchItems, DbItem } from '../backend/itemService';
import { FormEditorStudio, DocumentHeaderData } from './FormEditorStudio';
import { InspectionEditor } from './InspectionEditor';

export interface DynamicInspectionElement {
  id: string;
  fieldType: 'text' | 'dropdown' | 'radio' | 'date';
  fieldName: string;
  displayedData: string;
  options?: string[];
  currentValue?: string;
  dateValue?: string;
  addedAt: string;
}

export interface InspectionSpecItem {
  id: string;
  itemCode: string;
  itemName: string;
  series: string;
  category: string;
  inspectionStage: 'incoming' | 'in-process' | 'final';
  parameter: string;
  nominalTarget: string;
  tolerance: string;
  unit: string;
  equipment: string;
  samplingFrequency: string;
  criticality: 'Critical' | 'Major' | 'Minor';
  revision: string;
  status: 'Active' | 'Archived';
  createdAt: string;
  inspector?: string;
  inspectionDate?: string;
  inspectionMode?: 'variable' | 'attribute' | 'visual';
  remarks?: string;
}

// Initial specification benchmarks mapped to real product series
const INITIAL_INSPECTION_SPECS: InspectionSpecItem[] = [
  {
    id: 'SPEC-WS-101',
    itemCode: '3000000537',
    itemName: 'Ms-10 1Gang One Way Switch',
    series: 'White Series',
    category: 'Gang Switches',
    inspectionStage: 'in-process',
    parameter: 'Contact Resistance & Continuity',
    nominalTarget: '< 15',
    tolerance: 'Max 18',
    unit: 'mΩ',
    equipment: 'Micro-Ohmmeter Precision Cell',
    samplingFrequency: '100% In-Line Test',
    criticality: 'Critical',
    revision: 'Rev E.1',
    status: 'Active',
    createdAt: '2026-09-10'
  },
  {
    id: 'SPEC-WS-102',
    itemCode: '3000010280',
    itemName: 'MSFZ-6- 6A Switched Socket Outlet',
    series: 'White Series',
    category: 'Sockets',
    inspectionStage: 'incoming',
    parameter: 'Terminal Screw Tightening Torque',
    nominalTarget: '1.20',
    tolerance: '±0.15',
    unit: 'N·m',
    equipment: 'Digital Torque Transducer Gauge',
    samplingFrequency: 'AQL 0.65 Level II',
    criticality: 'Major',
    revision: 'Rev D.4',
    status: 'Active',
    createdAt: '2026-09-12'
  },
  {
    id: 'SPEC-MOD-201',
    itemCode: '3000000559',
    itemName: 'Modular Frame Series - White Plate',
    series: 'Modular/Nature',
    category: 'Modular Frames',
    inspectionStage: 'in-process',
    parameter: 'Plate Dimensional Coplanarity',
    nominalTarget: '86.00',
    tolerance: '±0.08',
    unit: 'mm',
    equipment: 'Multi-Axis Optical Vision CMM',
    samplingFrequency: '5 pcs / Production Run',
    criticality: 'Major',
    revision: 'Rev B.3',
    status: 'Active',
    createdAt: '2026-09-15'
  },
  {
    id: 'SPEC-LED-301',
    itemCode: '3000018402',
    itemName: 'Kevilton 9W High-Lumen LED Bulb',
    series: 'LED',
    category: 'Kevilton LED',
    inspectionStage: 'final',
    parameter: 'Luminous Flux & Correlated Color Temp',
    nominalTarget: '850',
    tolerance: '±50',
    unit: 'lm',
    equipment: 'Integrating Sphere Photometer Spectrometer',
    samplingFrequency: '10 pcs / Hourly Audit',
    criticality: 'Critical',
    revision: 'Rev C.2',
    status: 'Active',
    createdAt: '2026-09-18'
  },
  {
    id: 'SPEC-PRT-401',
    itemCode: '3000012904',
    itemName: 'Safetaa 32A Single Pole MCB Breaker',
    series: 'Protection',
    category: 'Protection – Safetaa',
    inspectionStage: 'incoming',
    parameter: 'Bimetallic Thermal Trip Time (2.55 In)',
    nominalTarget: '45.0',
    tolerance: '±5.0',
    unit: 's',
    equipment: 'High-Current Primary Injection Bench',
    samplingFrequency: '100% Quality Station',
    criticality: 'Critical',
    revision: 'Rev F.0',
    status: 'Active',
    createdAt: '2026-09-20'
  },
  {
    id: 'SPEC-AUT-501',
    itemCode: '3000000579',
    itemName: '20A Double Pole Switch Mechanism',
    series: 'Automation',
    category: 'Automatic Cells',
    inspectionStage: 'in-process',
    parameter: 'Actuation Force & Tactile Return Cycle',
    nominalTarget: '3.50',
    tolerance: '±0.40',
    unit: 'N',
    equipment: 'Automated Robotic Pneumatic Actuator',
    samplingFrequency: 'Continuous Sensor Stream',
    criticality: 'Minor',
    revision: 'Rev A.8',
    status: 'Active',
    createdAt: '2026-09-22'
  },
  {
    id: 'SPEC-INJ-601',
    itemCode: '3000000550',
    itemName: 'Polycarbonate Surface Blank Plate Enclosure',
    series: 'Injection Molding',
    category: 'Molding Tooling',
    inspectionStage: 'incoming',
    parameter: 'Wall Thickness & Warpage Profile',
    nominalTarget: '2.40',
    tolerance: '±0.05',
    unit: 'mm',
    equipment: 'Ultrasonic Wall Thickness Meter',
    samplingFrequency: '8 pcs / Mold Cavity Cycle',
    criticality: 'Major',
    revision: 'Rev D.1',
    status: 'Active',
    createdAt: '2026-09-25'
  }
];

// Cards configuration matching conditions of before pages
interface CategoryCardConfig {
  id: string;
  name: string;
  seriesKey: string;
  tag: string;
  description: string;
  iconType: 'white' | 'modular' | 'led' | 'protection' | 'automation' | 'injection';
  nominalStandard: string;
}

const CATEGORY_CARDS: CategoryCardConfig[] = [
  {
    id: 'cat-white-series',
    name: 'White Series',
    seriesKey: 'White Series',
    tag: 'WIRING ACCESSORIES',
    description: 'Gang switches, 6A/13A socket outlets, double pole mechanisms, and surface plates.',
    iconType: 'white',
    nominalStandard: 'BS 1363 / SLS 1000'
  },
  {
    id: 'cat-modular-nature',
    name: 'Modular/Nature',
    seriesKey: 'Modular/Nature',
    tag: 'LUXURY COVERS & FRAMES',
    description: 'Gold/silver modular frames, architectural nature series timber plates, and smart inserts.',
    iconType: 'modular',
    nominalStandard: 'IEC 60669-1'
  },
  {
    id: 'cat-led',
    name: 'LED & Luminaire',
    seriesKey: 'LED',
    tag: 'SOLID STATE LIGHTING',
    description: 'High-lumen LED bulbs, slim battens, driver ballasts, and residential downlight fixtures.',
    iconType: 'led',
    nominalStandard: 'IEC 62560 Photometry'
  },
  {
    id: 'cat-protection',
    name: 'Protection Series',
    seriesKey: 'Protection',
    tag: 'CIRCUIT BREAKERS & ENCLOSURES',
    description: 'Safetaa and Hexa MCBs, RCCB residual trip units, main isolators, and industrial DB boards.',
    iconType: 'protection',
    nominalStandard: 'IEC 60898-1 / 61008'
  },
  {
    id: 'cat-automation',
    name: 'Automation & In-Line',
    seriesKey: 'Automation',
    tag: 'ROBOTIC VERIFICATION',
    description: 'High-speed automated assembly cells, optical camera vision checkpoints, and tactile force endurance.',
    iconType: 'automation',
    nominalStandard: 'ISO 9001 Metrology'
  },
  {
    id: 'cat-injection',
    name: 'Injection Molding',
    seriesKey: 'Injection Molding',
    tag: 'POLYMER PRECISION',
    description: 'Fire-retardant polycarbonate housing shells, copper insert terminal blocks, and tooling dies.',
    iconType: 'injection',
    nominalStandard: 'UL 94-V0 Flammability'
  }
];

interface AddRemoveInspectionPortalProps {
  onBack: () => void;
  userId?: string;
}

export const AddRemoveInspectionPortal: React.FC<AddRemoveInspectionPortalProps> = ({
  onBack,
  userId = 'AD-1004'
}) => {
  // State for specs
  const [specs, setSpecs] = useState<InspectionSpecItem[]>(INITIAL_INSPECTION_SPECS);
  const [items, setItems] = useState<DbItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>('All');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'cards' | 'form' | 'table' | 'editor'>('cards');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isRemoveManagerOpen, setIsRemoveManagerOpen] = useState<boolean>(false);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<CategoryCardConfig | null>(null);
  const [itemToRemove, setItemToRemove] = useState<InspectionSpecItem | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  // Add Form State
  const [formItemCode, setFormItemCode] = useState<string>('');
  const [formItemName, setFormItemName] = useState<string>('');
  const [formSeries, setFormSeries] = useState<string>('White Series');
  const [formCategory, setFormCategory] = useState<string>('Gang Switches');
  const [formStage, setFormStage] = useState<'incoming' | 'in-process' | 'final'>('in-process');
  const [formParameter, setFormParameter] = useState<string>('');
  const [formNominal, setFormNominal] = useState<string>('240.00');
  const [formTolerance, setFormTolerance] = useState<string>('±0.05');
  const [formUnit, setFormUnit] = useState<string>('mm');
  const [formEquipment, setFormEquipment] = useState<string>('Digital Vernier Caliper');
  const [formFrequency, setFormFrequency] = useState<string>('100% In-Line Test');
  const [formCriticality, setFormCriticality] = useState<'Critical' | 'Major' | 'Minor'>('Critical');
  const [formRevision, setFormRevision] = useState<string>('Rev A.1');
  const [formInspector, setFormInspector] = useState<string>('Eng. Amanda Perera (QC-Staff #4102)');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formInspectionMode, setFormInspectionMode] = useState<'variable' | 'attribute' | 'visual'>('variable');
  const [formRemarks, setFormRemarks] = useState<string>('Verify zero burrs, smooth actuation, and SLS 1000 standard compliance.');

  // Live preview items added before saving
  const [previewItems, setPreviewItems] = useState<InspectionSpecItem[]>([]);

  // =========================================================================
  // DYNAMIC INSPECTION ELEMENT BUILDER STATE (Requested by User)
  // When clicking new inspection -> shows "Add New Element" button just it.
  // When clicked -> dropdown list appears with text field, dropdown list, radio button, date picker.
  // When data field selected -> auto appears name, displayed data in text field, interactive field & Add button.
  // When items added -> preview at bottom of page with Save button.
  // =========================================================================
  const [showAddElement, setShowAddElement] = useState<boolean>(false);
  const [selectedFieldType, setSelectedFieldType] = useState<string>('');
  const [elementName, setElementName] = useState<string>('');
  const [elementDisplayedData, setElementDisplayedData] = useState<string>('');
  const [elementOptions, setElementOptions] = useState<string[]>([]);
  const [elementInteractiveValue, setElementInteractiveValue] = useState<string>('');
  const [elementDateValue, setElementDateValue] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previewElements, setPreviewElements] = useState<DynamicInspectionElement[]>([]);

  // Document Header Section state passed to Form Generator
  const [docHeaderData, setDocHeaderData] = useState<DocumentHeaderData>({
    documentNo: 'F 17/3-2.1',
    dateOfIssue: '2024-03-20',
    revisionNo: '04',
    documentType: 'Online & Final Inspection Report',
    productType: 'White Series – Switched Socket Outlet',
    refStandard: 'SLS 734'
  });

  // Select field type cleanly without auto-filling mock data
  const handleSelectFieldType = (type: string) => {
    setSelectedFieldType(type);
    // Do not appear any data inside the selection when new element is added
    setElementName('');
    setElementDisplayedData('');
    setElementOptions([]);
    setElementInteractiveValue('');
  };

  // Add Dynamic Element to Live Preview at the bottom of the page
  const handleAddElementToPreview = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFieldType) {
      showToast('Please select a data field from the dropdown list first.', 'danger');
      return;
    }
    if (!elementName.trim()) {
      showToast('Please provide an Element Name.', 'danger');
      return;
    }

    const newElem: DynamicInspectionElement = {
      id: `ELEM-${Date.now().toString().slice(-6)}`,
      fieldType: selectedFieldType as 'text' | 'dropdown' | 'radio' | 'date',
      fieldName: elementName.trim(),
      displayedData: elementDisplayedData.trim() || 'Default Inspection Value',
      options: selectedFieldType === 'dropdown' || selectedFieldType === 'radio' ? [...elementOptions] : undefined,
      currentValue: elementInteractiveValue || elementDisplayedData,
      dateValue: elementDateValue,
      addedAt: new Date().toISOString().split('T')[0]
    };

    setPreviewElements(prev => [newElem, ...prev]);
    showToast(`Added "${newElem.fieldName}" to inspection preview!`, 'success');

    // Smooth scroll down to preview section at the bottom of the page
    setTimeout(() => {
      const previewEl = document.getElementById('inspection-preview-section');
      if (previewEl) {
        previewEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
  };

  // Save All Dynamic Elements to specifications & system database
  const handleSaveAllElements = () => {
    if (previewElements.length === 0) {
      showToast('No items in preview to save. Click "+ Add New Element" to configure elements first.', 'danger');
      return;
    }

    const count = previewElements.length;
    // Map to active specs so they appear in register and counters
    const newSpecs: InspectionSpecItem[] = previewElements.map(el => ({
      id: `SPEC-${Date.now().toString().slice(-4)}-${el.id.slice(-4)}`,
      itemCode: `ELEM-${Math.floor(100000 + Math.random() * 900000)}`,
      itemName: el.fieldName,
      series: 'Inspection Controls',
      category: el.fieldType.toUpperCase(),
      inspectionStage: 'in-process',
      parameter: el.fieldName,
      nominalTarget: el.displayedData,
      tolerance: el.fieldType === 'text' ? '±0.05' : 'N/A',
      unit: el.fieldType === 'text' ? 'mm' : 'Check',
      equipment: el.fieldType === 'date' ? 'Calibration System' : 'Digital Test Fixture',
      samplingFrequency: '100% In-Line Test',
      criticality: el.fieldType === 'radio' && el.currentValue === 'Critical' ? 'Critical' : 'Major',
      revision: 'Rev A.1',
      status: 'Active',
      createdAt: el.addedAt,
      inspector: 'QC Auditor #4102',
      inspectionDate: el.dateValue || el.addedAt,
      remarks: `Configured via Dynamic Inspection Builder (${el.fieldType})`
    }));

    setSpecs(prev => [...newSpecs, ...prev]);
    setPreviewElements([]);
    setSelectedFieldType('');
    setShowAddElement(false);
    showToast(`Successfully saved ${count} inspection element(s) to system specifications!`, 'success');
  };

  const handleRemoveElementFromPreview = (id: string) => {
    setPreviewElements(prev => prev.filter(el => el.id !== id));
    showToast('Removed element from preview list.', 'danger');
  };

  const handleClearAllPreviewElements = () => {
    setPreviewElements([]);
    showToast('Preview list cleared.', 'danger');
  };

  // Fetch real items from Supabase database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDbItems() {
      setIsLoadingItems(true);
      const data = await fetchItems();
      if (isMounted) {
        setItems(data);
        setIsLoadingItems(false);
      }
    }
    loadDbItems();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter items matching selected series
  const getFilteredDbItems = (seriesTarget: string) => {
    if (!seriesTarget || seriesTarget === 'All') return items;
    const lower = seriesTarget.toLowerCase();
    const filtered = items.filter(it => {
      const s = (it.series || '').toLowerCase();
      const c = (it.category || '').toLowerCase();
      const d = (it.description || '').toLowerCase();
      if (lower.includes('white')) return s.includes('white');
      if (lower.includes('modular') || lower.includes('nature')) return s.includes('modular') || s.includes('nature');
      if (lower.includes('led')) return s.includes('led') || c.includes('led');
      if (lower.includes('protection')) return s.includes('protection') || s.includes('safetaa') || s.includes('hexa');
      if (lower.includes('injection')) return s.includes('conduit') || s.includes('enclosure') || d.includes('plate');
      if (lower.includes('automation')) return s.includes('accessories') || s.includes('switch');
      return s.includes(lower) || c.includes(lower);
    });
    return filtered.length > 0 ? filtered : items;
  };

  // Helper to open Form Generator directly without popup and immediately scroll to page top
  const handleOpenAddModal = (category?: CategoryCardConfig) => {
    setActiveTab('form');
    // Scroll page and window to the top immediately so the top of Form Generator appears first
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Handle Form Submit to ADD new Inspection directly
  const handleCreateInspectionSpec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParameter.trim()) {
      showToast('Please enter an inspection parameter / checkpoint name', 'danger');
      return;
    }

    const newSpec: InspectionSpecItem = {
      id: `SPEC-${Date.now().toString().slice(-6)}`,
      itemCode: formItemCode || `ITM-${Math.floor(100000 + Math.random() * 900000)}`,
      itemName: formItemName || formParameter,
      series: formSeries,
      category: formCategory,
      inspectionStage: formStage,
      parameter: formParameter,
      nominalTarget: formNominal,
      tolerance: formTolerance,
      unit: formUnit,
      equipment: formEquipment,
      samplingFrequency: formFrequency,
      criticality: formCriticality,
      revision: formRevision || 'Rev A.0',
      status: 'Active',
      createdAt: formDate || new Date().toISOString().split('T')[0],
      inspector: formInspector,
      inspectionDate: formDate,
      inspectionMode: formInspectionMode,
      remarks: formRemarks
    };

    setSpecs(prev => [newSpec, ...prev]);
    setIsAddModalOpen(false);
    showToast(`Inspection Spec "${newSpec.parameter}" added successfully!`, 'success');
  };

  // Submit Item to Preview list at the bottom of the page
  const handleAddPreviewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParameter.trim()) {
      showToast('Please enter an inspection checkpoint / parameter name.', 'danger');
      return;
    }

    const selectedDbItem = items.find(it => it.item_code === formItemCode);
    const resolvedItemCode = formItemCode || (selectedDbItem?.item_code || '3000000537');
    const resolvedItemName = formItemName || (selectedDbItem?.description || formParameter);

    const newItem: InspectionSpecItem = {
      id: `SPEC-${Date.now().toString().slice(-6)}`,
      itemCode: resolvedItemCode,
      itemName: resolvedItemName,
      series: formSeries,
      category: formCategory,
      inspectionStage: formStage,
      parameter: formParameter.trim(),
      nominalTarget: formNominal.trim() || '240.0',
      tolerance: formTolerance.trim() || '±0.05',
      unit: formUnit,
      equipment: formEquipment.trim() || 'Digital Vernier Caliper',
      samplingFrequency: formFrequency,
      criticality: formCriticality,
      revision: formRevision.trim() || 'Rev A.1',
      status: 'Active',
      createdAt: formDate || new Date().toISOString().split('T')[0],
      inspector: formInspector.trim() || 'QC Auditor #4102',
      inspectionDate: formDate || new Date().toISOString().split('T')[0],
      inspectionMode: formInspectionMode,
      remarks: formRemarks.trim() || 'Conform to quality standard specification.'
    };

    setPreviewItems(prev => [newItem, ...prev]);
    showToast(`Inspection "${newItem.parameter}" added to preview list at the bottom of the page!`, 'success');

    // Smooth scroll down to preview section
    setTimeout(() => {
      const previewEl = document.getElementById('inspection-preview-section');
      if (previewEl) {
        previewEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);

    // Reset checkpoint parameter for quick sequential entry
    setFormParameter('');
  };

  // Save All Preview Items to Database (specs)
  const handleSaveAllPreviewItems = () => {
    if (previewItems.length === 0) {
      showToast('No items in preview to save. Please add items using the form above first.', 'danger');
      return;
    }

    const count = previewItems.length;
    setSpecs(prev => [...previewItems, ...prev]);
    setPreviewItems([]);
    showToast(`Successfully saved ${count} inspection specification(s) to system database!`, 'success');
  };

  // Remove individual item from preview
  const handleRemovePreviewItem = (id: string) => {
    setPreviewItems(prev => prev.filter(it => it.id !== id));
    showToast('Removed item from preview list.', 'danger');
  };

  // Clear all items from preview
  const handleClearPreview = () => {
    setPreviewItems([]);
    showToast('Preview list cleared.', 'danger');
  };

  // Handle REMOVE Inspection
  const handleConfirmRemove = () => {
    if (!itemToRemove) return;
    setSpecs(prev => prev.filter(sp => sp.id !== itemToRemove.id));
    const removedName = itemToRemove.parameter;
    setItemToRemove(null);
    showToast(`Inspection Spec "${removedName}" has been removed from active standards.`, 'danger');
  };

  const showToast = (message: string, type: 'success' | 'danger') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Filtered specs list
  const filteredSpecs = specs.filter(sp => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      sp.parameter.toLowerCase().includes(q) ||
      sp.itemName.toLowerCase().includes(q) ||
      sp.itemCode.toLowerCase().includes(q) ||
      sp.series.toLowerCase().includes(q) ||
      sp.equipment.toLowerCase().includes(q);

    const matchesSeries = 
      selectedSeriesFilter === 'All' || 
      sp.series.toLowerCase().includes(selectedSeriesFilter.toLowerCase());

    const matchesStage = 
      selectedStageFilter === 'All' || 
      sp.inspectionStage.toLowerCase() === selectedStageFilter.toLowerCase();

    return matchesSearch && matchesSeries && matchesStage;
  });

  const getCardIcon = (type: CategoryCardConfig['iconType']) => {
    switch (type) {
      case 'white':
        return <Layers className="w-9 h-9 stroke-[1.8]" />;
      case 'modular':
        return <Sparkles className="w-9 h-9 stroke-[1.8]" />;
      case 'led':
        return <Zap className="w-9 h-9 stroke-[1.8]" />;
      case 'protection':
        return <ShieldCheck className="w-9 h-9 stroke-[1.8]" />;
      case 'automation':
        return <Cpu className="w-9 h-9 stroke-[1.8]" />;
      case 'injection':
        return <Factory className="w-9 h-9 stroke-[1.8]" />;
      default:
        return <Sliders className="w-9 h-9 stroke-[1.8]" />;
    }
  };

  return (
    <div className={`w-full flex-1 flex flex-col items-center justify-between px-3 sm:px-6 py-6 z-10 ${activeTab === 'form' ? 'max-w-[1720px]' : 'max-w-7xl'} mx-auto min-h-[calc(100vh-6rem)]`}>
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 ring-2 ring-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-200 ring-2 ring-rose-300'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Section: Corporate Brand & Main Header */}
      {activeTab !== 'form' && activeTab !== 'editor' && (
      <div className="w-full flex flex-col items-center">

        {/* Main Portal Title & Icon matching conditions of before pages */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3.5 mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-4 ring-white">
              <Sliders className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Add/Remove Inspection
            </h1>
          </div>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Configure QA specifications, register new test benchmarks, and remove or calibrate active quality parameters
          </p>
        </div>
      </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'cards' ? (
        /* Cards View: Dual Cards - Specification Controls & Inspection Editor */
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 my-auto mb-8 px-2">
          {/* Card 1: Specification Controls & Form Generator */}
          <div
            onClick={() => handleOpenAddModal()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenAddModal();
              }
            }}
            className="portal-glass-card rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer select-none border border-white/95 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-md bg-white/90"
            id="card-specification-controls"
            aria-label="Specification Controls & Form Generator"
          >
            {/* Module Icon */}
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                <Sliders className="w-8 h-8 stroke-[1.8]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-2xs group-hover:scale-125 transition-transform" />
            </div>

            {/* Card Title */}
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
              Specification Controls & Form Generator
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6 max-w-xs">
              Manage form directories, customize online and final inspection grids, and export test benchmarks.
            </p>

            {/* Action Button: Open Form Generator */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddModal();
              }}
              className="w-full py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-md group-hover:shadow-blue-500/30 cursor-pointer transform active:scale-[0.98]"
              id="btn-add-inspection-primary"
            >
              <span>Open Form Generator</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Card 2: Inspection Editor (User Requested) */}
          <div
            onClick={() => {
              setActiveTab('editor');
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('editor');
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
              }
            }}
            className="portal-glass-card rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer select-none border border-white/95 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-md bg-white/90"
            id="card-inspection-editor"
            aria-label="Inspection Editor"
          >
            {/* Module Icon */}
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50/90 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                <SlidersHorizontal className="w-8 h-8 stroke-[1.8]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 border-2 border-white rounded-full shadow-2xs group-hover:scale-125 transition-transform" />
            </div>

            {/* Card Title */}
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
              Inspection Editor
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6 max-w-xs">
              Add, remove, and reorder main portal inspection modules and child cards across the factory portal.
            </p>

            {/* Action Button: Open Inspection Editor */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('editor');
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
              }}
              className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:from-indigo-800 active:to-blue-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm shadow-indigo-500/25 flex items-center justify-center gap-2 group-hover:shadow-md group-hover:shadow-indigo-500/30 cursor-pointer transform active:scale-[0.98]"
              id="btn-open-inspection-editor"
            >
              <span>Open Inspection Editor</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      ) : activeTab === 'editor' ? (
        /* Inspection Hierarchy & Cards Editor */
        <div className="w-full my-auto mb-8 animate-in fade-in duration-200">
          <InspectionEditor
            onBack={() => setActiveTab('cards')}
            userId={userId}
          />
        </div>
      ) : activeTab === 'form' ? (
        /* Form Editor Studio matching user requested form editor designs */
        <div className="w-full my-auto mb-8 animate-in fade-in duration-200">
          <FormEditorStudio
            onBack={() => setActiveTab('cards')}
            userId={userId}
            existingSpecsCount={specs.length}
            documentHeader={docHeaderData}
            onUpdateDocumentHeader={setDocHeaderData}
            onDeployToSpecs={(newSpecs) => {
              setSpecs(prev => [...newSpecs, ...prev]);
              showToast(`Deployed ${newSpecs.length} inspection specifications to active standards register!`, 'success');
              setActiveTab('table');
            }}
          />
        </div>
      ) : (
        /* Table View: Full Inspection Register with direct Add & Remove buttons */
        <div className="w-full max-w-7xl my-auto mb-8 portal-glass-card rounded-3xl overflow-hidden shadow-sm border border-slate-200/80">
          <div className="p-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Back to Specification Controls"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Controls</span>
              </button>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Master Inspection Specifications & Checkpoints Register
                </h3>
                <p className="text-xs text-slate-500">
                  Live calibrated test parameters linked to Supabase engineering items.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-slate-600">
                Showing <strong className="text-blue-600">{filteredSpecs.length}</strong> of {specs.length} records
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Inspection</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-100/70 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Spec ID</th>
                  <th className="py-3 px-4">Item Code & Name</th>
                  <th className="py-3 px-4">Series / Category</th>
                  <th className="py-3 px-4">Inspection Parameter</th>
                  <th className="py-3 px-4">Nominal Target</th>
                  <th className="py-3 px-4">Tolerance</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Criticality</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSpecs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No inspection specifications found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredSpecs.map((spec) => (
                    <tr key={spec.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 text-xs">
                        {spec.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{spec.itemName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{spec.itemCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{spec.series}</span>
                        <span className="text-[10px] text-slate-400 block">{spec.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{spec.parameter}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">{spec.equipment}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {spec.nominalTarget} {spec.unit}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                        {spec.tolerance}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          spec.inspectionStage === 'incoming' 
                            ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                            : spec.inspectionStage === 'in-process'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {spec.inspectionStage}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          spec.criticality === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : spec.criticality === 'Major'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {spec.criticality}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{spec.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setItemToRemove(spec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition border border-rose-100"
                          title="Remove this inspection specification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD INSPECTION SPECIFICATION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add New Inspection Specification</h3>
                  <p className="text-xs text-slate-500">Configure parameters, nominal envelope, and link to Supabase items</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add Inspection Form */}
            <form onSubmit={handleCreateInspectionSpec} className="mt-5 space-y-4">
              {/* Target Series Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Production Series
                  </label>
                  <select
                    value={formSeries}
                    onChange={(e) => {
                      const seriesVal = e.target.value;
                      setFormSeries(seriesVal);
                      const rel = getFilteredDbItems(seriesVal);
                      if (rel.length > 0) {
                        setFormItemCode(rel[0].item_code);
                        setFormItemName(rel[0].description);
                        setFormCategory(rel[0].category || 'General');
                      }
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="White Series">White Series</option>
                    <option value="Modular/Nature">Modular/Nature Series</option>
                    <option value="LED">LED & Luminaire Series</option>
                    <option value="Protection">Protection Series (Safetaa / Hexa)</option>
                    <option value="Automation">Automation & In-Line</option>
                    <option value="Injection Molding">Injection Molding & Tooling</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Inspection Stage
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="in-process">Online / In-Process Inspection</option>
                    <option value="incoming">Incoming Material Receiving</option>
                    <option value="final">Final Quality Audit & Release</option>
                  </select>
                </div>
              </div>

              {/* Part Name / Item Selection from Supabase database */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Select Part Name / Item Code (Supabase Database)
                  </label>
                  <span className="text-[11px] font-semibold text-blue-600">
                    {isLoadingItems ? 'Loading items...' : `${getFilteredDbItems(formSeries).length} items available`}
                  </span>
                </div>
                {isLoadingItems ? (
                  <div className="text-xs text-slate-400 py-2">Loading items from Supabase...</div>
                ) : (
                  <select
                    value={formItemCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setFormItemCode(code);
                      const found = items.find(it => it.item_code === code);
                      if (found) {
                        setFormItemName(found.description);
                        if (found.category) setFormCategory(found.category);
                      }
                    }}
                    required
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>-- Select Supabase Registered Item --</option>
                    {getFilteredDbItems(formSeries).map((item) => (
                      <option key={item.item_code} value={item.item_code}>
                        {item.description} ({item.item_code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Parameter Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Inspection Parameter / Checkpoint Name *
                </label>
                <input
                  type="text"
                  required
                  value={formParameter}
                  onChange={(e) => setFormParameter(e.target.value)}
                  placeholder="e.g. Contact Resistance, Dimension Tolerance, Voltage Flash, Switch Force"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Metrology Envelope: Nominal, Tolerance, Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nominal Target
                  </label>
                  <input
                    type="text"
                    required
                    value={formNominal}
                    onChange={(e) => setFormNominal(e.target.value)}
                    placeholder="e.g. 45.00, 250, <15"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tolerance (±)
                  </label>
                  <input
                    type="text"
                    value={formTolerance}
                    onChange={(e) => setFormTolerance(e.target.value)}
                    placeholder="e.g. ±0.05, ±2%"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unit
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mm">mm (Millimeters)</option>
                    <option value="µm">µm (Microns)</option>
                    <option value="mΩ">mΩ (Milliohms)</option>
                    <option value="V">V (Volts)</option>
                    <option value="A">A (Amperes)</option>
                    <option value="N">N (Newtons)</option>
                    <option value="N·m">N·m (Torque)</option>
                    <option value="s">s (Seconds)</option>
                    <option value="lm">lm (Lumens)</option>
                    <option value="Visual">Visual Inspection</option>
                  </select>
                </div>
              </div>

              {/* Equipment & Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Testing Instrument / Tool
                  </label>
                  <input
                    type="text"
                    value={formEquipment}
                    onChange={(e) => setFormEquipment(e.target.value)}
                    placeholder="e.g. Digital Micrometer, Hi-Pot Tester, Force Gauge"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sampling Frequency
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="100% In-Line Test">100% In-Line Test</option>
                    <option value="AQL 0.65 Level II">AQL 0.65 Level II</option>
                    <option value="5 pcs / Production Run">5 pcs / Production Run</option>
                    <option value="1 pc / Hourly Station Check">1 pc / Hourly Station Check</option>
                  </select>
                </div>
              </div>

              {/* Criticality & Revision */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Criticality Severity
                  </label>
                  <select
                    value={formCriticality}
                    onChange={(e) => setFormCriticality(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Critical">Critical (Immediate Line Stop)</option>
                    <option value="Major">Major (High Yield Impact)</option>
                    <option value="Minor">Minor (Cosmetic / Baseline)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Engineering Rev Benchmark
                  </label>
                  <input
                    type="text"
                    value={formRevision}
                    onChange={(e) => setFormRevision(e.target.value)}
                    placeholder="e.g. Rev A.2, Rev C.1"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  Deploy Inspection Spec
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REMOVE INSPECTION MANAGER */}
      {isRemoveManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Remove Active Inspection Specifications
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select any obsolete checkpoint below to decommission it from active quality standards
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRemoveManagerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of all specs with direct remove button */}
            <div className="my-5 space-y-3">
              {specs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  No active inspection specifications remaining in the system.
                </div>
              ) : (
                specs.map((spec) => (
                  <div 
                    key={spec.id} 
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:shadow-xs transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700">{spec.id}</span>
                        <span className="text-xs font-bold text-slate-900">{spec.parameter}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          spec.criticality === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {spec.criticality}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                          {spec.inspectionStage}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        <strong>Part:</strong> {spec.itemName} <span className="font-mono text-slate-400">({spec.itemCode})</span> • <span className="text-slate-500">{spec.series}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                        <span>Target: <strong className="font-mono text-slate-800">{spec.nominalTarget} {spec.unit}</strong></span>
                        <span>Tolerance: <strong className="font-mono text-emerald-700">{spec.tolerance}</strong></span>
                        <span>Instrument: <strong>{spec.equipment}</strong></span>
                      </div>
                    </div>

                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={() => setItemToRemove(spec)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl transition border border-rose-200 self-end sm:self-center cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Spec</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Total <strong className="text-slate-900">{specs.length}</strong> active inspection checkpoints
              </span>

              <button
                type="button"
                onClick={() => setIsRemoveManagerOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CATEGORY SPECIFICATIONS DRAWER & REMOVE INSPECTIONS */}
      {selectedCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {getCardIcon(selectedCategoryModal.iconType)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedCategoryModal.name} Specifications
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standard: {selectedCategoryModal.nominalStandard} • Review and remove active checkpoints
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategoryModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Specs in this category */}
            <div className="my-5 space-y-3">
              {specs.filter(s => s.series.toLowerCase().includes(selectedCategoryModal.seriesKey.toLowerCase())).length === 0 ? (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  No inspection specifications currently assigned to {selectedCategoryModal.name}.
                </div>
              ) : (
                specs
                  .filter(s => s.series.toLowerCase().includes(selectedCategoryModal.seriesKey.toLowerCase()))
                  .map((spec) => (
                    <div 
                      key={spec.id} 
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">{spec.id}</span>
                          <span className="text-xs font-bold text-slate-900">{spec.parameter}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            spec.criticality === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {spec.criticality}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          <strong>Part:</strong> {spec.itemName} <span className="font-mono text-slate-400">({spec.itemCode})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                          <span>Target: <strong className="font-mono text-slate-800">{spec.nominalTarget} {spec.unit}</strong></span>
                          <span>Tolerance: <strong className="font-mono text-emerald-700">{spec.tolerance}</strong></span>
                          <span>Tool: <strong>{spec.equipment}</strong></span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => setItemToRemove(spec)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl transition border border-rose-200 self-end sm:self-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryModal(null);
                  handleOpenAddModal(selectedCategoryModal);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Spec to {selectedCategoryModal.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategoryModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM REMOVAL OF INSPECTION */}
      {itemToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Confirm Inspection Removal?
            </h3>

            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to remove the inspection specification for{' '}
              <strong className="text-slate-900">{itemToRemove.parameter}</strong> ({itemToRemove.id})?
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs mb-5 border border-slate-100 space-y-1">
              <div><strong>Item:</strong> {itemToRemove.itemName}</div>
              <div><strong>Code:</strong> <span className="font-mono text-slate-500">{itemToRemove.itemCode}</span></div>
              <div><strong>Nominal:</strong> {itemToRemove.nominalTarget} {itemToRemove.unit} ({itemToRemove.tolerance})</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setItemToRemove(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                Yes, Remove Spec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Button matching before pages conditions */}
      <div className="w-full flex justify-center mt-8 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg border border-slate-200/80 transition-all duration-200 cursor-pointer group"
          id="btn-back-to-admin-dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-1" />
          <span>Back to QA Admin Dashboard</span>
        </button>
      </div>
    </div>
  );
};
