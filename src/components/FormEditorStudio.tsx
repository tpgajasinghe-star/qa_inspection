import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Layers, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Calendar, 
  Type, 
  ChevronDown, 
  CircleDot, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  RotateCcw, 
  FileText, 
  Tag, 
  Printer, 
  Download, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown,
  Table,
  Columns,
  Rows,
  Eye,
  Sliders,
  CheckSquare,
  ListFilter,
  Clock,
  TestTube,
  Star,
  FolderPlus,
  Paperclip,
  ShieldCheck,
  PenTool
} from 'lucide-react';
import { InspectionSpecItem } from './AddRemoveInspectionPortal';
import { FormCardsGallery, InspectionFormCardData } from './FormCardsGallery';
import { getMainCards, getChildCards, InspectionHierarchyCard } from '../inspectionHierarchyData';
import { deployInspectionForm } from '../deployedFormsData';
import { RoundClockTimePickerModal } from './RoundClockTimePickerModal';

// Footer Section Block Data Model (matching user's reference image)
export interface FormFooterAttachment {
  id: string;
  name: string;
  size: string;
}

export interface FormFooterData {
  enabled: boolean;
  remarks: string;
  onlineInspectorName: string;
  finalInspectorName: string;
  attachments?: FormFooterAttachment[];
  onlineEmpNo?: string;
  onlineVerified?: boolean;
  onlineVerifyTime?: string;
  onlineSignatureImage?: string;
  finalEmpNo?: string;
  finalSigned?: boolean;
  finalSealText?: string;
  finalSignatureImage?: string;
}

export const DEFAULT_FORM_FOOTER: FormFooterData = {
  enabled: true,
  remarks: '',
  attachments: [],
  onlineInspectorName: '',
  onlineEmpNo: '',
  finalInspectorName: '',
  finalEmpNo: '',
};

// Document Header Section Data Model
export interface DocumentHeaderData {
  documentNo: string;
  dateOfIssue: string;
  revisionNo: string;
  documentType: string;
  productType: string;
  refStandard?: string;
}

// Reference Section 1 standard elements matching user's inspection form image
// (Dummy elements removed: Production Sheet Number, Quantity (Pcs), Date Code Reference, Online Checked by Assembly Line)
export const REFERENCE_SECTION_1_ELEMENTS: SectionElementSchema[] = [
  { id: 'el-date', name: 'Inspection Date', type: 'date_picker', subItems: [] },
  { id: 'el-batch', name: 'Batch Number Reference', type: 'data_field', subItems: [] },
  { id: 'el-desc', name: 'Product Description', type: 'data_field', subItems: [] },
  { id: 'el-item-code', name: 'Item Code Reference', type: 'data_field', subItems: [] },
];

export const REFERENCE_SECTION_1_SAVED_DATA: Record<string, string> = {
  'el-date': '',
  'el-batch': '',
  'el-desc': '',
  'el-item-code': '',
};

// Element types supported: Data field, Date picker, Dropdown list, Radio button, Online Inspection Table Grid, Final Inspection Table Grid
export type ElementType = 'data_field' | 'date_picker' | 'dropdown' | 'radio' | 'table_grid' | 'final_table_grid';

export const isTableElement = (type: ElementType): boolean =>
  type === 'table_grid' || type === 'final_table_grid';

// Input types for specific table columns (e.g. Dropdowns for intervals, Text/Labels for specifications)
export type ColumnInputType = 'text_label' | 'dropdown' | 'text_input' | 'number_input';

export interface TableColumnSchema {
  id: string;
  header: string; // e.g., 'MIC NO', 'Parameter', 'time 1', 'time 2', 'Sample 1', 'Specifications'
  type: ColumnInputType; // Dropdowns for intervals/samples, Text/Labels for specifications, etc.
  options?: string[]; // Options for Dropdown column, e.g. ['Pass', 'Fail', 'N/A']
  width?: string;
  hasTimeHeader?: boolean; // When true (or when column header is time 1, time 2, etc.), shows small textbox in column header to enter the exact time
  defaultHeaderTime?: string; // Initial or default time string, e.g. '08:30 AM'
}

export interface TableRowSchema {
  id: string;
  isGroupHeader: boolean;
  groupTitle?: string; // e.g., '1 VISUAL INSPECTION', 'COORDINATION & ASSEMBLY FIT'
  cells: Record<string, string>; // columnId -> cell value or specification note
  inputType?: 'dropdown' | 'text' | 'number'; // Allows parameter row to accept manual text entry (e.g. Voltage drop test values)
  unit?: string; // e.g., 'mV', 'V', 'N·m', 'Ω'
}

export interface TableGridConfig {
  columns: TableColumnSchema[];
  rows: TableRowSchema[];
}

export interface SectionElementSchema {
  id: string;
  name: string;
  type: ElementType;
  subItems: string[]; // Options for Dropdown list and Radio button
  tableConfig?: TableGridConfig; // Table configuration when type is 'table_grid' or 'final_table_grid'
}

// Default standard QA Inspection Table structure matching user's reference image
export const DEFAULT_QA_TABLE_COLUMNS: TableColumnSchema[] = [
  { id: 'col-mic', header: 'MIC NO', type: 'text_label', width: '85px' },
  { id: 'col-param', header: 'Parameter', type: 'text_label', width: '220px' },
  { id: 'col-t1', header: 'time 1', type: 'dropdown', options: ['Pass', 'Fail', 'N/A'], hasTimeHeader: true, defaultHeaderTime: '' },
  { id: 'col-t2', header: 'time 2', type: 'dropdown', options: ['Pass', 'Fail', 'N/A'], hasTimeHeader: true, defaultHeaderTime: '' },
  { id: 'col-specs', header: 'Specifications', type: 'text_label', width: '240px' },
];

export const DEFAULT_QA_TABLE_ROWS: TableRowSchema[] = [
  {
    id: 'row-gh-1',
    isGroupHeader: true,
    groupTitle: '1. ONLINE / VISUAL INSPECTION',
    cells: {},
  },
  {
    id: 'row-dr-1',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-mic': '01',
      'col-param': '1.1 Appearance',
      'col-t1': '--Select--',
      'col-t2': '--Select--',
      'col-specs': 'Clean finish, no flashes, cracks, sink marks or discoloration',
    },
  },
  {
    id: 'row-dr-2',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-mic': '02',
      'col-param': '1.2 Markings & Labeling',
      'col-t1': '--Select--',
      'col-t2': '--Select--',
      'col-specs': 'Legible print, SLS 734 certification mark & ratings visible',
    },
  },
  {
    id: 'row-dr-3',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-mic': '03',
      'col-param': '1.3 Color & Surface Finish',
      'col-t1': '--Select--',
      'col-t2': '--Select--',
      'col-specs': 'Uniform batch color shade, scratch-free, oil/grease free',
    },
  },
  {
    id: 'row-dr-4',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-mic': '04',
      'col-param': '1.4 Mould Parting Line & Cleanliness',
      'col-t1': '--Select--',
      'col-t2': '--Select--',
      'col-specs': 'Flush assembly seam, zero burrs, clean component ejector points',
    },
  },
];

// Default standard Final Inspection Table structure with 3 default samples
export const DEFAULT_FINAL_INSPECTION_TABLE_COLUMNS: TableColumnSchema[] = [
  { id: 'col-fi-mic', header: 'MIC NO', type: 'text_label', width: '85px' },
  { id: 'col-fi-param', header: 'Parameter', type: 'text_label', width: '220px' },
  { id: 'col-fi-s1', header: 'Sample 1', type: 'dropdown', options: ['Pass', 'Fail', 'N/A'], width: '105px' },
  { id: 'col-fi-s2', header: 'Sample 2', type: 'dropdown', options: ['Pass', 'Fail', 'N/A'], width: '105px' },
  { id: 'col-fi-s3', header: 'Sample 3', type: 'dropdown', options: ['Pass', 'Fail', 'N/A'], width: '105px' },
  { id: 'col-fi-specs', header: 'Specifications', type: 'text_label', width: '240px' },
];

export const DEFAULT_FINAL_INSPECTION_TABLE_ROWS: TableRowSchema[] = [
  {
    id: 'row-fi-gh-1',
    isGroupHeader: true,
    groupTitle: '1. ELECTRICAL & DIELECTRIC SAFETY TESTS',
    cells: {},
  },
  {
    id: 'row-fi-dr-1',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '01',
      'col-fi-param': '1.1 High Voltage Flash Test (2000V AC)',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': 'No breakdown or flashover for 1 min (SLS 734 Cl. 15)',
    },
  },
  {
    id: 'row-fi-dr-2',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '02',
      'col-fi-param': '1.2 Insulation Resistance (500V DC)',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': '≥ 5.0 MΩ between live parts & body',
    },
  },
  {
    id: 'row-fi-dr-3',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '03',
      'col-fi-param': '1.3 Earth Continuity / Ground Bond',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': 'Resistance ≤ 0.05 Ω at 25A test current',
    },
  },
  {
    id: 'row-fi-dr-vdrop',
    isGroupHeader: false,
    inputType: 'text',
    cells: {
      'col-fi-mic': '04',
      'col-fi-param': '1.4 Voltage Drop Test (Terminal to Contact)',
      'col-fi-s1': '',
      'col-fi-s2': '',
      'col-fi-s3': '',
      'col-fi-specs': 'Voltage drop ≤ 45 mV at 13A rated load (SLS 734 Cl. 13)',
    },
  },
  {
    id: 'row-fi-gh-2',
    isGroupHeader: true,
    groupTitle: '2. COORDINATION, MECHANICAL & ASSEMBLY TESTS',
    cells: {},
  },
  {
    id: 'row-fi-dr-4',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '05',
      'col-fi-param': '2.1 Rocker Snap Action & Fit',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': 'Smooth positive engagement, no sticking, positive latching',
    },
  },
  {
    id: 'row-fi-dr-5',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '06',
      'col-fi-param': '2.2 Safety Shutter & Pin Withdrawal Force',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': 'Withdrawal force 1.5 N - 5.4 N; opens on earth pin entry only',
    },
  },
  {
    id: 'row-fi-dr-6',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '07',
      'col-fi-param': '2.3 Terminal Screws Tightening Torque',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': '1.20 N·m (±0.15 N·m) SLS standard torque verification',
    },
  },
  {
    id: 'row-fi-dr-7',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '08',
      'col-fi-param': '2.4 Switch Contact Resistance & Temp Rise',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': 'Temp rise ≤ 45K at 13A rated load (SLS 734)',
    },
  },
  {
    id: 'row-fi-dr-8',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '09',
      'col-fi-param': '2.5 Mechanical Strength & Drop Test',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': 'No crack, damage or loose live parts after 50 cm drop test',
    },
  },
  {
    id: 'row-fi-gh-3',
    isGroupHeader: true,
    groupTitle: '3. PACKAGING & FINAL LOT DISPOSITION',
    cells: {},
  },
  {
    id: 'row-fi-dr-9',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '10',
      'col-fi-param': '3.1 Shipper Carton Packaging & Barcode',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': 'Barcode scanner readable, carton seal tape intact, batch qty verified',
    },
  },
  {
    id: 'row-fi-dr-10',
    isGroupHeader: false,
    inputType: 'dropdown',
    cells: {
      'col-fi-mic': '11',
      'col-fi-param': '3.2 Final Lot Acceptance Disposition',
      'col-fi-s1': '--Select--',
      'col-fi-s2': '--Select--',
      'col-fi-s3': '--Select--',
      'col-fi-specs': 'AQL 1.0 General Inspection Level II - Conforms',
    },
  },
];

export const REFERENCE_SECTION_2_ONLINE_ELEMENTS: SectionElementSchema[] = [
  {
    id: 'el-online-table-grid',
    name: 'Online / Visual QA Inspection Grid',
    type: 'table_grid',
    subItems: [],
    tableConfig: {
      columns: DEFAULT_QA_TABLE_COLUMNS,
      rows: DEFAULT_QA_TABLE_ROWS,
    },
  },
];

export const REFERENCE_SECTION_3_FINAL_ELEMENTS: SectionElementSchema[] = [
  {
    id: 'el-final-table-grid',
    name: 'Final Inspection Grid (Sample Testing)',
    type: 'final_table_grid',
    subItems: [],
    tableConfig: {
      columns: DEFAULT_FINAL_INSPECTION_TABLE_COLUMNS,
      rows: DEFAULT_FINAL_INSPECTION_TABLE_ROWS,
    },
  },
];

export interface SectionBlockSchema {
  id: string;
  sectionNumber: number;
  title: string;
  elements: SectionElementSchema[];
  isSaved: boolean;
  // User entered form values in live preview
  savedData?: Record<string, string>;
}

export const LOCAL_STORAGE_FORMS_KEY = 'qc_inspection_forms_v2';

export const DEFAULT_FORMS_INITIAL: InspectionFormCardData[] = [
  {
    id: 'form-testing-1',
    name: 'Testing_1',
    isOngoing: true,
    status: 'Draft',
    createdAt: '2026-10-10',
    updatedAt: 'Just now',
    documentHeader: {
      documentNo: 'F 17/3-2.1',
      dateOfIssue: '2024-03-20',
      revisionNo: '04',
      documentType: 'Online & Final Inspection Report',
      productType: 'White Series – Switched Socket Outlet',
      refStandard: 'SLS 734',
    },
    sections: [
      {
        id: 'section-1',
        sectionNumber: 1,
        title: 'DIGITAL FACTORY INSPECTION LOG',
        elements: REFERENCE_SECTION_1_ELEMENTS,
        isSaved: true,
        savedData: REFERENCE_SECTION_1_SAVED_DATA,
      },
      {
        id: 'section-2',
        sectionNumber: 2,
        title: '2. ONLINE / VISUAL INSPECTION',
        elements: REFERENCE_SECTION_2_ONLINE_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
      {
        id: 'section-3',
        sectionNumber: 3,
        title: '3. FINAL INSPECTION (SAMPLE TESTING)',
        elements: REFERENCE_SECTION_3_FINAL_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
    ],
    notes: 'Ongoing production inspection template with calibrated Online & Final testing matrices.',
    productSeries: 'White Series',
    footer: DEFAULT_FORM_FOOTER,
  },
  {
    id: 'form-modular-2',
    name: 'Modular_Switch_QA_2',
    status: 'Pending',
    createdAt: '2026-10-11',
    updatedAt: 'Yesterday',
    documentHeader: {
      documentNo: 'F 18/2-1.4',
      dateOfIssue: '2024-04-12',
      revisionNo: '02',
      documentType: 'Modular Series QA Inspection Report',
      productType: 'Modular/Nature – 2 Gang Plate & Switch',
      refStandard: 'IEC 60669-1',
    },
    sections: [
      {
        id: 'section-1',
        sectionNumber: 1,
        title: 'DIGITAL FACTORY INSPECTION LOG',
        elements: REFERENCE_SECTION_1_ELEMENTS,
        isSaved: true,
        savedData: {
          'el-date': '',
          'el-batch': '',
          'el-desc': '',
          'el-item-code': '',
        },
      },
      {
        id: 'section-2',
        sectionNumber: 2,
        title: '2. ONLINE / VISUAL INSPECTION',
        elements: REFERENCE_SECTION_2_ONLINE_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
      {
        id: 'section-3',
        sectionNumber: 3,
        title: '3. FINAL INSPECTION (SAMPLE TESTING)',
        elements: REFERENCE_SECTION_3_FINAL_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
    ],
    notes: 'Pending QA verification for luxury modular switch product line.',
    productSeries: 'Modular/Nature',
    footer: DEFAULT_FORM_FOOTER,
  },
  {
    id: 'form-led-3',
    name: 'LED_Driver_Ballast_Spec',
    status: 'Draft',
    createdAt: '2026-10-11',
    updatedAt: '2 days ago',
    documentHeader: {
      documentNo: 'F 21/5-3.0',
      dateOfIssue: '2024-05-18',
      revisionNo: '01',
      documentType: 'Solid State LED Photometric Log',
      productType: 'LED & Luminaire – 18W Slim Batten Driver',
      refStandard: 'IEC 62560 Photometry',
    },
    sections: [
      {
        id: 'section-1',
        sectionNumber: 1,
        title: 'DIGITAL FACTORY INSPECTION LOG',
        elements: REFERENCE_SECTION_1_ELEMENTS,
        isSaved: true,
        savedData: {
          'el-date': '',
          'el-batch': '',
          'el-desc': '',
          'el-item-code': '',
        },
      },
      {
        id: 'section-2',
        sectionNumber: 2,
        title: '2. ONLINE / VISUAL INSPECTION',
        elements: REFERENCE_SECTION_2_ONLINE_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
    ],
    notes: 'Photometry and driver ballast inspection specification sheet.',
    productSeries: 'LED & Luminaire',
    footer: DEFAULT_FORM_FOOTER,
  },
];

interface FormEditorStudioProps {
  onBack: () => void;
  userId?: string;
  onDeployToSpecs?: (newSpecs: InspectionSpecItem[]) => void;
  existingSpecsCount?: number;
  documentHeader?: DocumentHeaderData;
  onUpdateDocumentHeader?: (header: DocumentHeaderData) => void;
}

export const FormEditorStudio: React.FC<FormEditorStudioProps> = ({
  onBack,
  userId,
  onDeployToSpecs,
  documentHeader,
  onUpdateDocumentHeader,
}) => {
  // Multi-Form View Mode: 'cards' (Cards directory of pending forms) vs 'editor' (Form Generator editor)
  const [viewMode, setViewMode] = useState<'cards' | 'editor'>('cards');

  // Multi-Form collection: Ongoing form is explicitly named and saved as card "Testing_1"
  const [forms, setForms] = useState<InspectionFormCardData[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FORMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Explicit requirement: Ongoing form must be named and saved as card "Testing_1"
          const hasTesting1 = parsed.some(f => f.name === 'Testing_1');
          if (!hasTesting1) {
            parsed[0].name = 'Testing_1';
            parsed[0].isOngoing = true;
          }
          // Sanitize table grids: dropdowns default to --Select--, manual text rows have blank space (no dummy values)
          parsed.forEach((form: InspectionFormCardData) => {
            if (form.footer) {
              if (form.footer.onlineInspectorName === 'H. P. Karunaratne' || form.footer.onlineInspectorName?.includes('Karunaratne')) form.footer.onlineInspectorName = '';
              if (form.footer.onlineEmpNo === 'EMP-4102' || form.footer.onlineEmpNo?.includes('4102')) form.footer.onlineEmpNo = '';
              if (form.footer.finalInspectorName === 'M. Vigneshwaran' || form.footer.finalInspectorName?.includes('Vigneshwaran')) form.footer.finalInspectorName = '';
              if (form.footer.finalEmpNo === 'QC-Lead-09' || form.footer.finalEmpNo?.includes('Lead-09')) form.footer.finalEmpNo = '';
            }
            form.sections?.forEach((sec) => {
              if (sec.savedData) {
                Object.keys(sec.savedData).forEach((k) => {
                  const val = sec.savedData?.[k] || '';
                  if (
                    val.startsWith('BATCH-2026-') ||
                    val.startsWith('KEV-') ||
                    val.startsWith('LOT-LED-') ||
                    val.startsWith('ITEM-') ||
                    k === 'el-batch' ||
                    k === 'el-item-code'
                  ) {
                    sec.savedData[k] = '';
                  }
                });
              }
              sec.elements?.forEach((el) => {
                if (el.tableConfig?.rows) {
                  el.tableConfig.rows.forEach((r) => {
                    const isManual = r.inputType === 'text' || r.inputType === 'number' || (r.inputType !== 'dropdown' && /voltage drop/i.test(r.cells['col-fi-param'] || r.cells['col-param'] || ''));
                    el.tableConfig?.columns?.forEach((col) => {
                      if (col.type === 'dropdown') {
                        if (isManual) {
                          if (r.cells[col.id] === 'Pass' || r.cells[col.id] === '18.4 mV' || r.cells[col.id] === '19.1 mV' || r.cells[col.id] === '17.8 mV') {
                            r.cells[col.id] = '';
                          }
                        } else if (r.cells[col.id] === 'Pass' && !sec.savedData?.[`${el.id}_${r.id}_${col.id}`]) {
                          r.cells[col.id] = '--Select--';
                        }
                      }
                    });
                  });
                }
              });
            });
          });
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed reading forms from storage', e);
    }
    return DEFAULT_FORMS_INITIAL;
  });

  // Active form ID currently loaded in editor
  const [activeFormId, setActiveFormId] = useState<string>(() => {
    return forms[0]?.id || 'form-testing-1';
  });

  // Current active form model
  const activeForm = forms.find(f => f.id === activeFormId) || forms[0] || DEFAULT_FORMS_INITIAL[0];

  // Document Header state initialized from active form
  const [headerData, setHeaderData] = useState<DocumentHeaderData>(() => {
    return activeForm?.documentHeader || {
      documentNo: 'F 17/3-2.1',
      dateOfIssue: '2024-03-20',
      revisionNo: '04',
      documentType: 'Online & Final Inspection Report',
      productType: 'White Series – Switched Socket Outlet',
      refStandard: 'SLS 734'
    };
  });

  // State for all section blocks initialized from active form
  const [sections, setSections] = useState<SectionBlockSchema[]>(() => {
    return activeForm?.sections || DEFAULT_FORMS_INITIAL[0].sections;
  });

  // Footer Section Block State (Remarks, Online Inspection, Final Inspection)
  const [footerData, setFooterData] = useState<FormFooterData>(() => {
    const raw = activeForm?.footer || DEFAULT_FORM_FOOTER;
    return {
      ...raw,
      onlineInspectorName: (raw.onlineInspectorName === 'H. P. Karunaratne' ? '' : raw.onlineInspectorName) || '',
      onlineEmpNo: (raw.onlineEmpNo === 'EMP-4102' ? '' : raw.onlineEmpNo) || '',
      finalInspectorName: (raw.finalInspectorName === 'M. Vigneshwaran' ? '' : raw.finalInspectorName) || '',
      finalEmpNo: (raw.finalEmpNo === 'QC-Lead-09' ? '' : raw.finalEmpNo) || '',
    };
  });
  const editableFooterFileInputRef = useRef<HTMLInputElement | null>(null);
  const liveFooterFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFooterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newAtt: FormFooterAttachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };
    setFooterData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAtt],
    }));
    showToast(`Attached file "${file.name}" to remarks.`);
    e.target.value = '';
  };

  const handleRemoveFooterAttachment = (id: string) => {
    setFooterData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== id),
    }));
  };

  // Validation state when user attempts to create a section block without required header fields
  const [attemptedSectionWithoutHeader, setAttemptedSectionWithoutHeader] = useState(false);

  // Direct header update handler (changes reflect immediately without any popup)
  const handleUpdateHeaderField = (field: keyof DocumentHeaderData, value: string) => {
    const updated = { ...headerData, [field]: value };
    setHeaderData(updated);
    if (onUpdateDocumentHeader) {
      onUpdateDocumentHeader(updated);
    }
  };

  // Editor-level quick modals
  const [isEditorRenameModalOpen, setIsEditorRenameModalOpen] = useState(false);
  const [editorRenameValue, setEditorRenameValue] = useState('');
  const [isEditorNewFormModalOpen, setIsEditorNewFormModalOpen] = useState(false);
  const [editorNewFormName, setEditorNewFormName] = useState('');
  const [editorNewFormDocNo, setEditorNewFormDocNo] = useState('');
  const [editorNewFormProduct, setEditorNewFormProduct] = useState('White Series – Switched Socket Outlet');
  const [editorNewFormTemplate, setEditorNewFormTemplate] = useState<'full' | 'online' | 'final' | 'blank'>('full');
  const [editorNewFormError, setEditorNewFormError] = useState('');

  // Deployment Destination Modal State (Deploy to Specifications / Inspection Portal)
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [deployMainId, setDeployMainId] = useState<string>('main-inprocess');
  const [deployChildId, setDeployChildId] = useState<string>('child-white-series');
  const [deployProductType, setDeployProductType] = useState<string>('');
  const [deployFormName, setDeployFormName] = useState<string>('');

  // 12-hour round clock time picker modal state for Form Generator
  const [studioClockPicker, setStudioClockPicker] = useState<{
    isOpen: boolean;
    headerTitle: string;
    initialValue: string;
    onApply: (newTime: string) => void;
  } | null>(null);

  // Persist forms to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FORMS_KEY, JSON.stringify(forms));
    } catch (e) {
      console.error('Failed saving forms to storage', e);
    }
  }, [forms]);

  // Keep active form in forms array synced with editor state
  useEffect(() => {
    if (activeFormId && sections && headerData) {
      setForms(prev =>
        prev.map(f =>
          f.id === activeFormId
            ? {
                ...f,
                documentHeader: headerData,
                sections: sections,
                footer: footerData,
                updatedAt: 'Just now',
              }
            : f
        )
      );
    }
  }, [sections, headerData, footerData, activeFormId]);
  
  // Modal for creating/naming a new section block
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionBlockName, setSectionBlockName] = useState('');
  
  // Inline renaming for section block title
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitleValue, setEditSectionTitleValue] = useState('');

  // Modal for adding an element into a specific section block
  const [activeSectionForElement, setActiveSectionForElement] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [elementName, setElementName] = useState('');
  const [elementType, setElementType] = useState<ElementType>('data_field');
  const [subItemInput, setSubItemInput] = useState('');
  const [subItemsList, setSubItemsList] = useState<string[]>([]);
  const [elementFormError, setElementFormError] = useState<string | null>(null);

  // Table / Grid configuration state inside modal
  const [tableColumns, setTableColumns] = useState<TableColumnSchema[]>(DEFAULT_QA_TABLE_COLUMNS);
  const [tableRows, setTableRows] = useState<TableRowSchema[]>(DEFAULT_QA_TABLE_ROWS);
  const [tableConfigSubTab, setTableConfigSubTab] = useState<'columns' | 'rows' | 'preview'>('columns');

  // Controls for adding custom columns
  const [newColHeader, setNewColHeader] = useState('');
  const [newColType, setNewColType] = useState<ColumnInputType>('dropdown');
  const [newColDropdownOptions, setNewColDropdownOptions] = useState('Pass, Fail, N/A');
  const [newColHasTime, setNewColHasTime] = useState(false);
  const [newColDefaultTime, setNewColDefaultTime] = useState('');

  // Controls for adding group headers & rows
  const [newGroupHeaderTitle, setNewGroupHeaderTitle] = useState('');
  const [newDataRowMic, setNewDataRowMic] = useState('');
  const [newDataRowParam, setNewDataRowParam] = useState('');
  const [newDataRowSpec, setNewDataRowSpec] = useState('');
  const [newDataRowInputType, setNewDataRowInputType] = useState<'dropdown' | 'text'>('dropdown');

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sectionNameInputRef = useRef<HTMLInputElement>(null);
  const elementNameInputRef = useRef<HTMLInputElement>(null);
  const subItemInputRef = useRef<HTMLInputElement>(null);

  // Auto focus for section modal
  useEffect(() => {
    if (isSectionModalOpen) {
      setTimeout(() => {
        sectionNameInputRef.current?.focus();
      }, 50);
    }
  }, [isSectionModalOpen]);

  // Auto focus for element modal
  useEffect(() => {
    if (activeSectionForElement) {
      setTimeout(() => {
        elementNameInputRef.current?.focus();
      }, 50);
    }
  }, [activeSectionForElement]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Select a form from cards
  const handleSelectFormFromCards = (formId: string) => {
    const target = forms.find(f => f.id === formId);
    if (!target) return;
    setActiveFormId(formId);
    setHeaderData(target.documentHeader);
    setSections(target.sections);
    if (onUpdateDocumentHeader) {
      onUpdateDocumentHeader(target.documentHeader);
    }
    setViewMode('editor');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    showToast(`Opened "${target.name}" in Form Generator Studio!`);
  };

  // Create new form from modal prompt
  const handleCreateNewForm = (
    name: string,
    templateType: 'full' | 'online' | 'final' | 'blank',
    productType: string,
    docNo: string
  ) => {
    let initialSections: SectionBlockSchema[] = [];

    if (templateType === 'full') {
      initialSections = [
        {
          id: `section-1-${Date.now()}`,
          sectionNumber: 1,
          title: 'DIGITAL FACTORY INSPECTION LOG',
          elements: REFERENCE_SECTION_1_ELEMENTS,
          isSaved: true,
          savedData: REFERENCE_SECTION_1_SAVED_DATA,
        },
        {
          id: `section-2-${Date.now()}`,
          sectionNumber: 2,
          title: '2. ONLINE / VISUAL INSPECTION',
          elements: REFERENCE_SECTION_2_ONLINE_ELEMENTS,
          isSaved: true,
          savedData: {},
        },
        {
          id: `section-3-${Date.now()}`,
          sectionNumber: 3,
          title: '3. FINAL INSPECTION (SAMPLE TESTING)',
          elements: REFERENCE_SECTION_3_FINAL_ELEMENTS,
          isSaved: true,
          savedData: {},
        },
      ];
    } else if (templateType === 'online') {
      initialSections = [
        {
          id: `section-1-${Date.now()}`,
          sectionNumber: 1,
          title: 'DIGITAL FACTORY INSPECTION LOG',
          elements: REFERENCE_SECTION_1_ELEMENTS,
          isSaved: true,
          savedData: REFERENCE_SECTION_1_SAVED_DATA,
        },
        {
          id: `section-2-${Date.now()}`,
          sectionNumber: 2,
          title: '2. ONLINE / VISUAL INSPECTION',
          elements: REFERENCE_SECTION_2_ONLINE_ELEMENTS,
          isSaved: true,
          savedData: {},
        },
      ];
    } else if (templateType === 'final') {
      initialSections = [
        {
          id: `section-1-${Date.now()}`,
          sectionNumber: 1,
          title: 'DIGITAL FACTORY INSPECTION LOG',
          elements: REFERENCE_SECTION_1_ELEMENTS,
          isSaved: true,
          savedData: REFERENCE_SECTION_1_SAVED_DATA,
        },
        {
          id: `section-2-${Date.now()}`,
          sectionNumber: 2,
          title: '2. FINAL INSPECTION (SAMPLE TESTING)',
          elements: REFERENCE_SECTION_3_FINAL_ELEMENTS,
          isSaved: true,
          savedData: {},
        },
      ];
    } else {
      initialSections = [
        {
          id: `section-1-${Date.now()}`,
          sectionNumber: 1,
          title: '1. INSPECTION SECTION',
          elements: [],
          isSaved: true,
          savedData: {},
        },
      ];
    }

    const newHeader: DocumentHeaderData = {
      documentNo: docNo || `F 17/3-2.${forms.length + 1}`,
      dateOfIssue: new Date().toISOString().split('T')[0],
      revisionNo: '01',
      documentType: 'Online & Final Inspection Report',
      productType: productType || 'White Series – Switched Socket Outlet',
      refStandard: 'SLS 734',
    };

    const newFormId = `form-${Date.now()}`;
    const newForm: InspectionFormCardData = {
      id: newFormId,
      name: name,
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: 'Just now',
      documentHeader: newHeader,
      sections: initialSections,
      notes: `Custom inspection specification sheet for ${name}.`,
      productSeries: productType,
      footer: DEFAULT_FORM_FOOTER,
    };

    setForms(prev => [newForm, ...prev]);
    setActiveFormId(newFormId);
    setHeaderData(newHeader);
    setSections(initialSections);
    setFooterData(DEFAULT_FORM_FOOTER);
    if (onUpdateDocumentHeader) {
      onUpdateDocumentHeader(newHeader);
    }
    setViewMode('editor');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    showToast(`Created new form "${name}" and opened Form Generator!`);
  };

  // Duplicate form
  const handleDuplicateForm = (formId: string) => {
    const source = forms.find(f => f.id === formId);
    if (!source) return;
    const copyId = `form-${Date.now()}`;
    const copyName = `${source.name}_Copy`;
    const copyForm: InspectionFormCardData = {
      ...source,
      id: copyId,
      name: copyName,
      isOngoing: false,
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: 'Just now',
      documentHeader: {
        ...source.documentHeader,
        documentNo: `${source.documentHeader.documentNo}-COPY`,
      },
      sections: JSON.parse(JSON.stringify(source.sections)),
      footer: source.footer ? JSON.parse(JSON.stringify(source.footer)) : DEFAULT_FORM_FOOTER,
    };
    setForms(prev => [copyForm, ...prev]);
    showToast(`Duplicated "${source.name}" as "${copyName}"!`);
  };

  // Rename form
  const handleRenameForm = (formId: string, newName: string) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, name: newName, updatedAt: 'Just now' } : f));
    showToast(`Renamed form to "${newName}".`);
  };

  // Delete form
  const handleDeleteForm = (formId: string) => {
    if (forms.length <= 1) {
      showToast('Cannot delete the last remaining form.');
      return;
    }
    const target = forms.find(f => f.id === formId);
    const remaining = forms.filter(f => f.id !== formId);
    setForms(remaining);
    if (activeFormId === formId && remaining.length > 0) {
      setActiveFormId(remaining[0].id);
      setHeaderData(remaining[0].documentHeader);
      setSections(remaining[0].sections);
      const rawFooter = remaining[0].footer || DEFAULT_FORM_FOOTER;
      setFooterData({
        ...rawFooter,
        onlineInspectorName: (rawFooter.onlineInspectorName === 'H. P. Karunaratne' ? '' : rawFooter.onlineInspectorName) || '',
        onlineEmpNo: (rawFooter.onlineEmpNo === 'EMP-4102' ? '' : rawFooter.onlineEmpNo) || '',
        finalInspectorName: (rawFooter.finalInspectorName === 'M. Vigneshwaran' ? '' : rawFooter.finalInspectorName) || '',
        finalEmpNo: (rawFooter.finalEmpNo === 'QC-Lead-09' ? '' : rawFooter.finalEmpNo) || '',
      });
    }
    showToast(`Deleted form "${target?.name || ''}".`);
  };

  // Switch form while in editor mode
  const handleSwitchActiveForm = (newFormId: string) => {
    const target = forms.find(f => f.id === newFormId);
    if (!target) return;
    setActiveFormId(newFormId);
    setHeaderData(target.documentHeader);
    setSections(target.sections);
    const rawFooter = target.footer || DEFAULT_FORM_FOOTER;
    setFooterData({
      ...rawFooter,
      onlineInspectorName: (rawFooter.onlineInspectorName === 'H. P. Karunaratne' ? '' : rawFooter.onlineInspectorName) || '',
      onlineEmpNo: (rawFooter.onlineEmpNo === 'EMP-4102' ? '' : rawFooter.onlineEmpNo) || '',
      finalInspectorName: (rawFooter.finalInspectorName === 'M. Vigneshwaran' ? '' : rawFooter.finalInspectorName) || '',
      finalEmpNo: (rawFooter.finalEmpNo === 'QC-Lead-09' ? '' : rawFooter.finalEmpNo) || '',
    });
    if (onUpdateDocumentHeader) {
      onUpdateDocumentHeader(target.documentHeader);
    }
    showToast(`Switched active form to "${target.name}".`);
  };

  // Check if Document Header is completely filled out
  const isHeaderComplete = Boolean(
    headerData &&
    headerData.documentNo?.trim() &&
    headerData.dateOfIssue?.trim() &&
    headerData.revisionNo?.trim() &&
    headerData.documentType?.trim() &&
    headerData.productType?.trim()
  );

  // Print & Export Handlers matching the header in reference image
  const handlePrint = () => {
    showToast('Opening print dialog for Official Inspection Form...');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePdfExport = () => {
    showToast('Preparing PDF Export for Official Inspection Form...');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleSubmitQaRecord = () => {
    showToast(`✓ Inspection Record ${headerData.documentNo || 'F 17/3-2.1'} submitted to QA register successfully!`);
  };

  const handleMoveElement = (sectionId: string, index: number, direction: 'up' | 'down') => {
    setSections(prev =>
      prev.map(sec => {
        if (sec.id === sectionId) {
          const targetIdx = direction === 'up' ? index - 1 : index + 1;
          if (targetIdx < 0 || targetIdx >= sec.elements.length) return sec;
          const newElements = [...sec.elements];
          const [moved] = newElements.splice(index, 1);
          newElements.splice(targetIdx, 0, moved);
          return {
            ...sec,
            elements: newElements,
          };
        }
        return sec;
      })
    );
    showToast(`Element moved ${direction}!`);
  };

  const handleLoadReferenceImageElements = (sectionId: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          elements: REFERENCE_SECTION_1_ELEMENTS,
          savedData: { ...REFERENCE_SECTION_1_SAVED_DATA, ...(sec.savedData || {}) },
          isSaved: true
        };
      }
      return sec;
    }));
    showToast('Loaded standard elements for Section 1 (Inspection Date, Batch No, Description, Item Code)!');
  };

  const handleLoadOnlineTableToSection = (sectionId: string) => {
    const newElement: SectionElementSchema = {
      id: `el-online-${Date.now()}`,
      name: 'Online / Visual QA Inspection Grid',
      type: 'table_grid',
      subItems: [],
      tableConfig: {
        columns: DEFAULT_QA_TABLE_COLUMNS,
        rows: DEFAULT_QA_TABLE_ROWS,
      },
    };
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            elements: [...sec.elements, newElement],
            isSaved: true,
          };
        }
        return sec;
      })
    );
    showToast('Added Online / Visual Inspection Table Grid with interval checkpoints!');
  };

  const handleLoadFinalTableToSection = (sectionId: string) => {
    const newElement: SectionElementSchema = {
      id: `el-final-${Date.now()}`,
      name: 'Final Inspection Grid (Sample Testing)',
      type: 'final_table_grid',
      subItems: [],
      tableConfig: {
        columns: DEFAULT_FINAL_INSPECTION_TABLE_COLUMNS,
        rows: DEFAULT_FINAL_INSPECTION_TABLE_ROWS,
      },
    };
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            elements: [...sec.elements, newElement],
            isSaved: true,
          };
        }
        return sec;
      })
    );
    showToast('Added Final Inspection Table Grid with 3 testing samples (S1, S2, S3)!');
  };

  const handleResetToTemplate = () => {
    setHeaderData({
      documentNo: 'F 17/3-2.1',
      dateOfIssue: '2024-03-20',
      revisionNo: '04',
      documentType: 'Online & Final Inspection Report',
      productType: 'White Series – Switched Socket Outlet',
      refStandard: 'SLS 734'
    });
    setSections([
      {
        id: 'section-1',
        sectionNumber: 1,
        title: 'DIGITAL FACTORY INSPECTION LOG',
        elements: REFERENCE_SECTION_1_ELEMENTS,
        isSaved: true,
        savedData: REFERENCE_SECTION_1_SAVED_DATA,
      },
      {
        id: 'section-2',
        sectionNumber: 2,
        title: '2. ONLINE / VISUAL INSPECTION',
        elements: REFERENCE_SECTION_2_ONLINE_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
      {
        id: 'section-3',
        sectionNumber: 3,
        title: '3. FINAL INSPECTION (SAMPLE TESTING)',
        elements: REFERENCE_SECTION_3_FINAL_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
    ]);
    setFooterData(DEFAULT_FORM_FOOTER);
    showToast('Reset form header, sections, and footer matching reference inspection sheet!');
  };

  // --- Section Block Handlers ---
  const handleOpenSectionModal = () => {
    if (!isHeaderComplete) {
      setAttemptedSectionWithoutHeader(true);
      showToast('⚠️ Document Header fields must be filled before creating a Section block.');
      const headerElem = document.getElementById('document-header-section-card');
      if (headerElem) {
        headerElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    setAttemptedSectionWithoutHeader(false);
    setSectionBlockName('');
    setIsSectionModalOpen(true);
  };

  const handleCloseSectionModal = () => {
    setIsSectionModalOpen(false);
    setSectionBlockName('');
  };

  const handleCreateSection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = sectionBlockName.trim();
    if (!trimmed) return;

    if (/footer/i.test(trimmed)) {
      setFooterData(prev => ({ ...prev, enabled: true }));
      setIsSectionModalOpen(false);
      setSectionBlockName('');
      setTimeout(() => {
        const el = document.getElementById('section-block-footer') || document.getElementById('form-live-footer-section');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      showToast('Footer Section Block added to inspection form!');
      return;
    }

    const newSection: SectionBlockSchema = {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sectionNumber: sections.length + 1,
      title: trimmed,
      elements: [],
      isSaved: false,
      savedData: {},
    };

    setSections((prev) => [...prev, newSection]);
    setIsSectionModalOpen(false);
    setSectionBlockName('');
    showToast(`Section "${trimmed}" created! Now add elements inside it.`);
  };

  const handleDeleteSection = (id: string) => {
    setSections((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, sectionNumber: idx + 1 }));
    });
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingSectionId(id);
    setEditSectionTitleValue(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    const trimmed = editSectionTitleValue.trim();
    if (trimmed) {
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s))
      );
    }
    setEditingSectionId(null);
  };

  // --- Element Handlers ---
  const handleOpenAddElementModal = (sectionId: string) => {
    setActiveSectionForElement(sectionId);
    setEditingElementId(null);
    setSubItemInput('');
    setSubItemsList([]);
    setElementFormError(null);

    const targetSec = sections.find((s) => s.id === sectionId);
    const isFinalSec = targetSec ? (/final/i.test(targetSec.title) || targetSec.sectionNumber === 3) : false;
    const isOnlineSec = targetSec ? (/online|visual/i.test(targetSec.title) || targetSec.sectionNumber === 2) : false;

    if (isFinalSec) {
      setElementType('final_table_grid');
      setElementName('Final Inspection Grid (Sample Testing)');
      setTableColumns(DEFAULT_FINAL_INSPECTION_TABLE_COLUMNS);
      setTableRows(DEFAULT_FINAL_INSPECTION_TABLE_ROWS);
    } else if (isOnlineSec) {
      setElementType('table_grid');
      setElementName('Online / Visual QA Inspection Grid');
      setTableColumns(DEFAULT_QA_TABLE_COLUMNS);
      setTableRows(DEFAULT_QA_TABLE_ROWS);
    } else {
      setElementType('data_field');
      setElementName('');
      setTableColumns(DEFAULT_QA_TABLE_COLUMNS);
      setTableRows(DEFAULT_QA_TABLE_ROWS);
    }

    setTableConfigSubTab('columns');
    setNewColHeader('');
    setNewColType('dropdown');
    setNewColDropdownOptions('Pass, Fail, N/A');
    setNewColHasTime(false);
    setNewColDefaultTime('');
    setNewGroupHeaderTitle('');
    setNewDataRowMic('');
    setNewDataRowParam('');
    setNewDataRowSpec('');
  };

  const handleOpenEditElementModal = (sectionId: string, element: SectionElementSchema) => {
    setActiveSectionForElement(sectionId);
    setEditingElementId(element.id);
    setElementName(element.name);
    setElementType(element.type);
    setSubItemInput('');
    setSubItemsList([...element.subItems]);
    setElementFormError(null);
    if (element.tableConfig) {
      setTableColumns([...element.tableConfig.columns]);
      setTableRows([...element.tableConfig.rows]);
    } else {
      if (element.type === 'final_table_grid') {
        setTableColumns(DEFAULT_FINAL_INSPECTION_TABLE_COLUMNS);
        setTableRows(DEFAULT_FINAL_INSPECTION_TABLE_ROWS);
      } else {
        setTableColumns(DEFAULT_QA_TABLE_COLUMNS);
        setTableRows(DEFAULT_QA_TABLE_ROWS);
      }
    }
    setTableConfigSubTab('columns');
    setNewColHeader('');
    setNewColType('dropdown');
    setNewColDropdownOptions('Pass, Fail, N/A');
    setNewColHasTime(false);
    setNewColDefaultTime('');
    setNewGroupHeaderTitle('');
    setNewDataRowMic('');
    setNewDataRowParam('');
    setNewDataRowSpec('');
  };

  const handleCloseAddElementModal = () => {
    setActiveSectionForElement(null);
    setEditingElementId(null);
    setElementName('');
    setElementType('data_field');
    setSubItemInput('');
    setSubItemsList([]);
    setElementFormError(null);
  };

  const handleAddSubItem = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = subItemInput.trim();
    if (!trimmed) return;
    if (subItemsList.includes(trimmed)) {
      setElementFormError(`"${trimmed}" is already added.`);
      return;
    }
    setSubItemsList((prev) => [...prev, trimmed]);
    setSubItemInput('');
    setElementFormError(null);
    subItemInputRef.current?.focus();
  };

  const handleRemoveSubItem = (index: number) => {
    setSubItemsList((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Table / Grid Column Handlers ---
  const handleAddTableColumn = () => {
    const trimmed = newColHeader.trim();
    if (!trimmed) {
      setElementFormError('Please enter a column header name.');
      return;
    }
    if (tableColumns.some((c) => c.header.toLowerCase() === trimmed.toLowerCase())) {
      setElementFormError(`Column "${trimmed}" already exists.`);
      return;
    }

    const newColId = `col-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const parsedOptions = newColType === 'dropdown'
      ? newColDropdownOptions.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const finalOptions = parsedOptions && parsedOptions.length > 0 ? parsedOptions : ['Pass', 'Fail', 'N/A'];

    // Auto-detect if column represents time intervals (e.g. "time 1", "time 2", "time 3", "interval 1") or if checked
    const isTimeCol = newColHasTime || trimmed.toLowerCase().includes('time');

    const newCol: TableColumnSchema = {
      id: newColId,
      header: trimmed,
      type: newColType,
      options: finalOptions,
      hasTimeHeader: isTimeCol,
      defaultHeaderTime: isTimeCol ? newColDefaultTime.trim() : undefined,
    };

    setTableColumns((prev) => [...prev, newCol]);

    // Populate default value for this new column in existing data rows
    setTableRows((prev) =>
      prev.map((r) =>
        r.isGroupHeader
          ? r
          : {
              ...r,
              cells: {
                ...r.cells,
                [newColId]: newColType === 'dropdown' ? (r.inputType === 'text' ? '' : '--Select--') : '',
              },
            }
      )
    );

    setNewColHeader('');
    setNewColHasTime(false);
    setElementFormError(null);
  };

  const handleUpdateColumnDefaultTime = (colId: string, timeVal: string) => {
    setTableColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, defaultHeaderTime: timeVal, hasTimeHeader: true } : c))
    );
  };

  const handleToggleColumnTimeHeader = (colId: string) => {
    setTableColumns((prev) =>
      prev.map((c) => {
        if (c.id === colId) {
          const currentlyHasTime = c.hasTimeHeader ?? c.header.toLowerCase().includes('time');
          const nextVal = !currentlyHasTime;
          return {
            ...c,
            hasTimeHeader: nextVal,
            defaultHeaderTime: nextVal ? (c.defaultHeaderTime || '') : c.defaultHeaderTime,
          };
        }
        return c;
      })
    );
  };

  const handleRemoveTableColumn = (colId: string) => {
    if (tableColumns.length <= 1) {
      setElementFormError('Table must have at least one column.');
      return;
    }
    setTableColumns((prev) => prev.filter((c) => c.id !== colId));
    setTableRows((prev) =>
      prev.map((r) => {
        if (r.isGroupHeader) return r;
        const nextCells = { ...r.cells };
        delete nextCells[colId];
        return { ...r, cells: nextCells };
      })
    );
    setElementFormError(null);
  };

  const handleUpdateColumnHeader = (colId: string, header: string) => {
    setTableColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, header } : c))
    );
  };

  const handleUpdateColumnType = (colId: string, type: ColumnInputType) => {
    setTableColumns((prev) =>
      prev.map((c) => {
        if (c.id === colId) {
          return {
            ...c,
            type,
            options: type === 'dropdown'
              ? (c.options && c.options.length > 0 ? c.options : ['Pass', 'Fail', 'N/A'])
              : undefined,
          };
        }
        return c;
      })
    );
    setTableRows((prev) =>
      prev.map((r) => {
        if (r.isGroupHeader) return r;
        const nextCells = { ...r.cells };
        if (type === 'dropdown') {
          nextCells[colId] = r.inputType === 'text' ? '' : '--Select--';
        } else {
          nextCells[colId] = '';
        }
        return { ...r, cells: nextCells };
      })
    );
  };

  const handleUpdateColumnOptions = (colId: string, optionsStr: string) => {
    const parsed = optionsStr.split(',').map((s) => s.trim()).filter(Boolean);
    setTableColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, options: parsed } : c))
    );
  };

  const handleMoveColumn = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tableColumns.length) return;
    const copy = [...tableColumns];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setTableColumns(copy);
  };

  // --- Table Rows & Group Headers Handlers ---
  const handleAddGroupHeader = () => {
    const trimmed = newGroupHeaderTitle.trim();
    if (!trimmed) {
      setElementFormError('Please enter a group header title (e.g. "1 VISUAL INSPECTION").');
      return;
    }
    const newRow: TableRowSchema = {
      id: `row-gh-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      isGroupHeader: true,
      groupTitle: trimmed,
      cells: {},
    };
    setTableRows((prev) => [...prev, newRow]);
    setNewGroupHeaderTitle('');
    setElementFormError(null);
  };

  const handleAddDataRow = () => {
    const newRowId = `row-dr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const nextCells: Record<string, string> = {};

    tableColumns.forEach((col) => {
      const h = col.header.toLowerCase();
      if (h.includes('mic') || col.id === 'col-mic' || col.id === 'col-fi-mic') {
        const dataCount = tableRows.filter((r) => !r.isGroupHeader).length + 1;
        nextCells[col.id] = newDataRowMic.trim() || String(dataCount).padStart(2, '0');
      } else if (h.includes('param') || col.id === 'col-param' || col.id === 'col-fi-param') {
        nextCells[col.id] = newDataRowParam.trim() || 'Inspection Checkpoint';
      } else if (h.includes('spec') || col.id === 'col-specs' || col.id === 'col-fi-specs') {
        nextCells[col.id] = newDataRowSpec.trim() || 'Standard specification';
      } else if (col.type === 'dropdown') {
        nextCells[col.id] = newDataRowInputType === 'text' ? '' : '--Select--';
      } else {
        nextCells[col.id] = '';
      }
    });

    setTableRows((prev) => [
      ...prev,
      {
        id: newRowId,
        isGroupHeader: false,
        inputType: newDataRowInputType,
        cells: nextCells,
      },
    ]);

    setNewDataRowMic('');
    setNewDataRowParam('');
    setNewDataRowSpec('');
    setNewDataRowInputType('dropdown');
    setElementFormError(null);
  };

  const handleToggleRowInputType = (rowId: string) => {
    setTableRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const currentIsManual = r.inputType === 'text' || r.inputType === 'number' || (r.inputType !== 'dropdown' && /voltage drop/i.test(r.cells['col-fi-param'] || r.cells['col-param'] || ''));
        const nextMode = currentIsManual ? 'dropdown' : 'text';
        const updatedCells = { ...r.cells };
        tableColumns.forEach((col) => {
          if (col.type === 'dropdown') {
            if (nextMode === 'text') {
              updatedCells[col.id] = '';
            } else {
              updatedCells[col.id] = '--Select--';
            }
          }
        });
        return {
          ...r,
          inputType: nextMode,
          cells: updatedCells,
        };
      })
    );
  };

  const handleToggleLiveRowInputType = (
    sectionId: string,
    elementId: string,
    rowId: string
  ) => {
    let toggledTo = 'dropdown';
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          elements: s.elements.map((el) => {
            if (el.id !== elementId || !el.tableConfig) return el;
            return {
              ...el,
              tableConfig: {
                ...el.tableConfig,
                rows: el.tableConfig.rows.map((r) => {
                  if (r.id !== rowId) return r;
                  const currentIsManual = r.inputType === 'text' || r.inputType === 'number' || (r.inputType !== 'dropdown' && /voltage drop/i.test(r.cells['col-fi-param'] || r.cells['col-param'] || ''));
                  const nextMode = currentIsManual ? 'dropdown' : 'text';
                  toggledTo = nextMode;
                  const updatedCells = { ...r.cells };
                  el.tableConfig!.columns.forEach((col) => {
                    if (col.type === 'dropdown') {
                      if (nextMode === 'text') {
                        updatedCells[col.id] = '';
                      } else {
                        updatedCells[col.id] = '--Select--';
                      }
                    }
                  });
                  return {
                    ...r,
                    inputType: nextMode,
                    cells: updatedCells,
                  };
                }),
              },
            };
          }),
        };
      })
    );
    showToast(
      toggledTo === 'text'
        ? 'Parameter switched to Manual Text Field (enter test values directly)'
        : 'Parameter switched to Dropdown (--Select--)'
    );
  };

  const handleUpdateRowCell = (rowId: string, colId: string, value: string) => {
    setTableRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              cells: { ...r.cells, [colId]: value },
            }
          : r
      )
    );
  };

  const handleUpdateGroupTitle = (rowId: string, groupTitle: string) => {
    setTableRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, groupTitle } : r))
    );
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tableRows.length) return;
    const copy = [...tableRows];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setTableRows(copy);
  };

  const handleDeleteRow = (rowId: string) => {
    setTableRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleLoadQaTablePreset = () => {
    setTableColumns(DEFAULT_QA_TABLE_COLUMNS);
    setTableRows(DEFAULT_QA_TABLE_ROWS);
    showToast('Loaded standard QA Inspection Table structure with custom intervals!');
  };

  const handleLoadTwoIntervalPreset = () => {
    setTableColumns([
      { id: 'col-mic', header: 'MIC NO', type: 'text_label', width: '85px' },
      { id: 'col-param', header: 'Parameter', type: 'text_label', width: '220px' },
      { id: 'col-t1', header: 'time 1', type: 'dropdown', options: ['Pass', 'Fail', 'N/A'], hasTimeHeader: true, defaultHeaderTime: '' },
      { id: 'col-t2', header: 'time 2', type: 'dropdown', options: ['Pass', 'Fail', 'N/A'], hasTimeHeader: true, defaultHeaderTime: '' },
      { id: 'col-specs', header: 'Specifications', type: 'text_label', width: '240px' },
    ]);
    setTableRows([
      { id: 'r-gh-1', isGroupHeader: true, groupTitle: '1. ONLINE / VISUAL INSPECTION', cells: {} },
      { id: 'r-dr-1', isGroupHeader: false, inputType: 'dropdown', cells: { 'col-mic': '01', 'col-param': '1.1 Appearance', 'col-t1': '--Select--', 'col-t2': '--Select--', 'col-specs': 'Clean finish, no flashes, cracks or discoloration' } },
      { id: 'r-dr-2', isGroupHeader: false, inputType: 'dropdown', cells: { 'col-mic': '02', 'col-param': '1.2 Markings & Labeling', 'col-t1': '--Select--', 'col-t2': '--Select--', 'col-specs': 'Legible print, SLS 734 certification mark visible' } },
      { id: 'r-dr-3', isGroupHeader: false, inputType: 'dropdown', cells: { 'col-mic': '03', 'col-param': '1.3 Color & Surface Finish', 'col-t1': '--Select--', 'col-t2': '--Select--', 'col-specs': 'Uniform batch color shade, scratch-free, oil/grease free' } },
      { id: 'r-dr-4', isGroupHeader: false, inputType: 'dropdown', cells: { 'col-mic': '04', 'col-param': '1.4 Mould Parting Line & Cleanliness', 'col-t1': '--Select--', 'col-t2': '--Select--', 'col-specs': 'Flush assembly seam, zero burrs, clean component ejector points' } },
    ]);
    showToast('Loaded Online Visual Inspection Grid (visual checkpoints with time 1, time 2)!');
  };

  const handleLoadFinalInspectionPreset = () => {
    setTableColumns(DEFAULT_FINAL_INSPECTION_TABLE_COLUMNS);
    setTableRows(DEFAULT_FINAL_INSPECTION_TABLE_ROWS);
    if (!elementName || elementName.toLowerCase().includes('grid') || elementName.toLowerCase().includes('inspection')) {
      setElementName('Final Inspection Grid (Sample Testing)');
    }
    showToast('Loaded Final Inspection Grid (MIC NO, Parameter, Sample 1, Sample 2, Sample 3, Specifications)!');
  };

  // Add next Sample column inside the Table/Grid configuration modal
  const handleAddSampleColumnInModal = () => {
    const sampleCols = tableColumns.filter((c) => /sample/i.test(c.header));
    let nextNum = 1;
    if (sampleCols.length > 0) {
      const nums = sampleCols.map((c) => {
        const m = c.header.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      });
      nextNum = Math.max(...nums) + 1;
    } else {
      nextNum = 4;
    }

    const newColId = `col-sample-${nextNum}-${Date.now().toString(36)}`;
    const newCol: TableColumnSchema = {
      id: newColId,
      header: `Sample ${nextNum}`,
      type: 'dropdown',
      options: ['Pass', 'Fail', 'N/A'],
      width: '105px',
    };

    const specIdx = tableColumns.findIndex((c) => c.header.toLowerCase().includes('spec'));
    const updatedCols = [...tableColumns];
    if (specIdx >= 0) {
      updatedCols.splice(specIdx, 0, newCol);
    } else {
      updatedCols.push(newCol);
    }

    setTableColumns(updatedCols);
    setTableRows((prev) =>
      prev.map((r) =>
        r.isGroupHeader ? r : { ...r, cells: { ...r.cells, [newColId]: r.inputType === 'text' ? '' : '--Select--' } }
      )
    );
    showToast(`Added "Sample ${nextNum}" column with --Select-- dummy data!`);
  };

  // Add next Time Interval column inside the Table/Grid configuration modal
  const handleAddTimeIntervalInModal = () => {
    const timeCols = tableColumns.filter((c) => /time\s*\d+/i.test(c.header) || c.hasTimeHeader);
    let nextNum = 1;
    if (timeCols.length > 0) {
      const nums = timeCols.map((c) => {
        const m = c.header.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      });
      nextNum = Math.max(...nums) + 1;
    } else {
      nextNum = 3;
    }

    const newColId = `col-time-${nextNum}-${Date.now().toString(36)}`;
    const newCol: TableColumnSchema = {
      id: newColId,
      header: `time ${nextNum}`,
      type: 'dropdown',
      options: ['Pass', 'Fail', 'N/A'],
      width: '120px',
      hasTimeHeader: true,
      defaultHeaderTime: '',
    };

    const specIdx = tableColumns.findIndex((c) => c.header.toLowerCase().includes('spec'));
    const updatedCols = [...tableColumns];
    if (specIdx >= 0) {
      updatedCols.splice(specIdx, 0, newCol);
    } else {
      updatedCols.push(newCol);
    }

    setTableColumns(updatedCols);
    setTableRows((prev) =>
      prev.map((r) =>
        r.isGroupHeader ? r : { ...r, cells: { ...r.cells, [newColId]: r.inputType === 'text' ? '' : '--Select--' } }
      )
    );
    showToast(`Added "time ${nextNum}" column with manual Time: textbox!`);
  };

  // Add next Sample column directly from the live inspection table grid
  const handleAddSampleToTable = (sectionId: string, elementId: string) => {
    let createdSampleName = '';
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          elements: sec.elements.map((el) => {
            if (el.id !== elementId || !isTableElement(el.type) || !el.tableConfig) return el;

            const currentCols = el.tableConfig.columns;
            const sampleCols = currentCols.filter((c) => /sample/i.test(c.header));
            let nextNum = 1;
            if (sampleCols.length > 0) {
              const nums = sampleCols.map((c) => {
                const m = c.header.match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
              });
              nextNum = Math.max(...nums) + 1;
            } else {
              nextNum = 4;
            }

            createdSampleName = `Sample ${nextNum}`;
            const newColId = `col-s${nextNum}-${Date.now().toString(36)}`;
            const newCol: TableColumnSchema = {
              id: newColId,
              header: `Sample ${nextNum}`,
              type: 'dropdown',
              options: ['Pass', 'Fail', 'N/A'],
              width: '105px',
            };

            const specIdx = currentCols.findIndex((c) => c.header.toLowerCase().includes('spec'));
            const updatedCols = [...currentCols];
            if (specIdx >= 0) {
              updatedCols.splice(specIdx, 0, newCol);
            } else {
              updatedCols.push(newCol);
            }

            const updatedRows = el.tableConfig.rows.map((r) => {
              if (r.isGroupHeader) return r;
              const isText = r.inputType === 'text' || r.inputType === 'number' || (r.inputType !== 'dropdown' && /voltage drop/i.test(r.cells['col-fi-param'] || r.cells['col-param'] || ''));
              return {
                ...r,
                cells: {
                  ...r.cells,
                  [newColId]: isText ? '' : '--Select--',
                },
              };
            });

            return {
              ...el,
              tableConfig: {
                ...el.tableConfig,
                columns: updatedCols,
                rows: updatedRows,
              },
            };
          }),
        };
      })
    );

    showToast(`Added "${createdSampleName || 'new Sample'}" column to inspection table!`);
  };

  // Remove the last sample column from table grid if more than 1 sample exists
  const handleRemoveLastSampleFromTable = (sectionId: string, elementId: string) => {
    let removedHeader = '';
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          elements: sec.elements.map((el) => {
            if (el.id !== elementId || !isTableElement(el.type) || !el.tableConfig) return el;

            const currentCols = el.tableConfig.columns;
            const sampleCols = currentCols.filter((c) => /sample/i.test(c.header));
            if (sampleCols.length <= 1) {
              showToast('At least one sample column must remain.');
              return el;
            }

            const lastSample = sampleCols[sampleCols.length - 1];
            removedHeader = lastSample.header;
            const updatedCols = currentCols.filter((c) => c.id !== lastSample.id);

            const updatedRows = el.tableConfig.rows.map((r) => {
              if (r.isGroupHeader) return r;
              const newCells = { ...r.cells };
              delete newCells[lastSample.id];
              return { ...r, cells: newCells };
            });

            return {
              ...el,
              tableConfig: {
                ...el.tableConfig,
                columns: updatedCols,
                rows: updatedRows,
              },
            };
          }),
        };
      })
    );

    if (removedHeader) {
      showToast(`Removed "${removedHeader}" column.`);
    }
  };

  // Add next Time Interval column directly to Online inspection table grid
  const handleAddTimeIntervalToTable = (sectionId: string, elementId: string) => {
    let createdTimeName = '';
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          elements: sec.elements.map((el) => {
            if (el.id !== elementId || !isTableElement(el.type) || !el.tableConfig) return el;

            const currentCols = el.tableConfig.columns;
            const timeCols = currentCols.filter((c) => /time\s*\d+/i.test(c.header) || c.hasTimeHeader);
            let nextNum = 1;
            if (timeCols.length > 0) {
              const nums = timeCols.map((c) => {
                const m = c.header.match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
              });
              nextNum = Math.max(...nums) + 1;
            } else {
              nextNum = 3;
            }

            createdTimeName = `time ${nextNum}`;
            const newColId = `col-t${nextNum}-${Date.now().toString(36)}`;
            const newCol: TableColumnSchema = {
              id: newColId,
              header: `time ${nextNum}`,
              type: 'dropdown',
              options: ['Pass', 'Fail', 'N/A'],
              width: '120px',
              hasTimeHeader: true,
              defaultHeaderTime: '',
            };

            const specIdx = currentCols.findIndex((c) => c.header.toLowerCase().includes('spec'));
            const updatedCols = [...currentCols];
            if (specIdx >= 0) {
              updatedCols.splice(specIdx, 0, newCol);
            } else {
              updatedCols.push(newCol);
            }

            const updatedRows = el.tableConfig.rows.map((r) => {
              if (r.isGroupHeader) return r;
              const isText = r.inputType === 'text' || r.inputType === 'number' || (r.inputType !== 'dropdown' && /voltage drop/i.test(r.cells['col-fi-param'] || r.cells['col-param'] || ''));
              return {
                ...r,
                cells: {
                  ...r.cells,
                  [newColId]: isText ? '' : '--Select--',
                },
              };
            });

            return {
              ...el,
              tableConfig: {
                ...el.tableConfig,
                columns: updatedCols,
                rows: updatedRows,
              },
            };
          }),
        };
      })
    );

    showToast(`Added "${createdTimeName || 'new interval'}" column with manual Time: input!`);
  };

  // Remove the last time interval column from Online inspection table grid
  const handleRemoveLastTimeIntervalFromTable = (sectionId: string, elementId: string) => {
    let removedHeader = '';
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          elements: sec.elements.map((el) => {
            if (el.id !== elementId || !isTableElement(el.type) || !el.tableConfig) return el;

            const currentCols = el.tableConfig.columns;
            const timeCols = currentCols.filter((c) => /time\s*\d+/i.test(c.header) || c.hasTimeHeader);
            if (timeCols.length <= 1) {
              showToast('At least one interval column must remain.');
              return el;
            }

            const lastTime = timeCols[timeCols.length - 1];
            removedHeader = lastTime.header;
            const updatedCols = currentCols.filter((c) => c.id !== lastTime.id);

            const updatedRows = el.tableConfig.rows.map((r) => {
              if (r.isGroupHeader) return r;
              const newCells = { ...r.cells };
              delete newCells[lastTime.id];
              return { ...r, cells: newCells };
            });

            return {
              ...el,
              tableConfig: {
                ...el.tableConfig,
                columns: updatedCols,
                rows: updatedRows,
              },
            };
          }),
        };
      })
    );

    if (removedHeader) {
      showToast(`Removed "${removedHeader}" column.`);
    }
  };

  // 1-Click shortcuts to create standard QA sections
  const handleQuickAddOnlineSection = () => {
    const newSection: SectionBlockSchema = {
      id: `sec-online-${Date.now()}`,
      sectionNumber: sections.length + 1,
      title: '2. ONLINE / VISUAL INSPECTION',
      elements: REFERENCE_SECTION_2_ONLINE_ELEMENTS,
      isSaved: true,
      savedData: {},
    };
    setSections((prev) => [...prev, newSection]);
    showToast('Created Section: 2. ONLINE / VISUAL INSPECTION with interval table grid!');
  };

  const handleQuickAddFinalSection = () => {
    const newSection: SectionBlockSchema = {
      id: `sec-final-${Date.now()}`,
      sectionNumber: sections.length + 1,
      title: '3. FINAL INSPECTION (SAMPLE TESTING)',
      elements: REFERENCE_SECTION_3_FINAL_ELEMENTS,
      isSaved: true,
      savedData: {},
    };
    setSections((prev) => [...prev, newSection]);
    showToast('Created Section: 3. FINAL INSPECTION with 3 default samples (Sample 1, 2, 3)!');
  };

  const handleClearTableRows = () => {
    setTableRows([]);
    showToast('Rows cleared. Use the controls below to add Group Headers and Data Rows.');
  };

  const handleAddElementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = elementName.trim();
    if (!trimmedName) {
      setElementFormError('Please enter an element name.');
      return;
    }

    if ((elementType === 'dropdown' || elementType === 'radio') && subItemsList.length === 0) {
      setElementFormError(`Please add at least one sub item name for the ${elementType === 'dropdown' ? 'Dropdown list' : 'Radio button'}.`);
      return;
    }

    if (isTableElement(elementType)) {
      if (tableColumns.length === 0) {
        setElementFormError('Please define at least one column for the table.');
        return;
      }
      if (tableRows.length === 0) {
        setElementFormError('Please add at least one group header or data row for the table.');
        return;
      }
    }

    const targetElementId = editingElementId || `elem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newElement: SectionElementSchema = {
      id: targetElementId,
      name: trimmedName,
      type: elementType,
      subItems: [...subItemsList],
      tableConfig: isTableElement(elementType) ? {
        columns: [...tableColumns],
        rows: [...tableRows],
      } : undefined,
    };

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === activeSectionForElement) {
          const isExisting = sec.elements.some((el) => el.id === targetElementId);
          const updatedElements = isExisting
            ? sec.elements.map((el) => (el.id === targetElementId ? newElement : el))
            : [...sec.elements, newElement];

          return {
            ...sec,
            elements: updatedElements,
            isSaved: false, // Mark unsaved if modified
          };
        }
        return sec;
      })
    );

    showToast(
      editingElementId
        ? `Table element "${trimmedName}" updated successfully!`
        : `Element "${trimmedName}" added to section!`
    );
    handleCloseAddElementModal();
  };

  const handleDeleteElement = (sectionId: string, elementId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          const newElements = sec.elements.filter((el) => el.id !== elementId);
          const newSavedData = { ...(sec.savedData || {}) };
          delete newSavedData[elementId];
          return {
            ...sec,
            elements: newElements,
            savedData: newSavedData,
            isSaved: false,
          };
        }
        return sec;
      })
    );
  };

  const handleSaveSection = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;

    if (sec.elements.length === 0) {
      showToast('Please add at least one element before saving the selection.');
      return;
    }

    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, isSaved: true } : s))
    );
    showToast(`Section "${sec.title}" saved! Live data entry preview is now active.`);
  };

  const handleReopenEditSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, isSaved: false } : s))
    );
    showToast('Editing section configuration unlocked.');
  };

  // Live preview value updates (only active after saved)
  const handlePreviewFieldChange = (sectionId: string, elementId: string, value: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            savedData: {
              ...(sec.savedData || {}),
              [elementId]: value,
            },
          };
        }
        return sec;
      })
    );
  };

  // Open the Deploy to Destination modal (Deploy to Specifications / Inspection Portal)
  const handleOpenDeployModal = () => {
    if (sections.length === 0) {
      showToast('Please add elements to at least one section before deploying.');
      return;
    }
    const currentProd = headerData.productType || 'White Series – Switched Socket Outlet';
    setDeployProductType(currentProd);
    setDeployFormName(activeForm?.name || headerData.documentType || 'Online & Final Inspection Report');
    const mainCards = getMainCards();
    const defaultMain = mainCards.find(m => m.id === 'main-inprocess')?.id || mainCards[0]?.id || 'main-incoming';
    setDeployMainId(defaultMain);
    const childCards = getChildCards(defaultMain);
    const defaultChild = childCards.find(c => c.id === 'child-white-series')?.id || childCards[0]?.id || '';
    setDeployChildId(defaultChild);
    setShowDeployModal(true);
  };

  // Confirm Deploy to Inspection Portal
  const handleConfirmDeployToPortal = () => {
    if (!deployChildId) {
      showToast('Please select a destination child category.');
      return;
    }

    const allMainCards = getMainCards();
    const allChildCards = getChildCards(deployMainId);
    const targetMain = allMainCards.find(m => m.id === deployMainId);
    const targetChild = allChildCards.find(c => c.id === deployChildId);

    const targetMainName = targetMain ? targetMain.name : 'Inspection Portal';
    const targetChildName = targetChild ? targetChild.name : 'Category';

    // Synchronize productType with headerData as requested: "And it save as Product Type in the form header"
    const finalProductType = deployProductType.trim() || headerData.productType || targetChildName;
    const updatedHeader: DocumentHeaderData = {
      ...headerData,
      productType: finalProductType,
    };
    setHeaderData(updatedHeader);
    if (onUpdateDocumentHeader) {
      onUpdateDocumentHeader(updatedHeader);
    }

    // Update active form in forms state if in multi-form mode
    if (activeFormId) {
      setForms(prev => prev.map(f => {
        if (f.id === activeFormId) {
          return {
            ...f,
            name: deployFormName.trim() || f.name,
            status: 'Active',
            documentHeader: updatedHeader,
            sections,
            footer: footerData,
            updatedAt: 'Just now',
          };
        }
        return f;
      }));
    }

    // Deploy to persistent storage
    deployInspectionForm({
      sourceFormId: activeFormId || 'form-custom',
      name: deployFormName.trim() || activeForm?.name || 'Inspection Form',
      targetMainCardId: deployMainId,
      targetMainCardName: targetMainName,
      targetChildCardId: deployChildId,
      targetChildCardName: targetChildName,
      productType: finalProductType,
      documentHeader: updatedHeader,
      sections,
      footer: footerData,
      status: 'Active',
      version: headerData.revisionNo || 'Rev 1.0',
      notes: `Deployed from Form Generator by ${userId || 'Auditor'} into Make New Inspection`,
    });

    // Also deploy specs if onDeployToSpecs prop was provided
    if (onDeployToSpecs) {
      const generated: InspectionSpecItem[] = [];
      sections.forEach((sec) => {
        sec.elements.forEach((el, idx) => {
          generated.push({
            id: `spec-${sec.id}-${el.id}`,
            itemCode: `SEC${sec.sectionNumber}-${String(idx + 1).padStart(3, '0')}`,
            itemName: sec.title,
            series: 'Form Block',
            category: sec.title,
            inspectionStage: deployMainId === 'main-incoming' ? 'incoming' : 'in-process',
            parameter: el.name,
            nominalTarget: el.subItems.length > 0 ? el.subItems.join(' / ') : 'As per design',
            tolerance: '±0',
            unit: el.type === 'date_picker' ? 'Date' : el.type === 'data_field' ? 'Text/Value' : 'Choice',
            equipment: el.type,
            samplingFrequency: '100% Check',
            criticality: 'Major',
            revision: headerData.revisionNo || 'Rev 1.0',
            status: 'Active',
            createdAt: new Date().toISOString().split('T')[0],
          });
        });
      });
      if (generated.length > 0) {
        onDeployToSpecs(generated);
      }
    }

    setShowDeployModal(false);
    showToast(`Form deployed to ${targetMainName} > ${targetChildName} under Product Type "${finalProductType}"!`);
  };

  // Render the Document Header Section (Document Control Specifications)
  const renderDocumentHeaderCard = () => (
    <div 
      id="document-header-section-card" 
      className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
    >
      <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Document Header Section
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Upper Space
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Document Control Specifications
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHeaderComplete ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Header Complete</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>All Fields Required</span>
            </span>
          )}
        </div>
      </div>

      {/* Validation Warning Alert if user tried to add section block without filling all header fields */}
      {attemptedSectionWithoutHeader && !isHeaderComplete && (
        <div className="mx-4 sm:mx-5 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Cannot create a section block without Document Header fields filled!</strong> Please fill in all required fields below.
          </span>
        </div>
      )}

      {/* Directly Editable Fields in Upper Space */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 bg-slate-50/60 border-t border-slate-200/80">
        {/* Document Type Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Document Type <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={headerData.documentType}
              onChange={(e) => handleUpdateHeaderField('documentType', e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer ${
                attemptedSectionWithoutHeader && !headerData.documentType.trim()
                  ? 'border-rose-400 ring-2 ring-rose-200'
                  : 'border-slate-300'
              }`}
            >
              <option value="Online & Final Inspection Report">Online & Final Inspection Report</option>
              <option value="Incoming Inspection Report">Incoming Inspection Report</option>
              <option value="Subcontracting Inspection Report">Subcontracting Inspection Report</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {attemptedSectionWithoutHeader && !headerData.documentType.trim() && (
            <span className="text-[10px] text-rose-600 font-bold block">Required field</span>
          )}
        </div>

        {/* Document No Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Document No <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. F 17/3-2.1"
            value={headerData.documentNo}
            onChange={(e) => handleUpdateHeaderField('documentNo', e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
              attemptedSectionWithoutHeader && !headerData.documentNo.trim()
                ? 'border-rose-400 ring-2 ring-rose-200'
                : 'border-slate-300'
            }`}
          />
          {attemptedSectionWithoutHeader && !headerData.documentNo.trim() && (
            <span className="text-[10px] text-rose-600 font-bold block">Required field</span>
          )}
        </div>

        {/* Date of Issue Date Picker */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Date of Issue: <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={headerData.dateOfIssue}
            onChange={(e) => handleUpdateHeaderField('dateOfIssue', e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer ${
              attemptedSectionWithoutHeader && !headerData.dateOfIssue.trim()
                ? 'border-rose-400 ring-2 ring-rose-200'
                : 'border-slate-300'
            }`}
          />
          {attemptedSectionWithoutHeader && !headerData.dateOfIssue.trim() && (
            <span className="text-[10px] text-rose-600 font-bold block">Required field</span>
          )}
        </div>

        {/* Revision No Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Revision No: <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 04"
            value={headerData.revisionNo}
            onChange={(e) => handleUpdateHeaderField('revisionNo', e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
              attemptedSectionWithoutHeader && !headerData.revisionNo.trim()
                ? 'border-rose-400 ring-2 ring-rose-200'
                : 'border-slate-300'
            }`}
          />
          {attemptedSectionWithoutHeader && !headerData.revisionNo.trim() && (
            <span className="text-[10px] text-rose-600 font-bold block">Required field</span>
          )}
        </div>

        {/* Product Type Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Product Type <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. White Series – Switched Socket Outlet"
            value={headerData.productType}
            onChange={(e) => handleUpdateHeaderField('productType', e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
              attemptedSectionWithoutHeader && !headerData.productType.trim()
                ? 'border-rose-400 ring-2 ring-rose-200'
                : 'border-slate-300'
            }`}
          />
          {attemptedSectionWithoutHeader && !headerData.productType.trim() && (
            <span className="text-[10px] text-rose-600 font-bold block">Required field</span>
          )}
        </div>

        {/* Ref Standard Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Ref Standard
          </label>
          <input
            type="text"
            placeholder="e.g. SLS 734"
            value={headerData.refStandard || 'SLS 734'}
            onChange={(e) => handleUpdateHeaderField('refStandard', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <span className="text-[10px] text-slate-400 font-medium block">Displays on report badge</span>
        </div>
      </div>
    </div>
  );

  // Render the Footer Section Block in Editable Stage (consecutive block directly under Document Header Section)
  const renderFooterSectionCard = () => (
    <div
      id="section-block-footer"
      className={`w-full bg-white rounded-xl border-2 transition-all shadow-sm overflow-hidden ${
        footerData.enabled 
          ? 'border-indigo-300 ring-1 ring-indigo-200/50 bg-slate-50/20' 
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
            F
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                FOOTER SECTION BLOCK: REMARKS &amp; SIGN-OFF
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                Consecutive Under Header
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Observations and In-Line QC &amp; QA Authority Inspector Names
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFooterData(prev => ({ ...prev, enabled: !prev.enabled }));
              showToast(footerData.enabled ? 'Footer Section Block disabled' : 'Footer Section Block enabled');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              footerData.enabled
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {footerData.enabled ? '✓ Included in Form' : '+ Enable Block'}
          </button>
        </div>
      </div>

      {/* Content preview/settings - Spacious remarks + Name & EMP */}
      {footerData.enabled && (
        <div className="p-3 sm:p-4 space-y-3">
          {/* Hidden file input for editable stage footer file attachment */}
          <input
            type="file"
            ref={editableFooterFileInputRef}
            onChange={handleFooterFileUpload}
            className="hidden"
            id="footer-editable-file-upload-input"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Column 1 Config: Remarks / Observations - Resized bigger to comfortably fit 1-2 sentences */}
            <div className="lg:col-span-6 p-3 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                    1. Remarks / Observations
                  </label>
                  <span className="text-[9px] text-slate-400 font-medium">(1–2 sentences)</span>
                </div>
                {/* Visible Attach File Mark / Action */}
                <button
                  type="button"
                  onClick={() => editableFooterFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition cursor-pointer shadow-2xs"
                  title="Attach file or photo to remarks"
                >
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach file / photo</span>
                </button>
              </div>

              {/* Resized bigger textarea */}
              <textarea
                rows={3}
                placeholder="Enter deviations, shift notes, or inspection observations (1–2 sentences)..."
                value={footerData.remarks}
                onChange={(e) => setFooterData(prev => ({ ...prev, remarks: e.target.value }))}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[72px]"
              />

              {/* Attachments list & status */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 min-h-[20px]">
                {(footerData.attachments || []).length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(footerData.attachments || []).map((att) => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-medium"
                      >
                        <Paperclip className="w-2.5 h-2.5 text-blue-500" />
                        <span className="max-w-[120px] truncate">{att.name}</span>
                        <span className="text-[9px] text-blue-400">({att.size})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFooterAttachment(att.id)}
                          className="hover:text-rose-600 transition ml-0.5 text-slate-400 cursor-pointer"
                          title="Remove attachment"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Paperclip className="w-2.5 h-2.5 text-slate-400" /> No files attached yet. Click 'Attach file' to add photos/documents.
                  </span>
                )}
              </div>
            </div>

            {/* Column 2 Config: Online Inspected By (Both Name and EMP) */}
            <div className="lg:col-span-3 p-3 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                  2. Online Inspected By
                </label>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">In-Line QC</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">Inspector Name</label>
                  <input
                    type="text"
                    placeholder="Inspector Name"
                    value={footerData.onlineInspectorName}
                    onChange={(e) => setFooterData(prev => ({ ...prev, onlineInspectorName: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">EMP No.</label>
                  <input
                    type="text"
                    placeholder="EMP No."
                    value={footerData.onlineEmpNo || ''}
                    onChange={(e) => setFooterData(prev => ({ ...prev, onlineEmpNo: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <span className="text-[9px] text-slate-400 block pt-0.5">Replaces signature space</span>
            </div>

            {/* Column 3 Config: Final Inspected By (Both Name and EMP) */}
            <div className="lg:col-span-3 p-3 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                  3. Final Inspected By
                </label>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">QA Authority</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">Inspector Name</label>
                  <input
                    type="text"
                    placeholder="Inspector Name"
                    value={footerData.finalInspectorName}
                    onChange={(e) => setFooterData(prev => ({ ...prev, finalInspectorName: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">EMP No.</label>
                  <input
                    type="text"
                    placeholder="EMP No."
                    value={footerData.finalEmpNo || ''}
                    onChange={(e) => setFooterData(prev => ({ ...prev, finalEmpNo: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
              <span className="text-[9px] text-slate-400 block pt-0.5">Replaces signature space</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
            <span>Inspector values synchronize directly with the Live Data Entry Preview at the bottom.</span>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('form-live-footer-section');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              View in Live Preview ↓
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render an interactive QA inspection Table / Grid element in live preview
  const renderLiveTableGrid = (
    savedSection: SectionBlockSchema,
    element: SectionElementSchema
  ) => {
    if (!element.tableConfig) return null;
    const { columns, rows } = element.tableConfig;

    // Calculate live statistics
    const dataRows = rows.filter((r) => !r.isGroupHeader);
    const dropdownCols = columns.filter((c) => c.type === 'dropdown');
    let passCount = 0;
    let failCount = 0;
    let measuredCount = 0;
    let totalDropdownChecks = 0;

    dataRows.forEach((r) => {
      const isRowManual = r.inputType === 'text' || r.inputType === 'number' || (r.inputType !== 'dropdown' && /voltage drop/i.test(r.cells['col-fi-param'] || r.cells['col-param'] || ''));
      dropdownCols.forEach((c) => {
        const cellKey = `${element.id}_${r.id}_${c.id}`;
        const val = savedSection.savedData?.[cellKey] ?? (r.cells[c.id] || '');
        if (isRowManual) {
          if (val && String(val).trim().length > 0 && val !== 'Pass' && val !== '--Select--' && val !== '--Select-' && val !== '18.4 mV' && val !== '19.1 mV' && val !== '17.8 mV') measuredCount++;
        } else {
          totalDropdownChecks++;
          if (val === 'Pass' || val === 'OK' || val === 'Accept') passCount++;
          if (val === 'Fail' || val === 'NG' || val === 'Reject') failCount++;
        }
      });
    });

    const handleMarkAllPass = () => {
      const updates: Record<string, string> = {};
      dataRows.forEach((r) => {
        const isRowManual = r.inputType === 'text' || r.inputType === 'number' || (r.inputType !== 'dropdown' && /voltage drop/i.test(r.cells['col-fi-param'] || r.cells['col-param'] || ''));
        if (!isRowManual) {
          dropdownCols.forEach((c) => {
            const cellKey = `${element.id}_${r.id}_${c.id}`;
            updates[cellKey] = 'Pass';
          });
        }
      });
      setSections((prev) =>
        prev.map((s) =>
          s.id === savedSection.id
            ? {
                ...s,
                savedData: { ...(s.savedData || {}), ...updates },
              }
            : s
        )
      );
      showToast(`All dropdown intervals for "${element.name}" set to Pass!`);
    };

    const handleResetTableEntries = () => {
      const keysToRemove = new Set<string>();
      dataRows.forEach((r) => {
        columns.forEach((c) => {
          keysToRemove.add(`${element.id}_${r.id}_${c.id}`);
        });
      });
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== savedSection.id) return s;
          const nextData = { ...(s.savedData || {}) };
          keysToRemove.forEach((k) => delete nextData[k]);
          return { ...s, savedData: nextData };
        })
      );
      showToast(`Reset live entries for "${element.name}".`);
    };

    return (
      <div key={element.id} className="w-full mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Table Title Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {(() => {
              const isFinal = element.type === 'final_table_grid' || /final|sample/i.test(element.name);
              return (
                <div className={`p-1.5 rounded-lg border ${
                  isFinal 
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isFinal ? <TestTube className="w-4 h-4" /> : <Table className="w-4 h-4" />}
                </div>
              );
            })()}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold tracking-wide">
                  {element.name}
                </h4>
                {(() => {
                  const isFinal = element.type === 'final_table_grid' || /final|sample/i.test(element.name);
                  return (
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                      isFinal
                        ? 'bg-indigo-950/90 text-indigo-300 border-indigo-700/60'
                        : 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
                    }`}>
                      {isFinal ? 'Final Inspection (3 Samples)' : 'Online / Visual Inspection'}
                    </span>
                  );
                })()}
              </div>
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                <span>{columns.length} Columns</span>
                <span>·</span>
                <span>{dataRows.length} Checkpoints</span>
                <span>·</span>
                <span>{rows.filter((r) => r.isGroupHeader).length} Inspection Groups</span>
              </div>
            </div>
          </div>

          {/* Live Counters & Controls */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {(totalDropdownChecks > 0 || measuredCount > 0) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px]">
                <span className="text-emerald-400 font-bold">{passCount} Pass</span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400 font-bold">{failCount} Fail</span>
                {measuredCount > 0 && (
                  <>
                    <span className="text-slate-600">/</span>
                    <span className="text-blue-400 font-bold">{measuredCount} Measured</span>
                  </>
                )}
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{totalDropdownChecks} Dropdowns</span>
              </div>
            )}

            {dropdownCols.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllPass}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Quickly fill all interval dropdowns with Pass"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Pass</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetTableEntries}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="Clear live entries for this table"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Scrollable Inspection Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-800 text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
                {columns.map((col, colIdx) => {
                  const hasTimeBox = col.hasTimeHeader || col.header.toLowerCase().includes('time');
                  const isSampleCol = /sample/i.test(col.header);
                  const timeKey = `${element.id}_time_${col.id}`;
                  const currentTimeVal = savedSection.savedData?.[timeKey] ?? (col.defaultHeaderTime || '');

                  return (
                    <th
                      key={col.id}
                      style={{ width: col.width }}
                      className="px-3 py-2.5 border-r border-slate-700/80 last:border-r-0 whitespace-nowrap align-top"
                    >
                      {hasTimeBox ? (
                        <div className="flex flex-col items-center gap-1.5 min-w-[95px]">
                          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-100">
                            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{col.header}</span>
                          </div>
                          {/* Small textbox to enter the time manually with 12 hrs round clock picker */}
                          <div 
                            onClick={() => {
                              setStudioClockPicker({
                                isOpen: true,
                                headerTitle: col.header,
                                initialValue: currentTimeVal || '08:30 AM',
                                onApply: (newTime) => {
                                  handlePreviewFieldChange(savedSection.id, timeKey, newTime);
                                },
                              });
                            }}
                            className="flex items-center gap-1.5 bg-slate-900 border border-slate-600 rounded px-2 py-0.5 shadow-inner hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400 cursor-pointer transition select-none group"
                            title={`Click to open 12 hrs round clock time picker for ${col.header}`}
                          >
                            <span className="text-[10px] text-slate-300 font-bold font-mono">Time:</span>
                            <span className="w-16 text-[11px] font-mono font-bold text-emerald-300 text-center select-none">
                              {currentTimeVal || '08:30 AM'}
                            </span>
                            <button
                              type="button"
                              className="text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition shrink-0 p-0.5 cursor-pointer"
                              title="Open 12 hrs round clock time picker"
                            >
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                          </div>
                        </div>
                      ) : isSampleCol ? (
                        <div className="flex flex-col items-center gap-1 min-w-[90px]">
                          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                            <TestTube className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{col.header}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-semibold uppercase tracking-wider">
                            Sample
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1.5 py-1">
                          <span>{col.header}</span>
                          <span className="text-[9px] lowercase font-normal px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                            {col.type === 'dropdown' ? 'interval' : col.type === 'number_input' ? 'number' : col.type === 'text_input' ? 'input' : 'spec'}
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => {
                if (row.isGroupHeader) {
                  return (
                    <tr
                      key={row.id}
                      className="bg-slate-100 border-y-2 border-slate-300 font-extrabold text-slate-900 text-xs tracking-wide"
                    >
                      <td
                        colSpan={columns.length}
                        className="px-4 py-2.5 uppercase text-slate-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span>{row.groupTitle}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-200 transition-colors ${
                      rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    } hover:bg-slate-100/60`}
                  >
                    {columns.map((col) => {
                      const cellKey = `${element.id}_${row.id}_${col.id}`;
                      const isDropdownCol = col.type === 'dropdown';
                      const isRowManualText = row.inputType === 'text' || row.inputType === 'number' || (row.inputType !== 'dropdown' && /voltage drop/i.test(row.cells['col-fi-param'] || row.cells['col-param'] || ''));
                      const isParamCol = col.id.includes('param') || col.header.toLowerCase().includes('param');

                      const rawVal = savedSection.savedData?.[cellKey] ?? (row.cells[col.id] || '');
                      // When text field is selected, no dummy data should enter - it should be blank space
                      const currVal = isRowManualText && (rawVal === 'Pass' || rawVal === 'Fail' || rawVal === 'N/A' || rawVal === '--Select--' || rawVal === '--Select-' || rawVal === '18.4 mV' || rawVal === '19.1 mV' || rawVal === '17.8 mV')
                        ? ''
                        : rawVal;

                      return (
                        <td
                          key={col.id}
                          className="px-3.5 py-2.5 border-r border-slate-200 last:border-r-0 text-xs text-slate-800 align-middle"
                        >
                          {isDropdownCol && isRowManualText ? (
                            <div className="relative">
                              <input
                                type="text"
                                value={currVal}
                                onChange={(e) =>
                                  handlePreviewFieldChange(savedSection.id, cellKey, e.target.value)
                                }
                                placeholder=""
                                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-2xs"
                                title={`Enter value for ${row.cells['col-fi-param'] || row.cells['col-param'] || 'parameter'} (${col.header})`}
                              />
                            </div>
                          ) : isDropdownCol ? (
                            <div className="relative">
                              <select
                                value={(!currVal || currVal === '--Select--' || currVal === '--Select-') ? '--Select--' : currVal}
                                onChange={(e) =>
                                  handlePreviewFieldChange(savedSection.id, cellKey, e.target.value)
                                }
                                className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border appearance-none pr-7 transition cursor-pointer ${
                                  currVal === 'Pass' || currVal === 'OK' || currVal === 'Accept'
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                    : currVal === 'Fail' || currVal === 'NG' || currVal === 'Reject'
                                    ? 'border-rose-400 bg-rose-50 text-rose-800'
                                    : 'border-slate-300 bg-white text-slate-700'
                                } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                              >
                                <option value="--Select--">--Select--</option>
                                {(col.options && col.options.length > 0 ? col.options : ['Pass', 'Fail', 'N/A']).map((opt, i) => (
                                  <option key={i} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          ) : isParamCol ? (
                            <div className="font-semibold text-slate-800">
                              {currVal || row.cells[col.id] || '-'}
                            </div>
                          ) : col.type === 'text_input' ? (
                            <input
                              type="text"
                              value={currVal}
                              onChange={(e) =>
                                handlePreviewFieldChange(savedSection.id, cellKey, e.target.value)
                              }
                              placeholder=""
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : col.type === 'number_input' ? (
                            <input
                              type="number"
                              step="any"
                              value={currVal}
                              onChange={(e) =>
                                handlePreviewFieldChange(savedSection.id, cellKey, e.target.value)
                              }
                              placeholder=""
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <div className="font-medium text-slate-800">
                              {currVal || row.cells[col.id] || '-'}
                            </div>
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
      </div>
    );
  };

  // 3. Render Live Data Entry Preview at the BOTTOM of the page
  const renderLivePreviewAtBottom = () => {
    // Render live preview if there is at least one saved section or if footer block is enabled
    const savedSections = sections.filter((s) => s.isSaved);
    if (savedSections.length === 0 && !footerData.enabled) return null;

    return (
      <div 
        id="live-preview-bottom-container" 
        className="w-full bg-slate-50/60 p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-3 duration-200"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Data Entry Preview
            </h4>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Page Bottom View
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Enter values below to test live inspection data input
          </span>
        </div>

        {savedSections.map((savedSection) => {
          const isFirstSection = savedSection.id === sections[0]?.id;
          const regularElements = savedSection.elements.filter((el) => !isTableElement(el.type));
          const tableElements = savedSection.elements.filter((el) => isTableElement(el.type));

          if (isFirstSection) {
            return (
              <div key={savedSection.id} className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200/90 bg-white">
                {/* 1. TOP HEADER BAR: Corporate Dark Banner - Completely Centered Layout */}
                <div className="bg-[#0b0f19] border-b-2 border-red-600 px-5 sm:px-8 py-5">
                  <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-3">
                    {/* Centered Company Badge */}
                    <div className="inline-flex flex-col items-center border border-slate-700/80 bg-slate-900/90 px-4 py-1.5 rounded-lg shadow-2xs">
                      <div className="text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase">
                        ABC COMPANY PVT LTD
                      </div>
                      <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400">
                        QA &amp; QUALITY ASSURANCE PORTAL
                      </div>
                    </div>

                    {/* Centered Document Title */}
                    <div className="space-y-1">
                      <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide">
                        {headerData.documentType || 'Online & Final Inspection Report'}
                      </h2>
                      <div>
                        <span className="px-3.5 py-0.5 rounded-full bg-red-950/60 border border-red-600/70 text-red-400 text-xs font-semibold shadow-2xs inline-block">
                          {headerData.productType || 'White Series – Switched Socket Outlet'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium tracking-wide flex flex-wrap items-center justify-center gap-2 pt-0.5">
                        <span>Doc: <span className="text-slate-200 font-mono font-bold">{headerData.documentNo || 'F 17/3-2.1'}</span></span>
                        <span className="text-slate-600">|</span>
                        <span>Rev: <span className="text-slate-200 font-bold">{headerData.revisionNo || '04'}</span></span>
                        <span className="text-slate-600">|</span>
                        <span>Date: <span className="text-slate-200 font-bold">{headerData.dateOfIssue || '2024-03-20'}</span></span>
                        {headerData.refStandard && (
                          <>
                            <span className="text-slate-600">|</span>
                            <span>Std: <span className="text-slate-200 font-bold">{headerData.refStandard}</span></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Centered Badges and Action Buttons */}
                    <div className="flex items-center flex-wrap justify-center gap-2 pt-1">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-600/80 text-purple-300 text-[11px] font-bold tracking-wider shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        <span>CONTROLLED COPY</span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                        title="Print Inspection Report"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-300" />
                        <span>Print</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePdfExport}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                        title="Export PDF Inspection Report"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-300" />
                        <span>PDF Export</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitQaRecord}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-sm shadow-red-500/25 transition cursor-pointer transform active:scale-95"
                        title="Submit QA Record to Register"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Submit QA Record</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. INSPECTION FORM CARD: Header row inside card & 4-Column Grid */}
                <div className="p-4 sm:p-6 bg-slate-50/40 space-y-4">
                  <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    {/* Card Top Sub-Header: Centered in preview */}
                    <div className="px-5 sm:px-6 py-4 bg-white border-b border-slate-100 flex flex-col items-center justify-center text-center gap-2.5">
                      {/* Centered Log Title */}
                      <div className="flex items-center justify-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shrink-0" />
                        <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800">
                          {savedSection.title || 'DIGITAL FACTORY INSPECTION LOG'}
                        </h3>
                      </div>

                      {/* Centered 4 Horizontal Rounded Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                        <div className="px-3 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50/70 text-slate-500 font-medium shadow-2xs">
                          Document No: <strong className="text-slate-800 font-bold ml-1">{headerData.documentNo || 'F 17/3-2.1'}</strong>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50/70 text-slate-500 font-medium shadow-2xs">
                          Date of Issue: <strong className="text-slate-800 font-bold ml-1">{headerData.dateOfIssue || '2024-03-20'}</strong>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50/70 text-slate-500 font-medium shadow-2xs">
                          Revision No: <strong className="text-slate-800 font-bold ml-1">{headerData.revisionNo || '04'}</strong>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50/70 text-slate-500 font-medium shadow-2xs">
                          Ref Standard: <strong className="text-slate-800 font-bold ml-1">{headerData.refStandard || 'SLS 734'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Card Body: 4-Column Grid Layout matching image for regular fields */}
                    {regularElements.length > 0 && (
                      <div className="p-5 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
                          {regularElements.map((element) => {
                            const currVal = savedSection.savedData?.[element.id] ?? '';

                            const placeholder = (() => {
                              const n = element.name.trim().toLowerCase();
                              if (n.includes('batch')) return 'Enter Batch Number Reference';
                              if (n.includes('product description') || n.includes('desc')) return 'Enter Product Description';
                              if (n.includes('item code')) return 'Enter Item Code Reference';
                              return `Enter ${element.name}`;
                            })();

                            return (
                              <div key={element.id} className="space-y-1.5 flex flex-col justify-start">
                                <label className="block text-xs font-semibold text-slate-700">
                                  {element.name}
                                </label>

                                {element.type === 'data_field' && (
                                  <input
                                    type="text"
                                    value={currVal}
                                    onChange={(e) => handlePreviewFieldChange(savedSection.id, element.id, e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition"
                                  />
                                )}

                                {element.type === 'date_picker' && (
                                  <input
                                    type="date"
                                    value={currVal || '2026-10-10'}
                                    onChange={(e) => handlePreviewFieldChange(savedSection.id, element.id, e.target.value)}
                                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition cursor-pointer"
                                  />
                                )}

                                {element.type === 'dropdown' && (
                                  <div className="relative">
                                    <select
                                      value={currVal}
                                      onChange={(e) => handlePreviewFieldChange(savedSection.id, element.id, e.target.value)}
                                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition cursor-pointer"
                                    >
                                      <option value="">Select {element.name}</option>
                                      {element.subItems.map((opt, i) => (
                                        <option key={i} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                )}

                                {element.type === 'radio' && (
                                  <div className="flex flex-wrap gap-2 pt-0.5">
                                    {element.subItems.map((opt, i) => (
                                      <label
                                        key={i}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                                          currVal === opt
                                            ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold'
                                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`live-radio-${savedSection.id}-${element.id}`}
                                          value={opt}
                                          checked={currVal === opt}
                                          onChange={() => handlePreviewFieldChange(savedSection.id, element.id, opt)}
                                          className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 1 Table Grids (if any) */}
                  {tableElements.map((tableEl) => (
                    renderLiveTableGrid(savedSection, tableEl)
                  ))}
                </div>
              </div>
            );
          }

          // 2nd, 3rd, and subsequent Saved Sections
          return (
            <div key={savedSection.id} className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-800 px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="text-white font-bold text-sm tracking-wide">
                    {savedSection.title}
                  </h3>
                </div>
                <span className="text-slate-300 text-xs font-medium">
                  Section {savedSection.sectionNumber}
                </span>
              </div>

              {/* Regular field inputs if any */}
              {regularElements.length > 0 && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {regularElements.map((element) => {
                    const currVal = savedSection.savedData?.[element.id] || '';

                    return (
                      <div key={element.id} className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                          {element.name}
                        </label>

                        {element.type === 'data_field' && (
                          <input
                            type="text"
                            value={currVal}
                            onChange={(e) => handlePreviewFieldChange(savedSection.id, element.id, e.target.value)}
                            placeholder={`Enter ${element.name}`}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                          />
                        )}

                        {element.type === 'date_picker' && (
                          <input
                            type="date"
                            value={currVal}
                            onChange={(e) => handlePreviewFieldChange(savedSection.id, element.id, e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                          />
                        )}

                        {element.type === 'dropdown' && (
                          <select
                            value={currVal}
                            onChange={(e) => handlePreviewFieldChange(savedSection.id, element.id, e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
                          >
                            <option value="">Select {element.name}</option>
                            {element.subItems.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {element.type === 'radio' && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {element.subItems.map((opt, i) => (
                              <label
                                key={i}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                                  currVal === opt
                                    ? 'border-slate-800 bg-slate-100 font-bold'
                                    : 'border-slate-200 bg-white'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`live-radio-${savedSection.id}-${element.id}`}
                                  value={opt}
                                  checked={currVal === opt}
                                  onChange={() => handlePreviewFieldChange(savedSection.id, element.id, opt)}
                                  className="text-slate-800 focus:ring-slate-600 w-3.5 h-3.5"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Table / Grid elements rendered full width */}
              {tableElements.length > 0 && (
                <div className="p-4 sm:p-6 space-y-6">
                  {tableElements.map((tableEl) => (
                    renderLiveTableGrid(savedSection, tableEl)
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ========================================================================= */}
        {/* FOOTER SECTION BLOCK: REMARKS / OBSERVATIONS & DUAL INSPECTION SIGN-OFF   */}
        {/* Matches user's reference image with Remarks, Online & Final Inspected By */}
        {/* ========================================================================= */}
        {footerData.enabled && (
          <div id="form-live-footer-section" className="w-full mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  INSPECTION SIGN-OFF &amp; REMARKS
                </h4>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Official Authorization
              </span>
            </div>

            {/* Hidden file input for live preview remarks file attachment */}
            <input
              type="file"
              ref={liveFooterFileInputRef}
              onChange={handleFooterFileUpload}
              className="hidden"
              id="footer-live-file-upload-input"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              {/* 1. REMARKS / OBSERVATIONS - Resized bigger for 1-2 sentences with prominent Attach File Mark */}
              <div className="lg:col-span-6 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-[11px] font-bold uppercase text-slate-700">
                      Remarks / Observations
                    </label>
                    <span className="text-[9px] text-slate-400 font-medium">(1–2 sentences)</span>
                  </div>

                  {/* Prominent Attach file mark button */}
                  <button
                    type="button"
                    onClick={() => liveFooterFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-[10px] font-bold transition cursor-pointer shadow-2xs"
                    title="Attach file or photo to remarks"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <span>Attach File / Photo</span>
                  </button>
                </div>

                {/* Big textarea accommodating 1-2 full sentences */}
                <textarea
                  rows={3}
                  value={footerData.remarks}
                  onChange={(e) => setFooterData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter deviations, shift notes, or inspection observations (1–2 sentences)..."
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-y min-h-[72px]"
                />

                {/* Attach File mark container & attached files list */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 min-h-[20px]">
                  {(footerData.attachments || []).length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(footerData.attachments || []).map((att) => (
                        <span
                          key={att.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-medium"
                        >
                          <Paperclip className="w-2.5 h-2.5 text-blue-500" />
                          <span className="max-w-[120px] truncate">{att.name}</span>
                          <span className="text-[9px] text-blue-400">({att.size})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFooterAttachment(att.id)}
                            className="hover:text-rose-600 transition ml-0.5 text-slate-400 cursor-pointer"
                            title="Remove attachment"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => liveFooterFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                      <span>Attach file mark: Click to upload test records, defect photos, or certificates</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. ONLINE INSPECTED BY (Both Name and EMP) */}
              <div className="lg:col-span-3 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase text-slate-700">
                    Online Inspected By
                  </label>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    In-Line QC
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">Inspector Name</label>
                    <input
                      type="text"
                      placeholder="Inspector Name"
                      value={footerData.onlineInspectorName}
                      onChange={(e) => setFooterData(prev => ({ ...prev, onlineInspectorName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">EMP No.</label>
                    <input
                      type="text"
                      placeholder="EMP No."
                      value={footerData.onlineEmpNo || ''}
                      onChange={(e) => setFooterData(prev => ({ ...prev, onlineEmpNo: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 block pt-0.5">Name &amp; EMP recorded (replaces signature)</span>
              </div>

              {/* 3. FINAL INSPECTED BY (Both Name and EMP) */}
              <div className="lg:col-span-3 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase text-slate-700">
                    Final Inspected By
                  </label>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                    QA Authority
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">Inspector Name</label>
                    <input
                      type="text"
                      placeholder="Inspector Name"
                      value={footerData.finalInspectorName}
                      onChange={(e) => setFooterData(prev => ({ ...prev, finalInspectorName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-0.5">EMP No.</label>
                    <input
                      type="text"
                      placeholder="EMP No."
                      value={footerData.finalEmpNo || ''}
                      onChange={(e) => setFooterData(prev => ({ ...prev, finalEmpNo: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 block pt-0.5">Name &amp; EMP recorded (replaces signature)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // If viewMode is 'cards', render the multi-form cards directory
  if (viewMode === 'cards') {
    return (
      <div className="w-full">
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl animate-in slide-in-from-top-4 duration-200 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <FormCardsGallery
          forms={forms}
          activeFormId={activeFormId}
          onSelectForm={handleSelectFormFromCards}
          onCreateNewForm={handleCreateNewForm}
          onDuplicateForm={handleDuplicateForm}
          onRenameForm={handleRenameForm}
          onDeleteForm={handleDeleteForm}
          onBackToPortal={onBack}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto flex flex-col space-y-4 pb-16 animate-in fade-in duration-200 px-2 sm:px-4 lg:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl animate-in slide-in-from-top-4 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar / Form Generator Toolbar: Placed at the top */}
      <div 
        id="form-generator-top-bar"
        className="w-full flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setViewMode('cards');
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            title="Return to Form Directory"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Form Directory</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                Form Generator
              </h2>
              {/* Form identity badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                activeForm.name === 'Testing_1' || activeForm.isOngoing
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {(activeForm.name === 'Testing_1' || activeForm.isOngoing) && (
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                )}
                <span>Form: {activeForm.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditorRenameValue(activeForm.name);
                    setIsEditorRenameModalOpen(true);
                  }}
                  className="ml-1 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Rename this form"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Editing specifications and inspection matrices • Auto-saved to card "{activeForm.name}"
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Form Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[11px] font-semibold text-slate-500">Switch:</span>
            <select
              value={activeFormId}
              onChange={(e) => handleSwitchActiveForm(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {forms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.name === 'Testing_1' ? '(Ongoing)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick + New Form button */}
          <button
            type="button"
            onClick={() => {
              const nextNum = forms.length + 1;
              setEditorNewFormName(`Testing_${nextNum}`);
              setEditorNewFormDocNo(`F 17/3-2.${nextNum}`);
              setEditorNewFormProduct('White Series – Switched Socket Outlet');
              setEditorNewFormTemplate('full');
              setEditorNewFormError('');
              setIsEditorNewFormModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer"
            title="Create a new form"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ New Form</span>
          </button>

          <button
            type="button"
            onClick={handleResetToTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            title="Reset Header and Section 1 to match the reference image"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Image Form</span>
          </button>

          {sections.length > 0 && (
            <button
              type="button"
              onClick={handleOpenDeployModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              id="btn-deploy-to-specifications"
              title="Deploy finished inspection form to Inspection Portal under Make New Inspection"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Deploy to Specifications</span>
            </button>
          )}

          {/* Button: Footer Section Block */}
          <button
            type="button"
            onClick={() => {
              setFooterData(prev => ({ ...prev, enabled: true }));
              const el = document.getElementById('section-block-footer') || document.getElementById('form-live-footer-section');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              showToast('Footer Section Block (Consecutive under Header)!');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm border border-indigo-200 transition cursor-pointer shadow-2xs"
            title="Configure Footer Section Block (Consecutive under Header)"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>+ Footer Section Block</span>
          </button>

          {/* Button: New Section Block */}
          <button
            type="button"
            onClick={handleOpenSectionModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Section block</span>
          </button>
        </div>
      </div>

      {/* 1. DOCUMENT HEADER SECTION: Placed at TOP of the page */}
      {renderDocumentHeaderCard()}

      {/* 2. FOOTER SECTION BLOCK: Placed consecutively right under Header Section in Editable Stage */}
      {renderFooterSectionCard()}

      {/* Main Content Area */}
      {sections.length === 0 ? (
        /* Empty State */
        <div className="w-full min-h-[380px] rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80">
            <Layers className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              No Section Blocks Yet
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Click &quot;New Section block&quot; to name your section block and start adding elements.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenSectionModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Section block</span>
          </button>
        </div>
      ) : (
        /* Section Blocks List */
        <div className="space-y-6">
          {/* Quick Add Standard Sections Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 font-semibold text-[11px]">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inspection Report Sections ({sections.length})</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleQuickAddOnlineSection}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] transition cursor-pointer shadow-2xs"
                title="Add Online / Visual QA Inspection section with interval table"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>+ Online Inspection Section</span>
              </button>
              <button
                type="button"
                onClick={handleQuickAddFinalSection}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-800 font-bold text-[11px] transition cursor-pointer shadow-2xs"
                title="Add Final Inspection section with 3 default samples"
              >
                <TestTube className="w-3 h-3 text-indigo-600" />
                <span>+ Final Inspection Section (3 Samples)</span>
              </button>
            </div>
          </div>

          {sections.map((section, sectionIdx) => {
            const isFirstSection = sectionIdx === 0;

            return (
              <div key={section.id} className="space-y-4">
                {/* 1. SQUARE SHAPE FIELD (Configuration / Builder Mode) */}
                <div
                  className={`w-full bg-white rounded-xl border-2 transition-all shadow-sm overflow-hidden ${
                    section.isSaved 
                      ? 'border-emerald-300 ring-1 ring-emerald-200/50 bg-slate-50/30' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {/* Square Shape Field Header */}
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                        {section.sectionNumber}
                      </span>

                      {editingSectionId === section.id ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <input
                            type="text"
                            value={editSectionTitleValue}
                            onChange={(e) => setEditSectionTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(section.id);
                              if (e.key === 'Escape') setEditingSectionId(null);
                            }}
                            autoFocus
                            className="w-full px-3 py-1 text-sm font-semibold rounded-lg border border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(section.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                            title="Save name"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSectionId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 truncate">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">
                            {section.title}
                          </h3>
                          {section.isSaved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Saved &amp; Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Draft (Save to unlock Live Preview)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section Action Buttons */}
                    <div className="flex items-center gap-1">
                      {editingSectionId !== section.id && (
                        <button
                          type="button"
                          onClick={() => handleStartRename(section.id, section.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
                          title="Rename section block"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete section block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Square Shape Field Content Area */}
                  <div className="p-5 space-y-4">
                    {/* When NO elements added yet */}
                    {section.elements.length === 0 ? (
                      <div className="min-h-[140px] rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <p className="text-xs text-slate-500 font-medium">
                          This section block has no elements yet. Click below to add your first element.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddElementModal(section.id)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Element</span>
                        </button>
                      </div>
                    ) : (
                      /* Elements List Rendered Inside Section Block Field */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>Defined Elements ({section.elements.length})</span>
                          <span className="text-[11px] text-slate-400">
                            {section.isSaved ? 'Section saved — see Live Preview below' : 'Click "Save Selection" to generate live preview'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {section.elements.map((element, elIdx) => {
                            if (isTableElement(element.type)) {
                              const isFinal = element.type === 'final_table_grid' || /final|sample/i.test(element.name);
                              const colCount = element.tableConfig?.columns.length || 0;
                              const dataRowCount = element.tableConfig?.rows.filter((r) => !r.isGroupHeader).length || 0;
                              const groupHeaderCount = element.tableConfig?.rows.filter((r) => r.isGroupHeader).length || 0;

                              return (
                                <div
                                  key={element.id}
                                  className={`col-span-full p-4 rounded-xl border-2 transition shadow-2xs space-y-3 relative group ${
                                    isFinal
                                      ? 'border-indigo-400/60 bg-indigo-50/20 hover:bg-indigo-50/30'
                                      : 'border-emerald-400/60 bg-emerald-50/20 hover:bg-emerald-50/30'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="text-[10px] font-bold text-slate-400 w-4">
                                        #{elIdx + 1}
                                      </span>
                                      <div className={`p-2 rounded-lg text-white shadow-2xs ${
                                        isFinal ? 'bg-indigo-600' : 'bg-emerald-600'
                                      }`}>
                                        {isFinal ? <TestTube className="w-4 h-4" /> : <Table className="w-4 h-4" />}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={element.name}>
                                            {element.name}
                                          </h4>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            isFinal
                                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                          }`}>
                                            {isFinal ? 'Final Inspection Grid (3 Samples)' : 'Online / Visual Inspection Grid'}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                                          <span>{colCount} Columns</span>
                                          <span>·</span>
                                          <span>{dataRowCount} Checkpoint Rows</span>
                                          <span>·</span>
                                          <span>{groupHeaderCount} Group Headers</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditElementModal(section.id, element)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white rounded-lg transition shadow-2xs cursor-pointer border ${
                                          isFinal
                                            ? 'text-indigo-800 hover:bg-indigo-50 border-indigo-300'
                                            : 'text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                                        }`}
                                        title="Configure table columns, input types, and inspection rows"
                                      >
                                        <Edit3 className={`w-3.5 h-3.5 ${isFinal ? 'text-indigo-700' : 'text-emerald-700'}`} />
                                        <span>Configure Table</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={elIdx === 0}
                                        onClick={() => handleMoveElement(section.id, elIdx, 'up')}
                                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/70 rounded transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                        title="Move element up"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={elIdx === section.elements.length - 1}
                                        onClick={() => handleMoveElement(section.id, elIdx, 'down')}
                                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/70 rounded transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                        title="Move element down"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteElement(section.id, element.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                        title="Delete table element"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Columns and Group Preview Chips */}
                                  <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[11px] font-semibold text-slate-400">Columns:</span>
                                      {element.tableConfig?.columns.map((col) => {
                                        const hasTimeBox = col.hasTimeHeader || col.header.toLowerCase().includes('time');
                                        const isSampleCol = /sample/i.test(col.header);
                                        const timeVal = section.savedData?.[`${element.id}_time_${col.id}`] ?? col.defaultHeaderTime;
                                        return (
                                          <span
                                            key={col.id}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium shadow-2xs ${
                                              isSampleCol 
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' 
                                                : 'bg-white border border-slate-200 text-slate-700'
                                            }`}
                                          >
                                            {hasTimeBox && <Clock className="w-3 h-3 text-emerald-600 shrink-0" />}
                                            {isSampleCol && <TestTube className="w-3 h-3 text-indigo-600 shrink-0" />}
                                            <span>{col.header}</span>
                                            {hasTimeBox && (
                                              <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded text-[10px] font-bold">
                                                {timeVal ? `Time: ${timeVal}` : 'Time:'}
                                              </span>
                                            )}
                                            <span className="text-slate-400 text-[10px]">
                                              ({col.type === 'dropdown' ? (isSampleCol ? 'Sample' : 'Dropdown') : col.type === 'number_input' ? 'Number' : col.type === 'text_input' ? 'Input' : 'Label'})
                                            </span>
                                          </span>
                                        );
                                      })}
                                    </div>
                                    {element.tableConfig?.rows.some((r) => r.isGroupHeader) && (
                                      <div className="text-[11px] text-slate-500 font-medium">
                                        Groups:{' '}
                                        <span className="text-slate-700 font-semibold">
                                          {element.tableConfig.rows
                                            .filter((r) => r.isGroupHeader)
                                            .map((r) => r.groupTitle)
                                            .join(', ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={element.id}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition shadow-2xs space-y-1.5 relative group"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 w-4">
                                      #{elIdx + 1}
                                    </span>
                                    {element.type === 'data_field' && (
                                      <Type className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                    )}
                                    {element.type === 'date_picker' && (
                                      <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                    )}
                                    {element.type === 'dropdown' && (
                                      <ChevronDown className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                                    )}
                                    {element.type === 'radio' && (
                                      <CircleDot className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    )}
                                    <label className="text-xs font-bold text-slate-700 truncate" title={element.name}>
                                      {element.name}
                                    </label>
                                  </div>

                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      disabled={elIdx === 0}
                                      onClick={() => handleMoveElement(section.id, elIdx, 'up')}
                                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/70 rounded transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                      title="Move element up"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={elIdx === section.elements.length - 1}
                                      onClick={() => handleMoveElement(section.id, elIdx, 'down')}
                                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/70 rounded transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                      title="Move element down"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteElement(section.id, element.id)}
                                      className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                      title="Delete element"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                                  <span className="font-semibold text-slate-600 capitalize">
                                    {element.type === 'data_field' && 'Data Field'}
                                    {element.type === 'date_picker' && 'Date Picker'}
                                    {element.type === 'dropdown' && 'Dropdown'}
                                    {element.type === 'radio' && 'Radio'}
                                  </span>
                                  {element.subItems.length > 0 && (
                                    <span className="text-purple-600 font-medium">
                                      {element.subItems.length} options
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section Action Bar: "Add Element" and "Save Selection" Button */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAddElementModal(section.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 font-bold text-xs shadow-2xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Add Element</span>
                        </button>

                        {/* Quick Table Grid Addition specific to Section Type */}
                        {(section.sectionNumber === 2 || /online|visual/i.test(section.title)) && (
                          <button
                            type="button"
                            onClick={() => handleLoadOnlineTableToSection(section.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-bold text-xs shadow-2xs transition cursor-pointer"
                            title="Add Online / Visual inspection table with interval monitoring (time 1, time 2)"
                          >
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ Online Table Grid</span>
                          </button>
                        )}

                        {(section.sectionNumber === 3 || /final/i.test(section.title)) && (
                          <button
                            type="button"
                            onClick={() => handleLoadFinalTableToSection(section.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 font-bold text-xs shadow-2xs transition cursor-pointer"
                            title="Add Final inspection table with 3 default samples (Sample 1, 2, 3)"
                          >
                            <TestTube className="w-3.5 h-3.5 text-indigo-600" />
                            <span>+ Final Table Grid (3 Samples)</span>
                          </button>
                        )}

                        {section.sectionNumber > 3 && !/online|visual|final/i.test(section.title) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleLoadOnlineTableToSection(section.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-bold text-xs shadow-2xs transition cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>+ Online Table Grid</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadFinalTableToSection(section.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 font-bold text-xs shadow-2xs transition cursor-pointer"
                            >
                              <TestTube className="w-3.5 h-3.5 text-indigo-600" />
                              <span>+ Final Table Grid (3)</span>
                            </button>
                          </>
                        )}

                        {section.sectionNumber === 1 && (
                          <button
                            type="button"
                            onClick={() => handleLoadReferenceImageElements(section.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer"
                            title="Load the 4 standard inspection elements for Section 1"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                            <span>Load Section 1 Fields</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {section.isSaved && (
                          <button
                            type="button"
                            onClick={() => handleReopenEditSection(section.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition cursor-pointer"
                            title="Re-open configuration to add or remove elements"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit Elements</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSaveSection(section.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition cursor-pointer ${
                            section.isSaved
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {section.isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Selection Saved</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Selection</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Another Section Block Button at bottom */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenSectionModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Section block</span>
            </button>

            {!footerData.enabled && (
              <button
                type="button"
                onClick={() => {
                  setFooterData(prev => ({ ...prev, enabled: true }));
                  showToast('Enabled Footer Section Block (Remarks & Dual Verification)!');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>+ Footer Section Block</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. LIVE DATA ENTRY PREVIEW: Placed at the BOTTOM of the page */}
      {renderLivePreviewAtBottom()}

      {/* MODAL 1: Asks user for Section Block Name */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  New Section Block
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseSectionModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="section-block-name-input"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Section Block Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="section-block-name-input"
                  ref={sectionNameInputRef}
                  type="text"
                  placeholder="e.g. Product Log Section Block"
                  value={sectionBlockName}
                  onChange={(e) => setSectionBlockName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  required
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Enter the name for this section block.
                </p>
                {/* Quick selection block name suggestions for 2nd and 3rd blocks */}
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Suggestions:</span>
                    {[
                      '2. ONLINE / VISUAL INSPECTION',
                      '3. FINAL INSPECTION (SAMPLE TESTING)',
                      'FOOTER BLOCK: REMARKS & SIGN-OFF',
                      'COORDINATION & ASSEMBLY FIT',
                      'ELECTRICAL & MECHANICAL SPECS'
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setSectionBlockName(sug)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                      >
                        +{sug}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Or create complete pre-configured section:
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseSectionModal();
                          handleQuickAddOnlineSection();
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>+ Section 2 (Online / Visual Grid)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseSectionModal();
                          handleQuickAddFinalSection();
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 text-xs font-bold transition cursor-pointer"
                      >
                        <TestTube className="w-3 h-3 text-indigo-600" />
                        <span>+ Section 3 (Final Inspection - 3 Samples)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseSectionModal();
                          setFooterData(prev => ({ ...prev, enabled: true }));
                          setTimeout(() => {
                            const el = document.getElementById('section-block-footer') || document.getElementById('form-live-footer-section');
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                          showToast('Footer Section Block enabled (Under Header)!');
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 text-xs font-bold transition cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3 text-purple-600" />
                        <span>+ Footer Section Block (Under Header)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseSectionModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!sectionBlockName.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Block</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit Element Modal (Data field, Date picker, Dropdown, Radio, Online Grid, Final Grid) */}
      {activeSectionForElement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full ${
              isTableElement(elementType) ? 'max-w-4xl lg:max-w-5xl' : 'max-w-lg'
            } bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col transition-all`}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  elementType === 'final_table_grid'
                    ? 'bg-indigo-600 text-white'
                    : elementType === 'table_grid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {elementType === 'final_table_grid' ? (
                    <TestTube className="w-5 h-5" />
                  ) : elementType === 'table_grid' ? (
                    <Table className="w-5 h-5" />
                  ) : (
                    <Layers className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingElementId
                      ? (elementType === 'final_table_grid'
                          ? 'Configure Final Inspection Grid (3 Samples)'
                          : elementType === 'table_grid'
                          ? 'Configure Online / Visual Inspection Grid'
                          : 'Configure Element Details')
                      : (elementType === 'final_table_grid'
                          ? 'Add Final Inspection Grid'
                          : elementType === 'table_grid'
                          ? 'Add Online Inspection Grid'
                          : 'Add New Element')}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {elementType === 'final_table_grid'
                      ? 'Final inspection specimen testing table (default 3 samples: Sample 1, 2, 3 with + Add Sample button)'
                      : elementType === 'table_grid'
                      ? 'Online / visual inspection table with time intervals (time 1, time 2 with exact manual "Time:" inputs)'
                      : 'Configure element details for this section block'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAddElementModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddElementSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-130px)]">
              {elementFormError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{elementFormError}</span>
                </div>
              )}

              {/* 1. Element Name */}
              <div>
                <label
                  htmlFor="element-name-input"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  1. Element Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="element-name-input"
                  ref={elementNameInputRef}
                  type="text"
                  placeholder={
                    elementType === 'final_table_grid'
                      ? 'e.g. Final Inspection Grid (Sample Testing), Finished Goods Checkpoints'
                      : elementType === 'table_grid'
                      ? 'e.g. Online / Visual QA Inspection Grid, In-Line Verification Table'
                      : 'e.g. Document No, Inspection Date, Batch Number Reference'
                  }
                  value={elementName}
                  onChange={(e) => {
                    setElementName(e.target.value);
                    if (elementFormError) setElementFormError(null);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  required
                />
              </div>

              {/* 2. Element Type Selection (6 options: Data field, Date picker, Dropdown, Radio, Online Grid, Final Grid) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Element Type <span className="text-rose-500">*</span>
                </label>
                {(() => {
                  const targetSec = sections.find((s) => s.id === activeSectionForElement);
                  const isOnlineSectionTarget = targetSec ? (targetSec.sectionNumber === 2 || /online|visual/i.test(targetSec.title)) : false;
                  const isFinalSectionTarget = targetSec ? (targetSec.sectionNumber === 3 || /final/i.test(targetSec.title)) : false;
                  // If editing an element, only show that specific table grid type
                  const showOnlyOnlineGrid = isOnlineSectionTarget || (editingElementId && elementType === 'table_grid');
                  const showOnlyFinalGrid = isFinalSectionTarget || (editingElementId && elementType === 'final_table_grid');

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {/* Data field */}
                      <button
                        type="button"
                        onClick={() => {
                          setElementType('data_field');
                          if (elementFormError) setElementFormError(null);
                        }}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition cursor-pointer ${
                          elementType === 'data_field'
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold ring-2 ring-emerald-500/30'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 font-medium'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${elementType === 'data_field' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Type className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Data field</div>
                          <div className="text-[10px] text-slate-400 font-normal">Text input</div>
                        </div>
                      </button>

                      {/* Date picker */}
                      <button
                        type="button"
                        onClick={() => {
                          setElementType('date_picker');
                          if (elementFormError) setElementFormError(null);
                        }}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition cursor-pointer ${
                          elementType === 'date_picker'
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold ring-2 ring-emerald-500/30'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 font-medium'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${elementType === 'date_picker' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Date picker</div>
                          <div className="text-[10px] text-slate-400 font-normal">Calendar date</div>
                        </div>
                      </button>

                      {/* Dropdown list */}
                      <button
                        type="button"
                        onClick={() => {
                          setElementType('dropdown');
                          if (elementFormError) setElementFormError(null);
                        }}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition cursor-pointer ${
                          elementType === 'dropdown'
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold ring-2 ring-emerald-500/30'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 font-medium'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${elementType === 'dropdown' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Dropdown list</div>
                          <div className="text-[10px] text-slate-400 font-normal">Select options</div>
                        </div>
                      </button>

                      {/* Radio button */}
                      <button
                        type="button"
                        onClick={() => {
                          setElementType('radio');
                          if (elementFormError) setElementFormError(null);
                        }}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition cursor-pointer ${
                          elementType === 'radio'
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold ring-2 ring-emerald-500/30'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 font-medium'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${elementType === 'radio' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <CircleDot className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Radio button</div>
                          <div className="text-[10px] text-slate-400 font-normal">Choice selector</div>
                        </div>
                      </button>

                      {/* 5. Online / Visual Inspection Table Grid (Only for Online sections or generic sections) */}
                      {!showOnlyFinalGrid && (
                        <button
                          type="button"
                          onClick={() => {
                            setElementType('table_grid');
                            if (!elementName.trim() || elementName.toLowerCase().includes('final')) {
                              setElementName('Online / Visual QA Inspection Grid');
                            }
                            if (elementFormError) setElementFormError(null);
                            const hasSample = tableColumns.some((c) => /sample/i.test(c.header));
                            if (hasSample || tableColumns.length === 0) {
                              handleLoadTwoIntervalPreset();
                            }
                          }}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition cursor-pointer ${
                            elementType === 'table_grid'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/40 shadow-xs'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className={`p-1.5 rounded-lg ${elementType === 'table_grid' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              <Table className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-200/80 text-emerald-800">
                              Online Grid
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">Online Table Grid</div>
                            <div className="text-[10px] text-slate-400 font-normal">Visual checks &amp; intervals</div>
                          </div>
                        </button>
                      )}

                      {/* 6. Final Inspection Table Grid (Only for Final sections or generic sections) */}
                      {!showOnlyOnlineGrid && (
                        <button
                          type="button"
                          onClick={() => {
                            setElementType('final_table_grid');
                            if (!elementName.trim() || elementName.toLowerCase().includes('online') || elementName.toLowerCase().includes('visual')) {
                              setElementName('Final Inspection Grid (Sample Testing)');
                            }
                            if (elementFormError) setElementFormError(null);
                            const hasSample = tableColumns.some((c) => /sample/i.test(c.header));
                            if (!hasSample || tableColumns.length === 0) {
                              handleLoadFinalInspectionPreset();
                            }
                          }}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition cursor-pointer ${
                            elementType === 'final_table_grid'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-500/40 shadow-xs'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className={`p-1.5 rounded-lg ${elementType === 'final_table_grid' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              <TestTube className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-200/80 text-indigo-800">
                              Final Grid (3)
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">Final Table Grid</div>
                            <div className="text-[10px] text-slate-400 font-normal">Testing 3 samples default</div>
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 3. Sub Items Configuration - ONLY appears for Dropdown list or Radio button */}
              {(elementType === 'dropdown' || elementType === 'radio') && (
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                      3. Sub Item Names ({elementType === 'dropdown' ? 'Dropdown Options' : 'Radio Choices'}) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-purple-600 font-medium">
                      {subItemsList.length} items added
                    </span>
                  </div>

                  {/* Input to add sub item name */}
                  <div className="flex gap-2">
                    <input
                      ref={subItemInputRef}
                      type="text"
                      placeholder="Enter sub item name (e.g. Pass, Fail, High, Low)..."
                      value={subItemInput}
                      onChange={(e) => setSubItemInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubItem();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-purple-300 bg-white text-slate-800 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubItem}
                      disabled={!subItemInput.trim()}
                      className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition shadow-2xs"
                    >
                      Add Sub Item
                    </button>
                  </div>

                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-purple-700">Quick add:</span>
                    {['Pass', 'Fail', 'Yes', 'No', 'N/A', 'Pending'].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => {
                          if (!subItemsList.includes(quick)) {
                            setSubItemsList((prev) => [...prev, quick]);
                          }
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 text-[10px] font-medium transition cursor-pointer"
                      >
                        +{quick}
                      </button>
                    ))}
                  </div>

                  {/* Sub items list tags */}
                  {subItemsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {subItemsList.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-purple-300 text-purple-900 text-xs font-semibold shadow-2xs"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubItem(idx)}
                            className="p-0.5 rounded-full hover:bg-purple-100 text-purple-600 hover:text-rose-600 transition cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-purple-600 italic">
                      No sub items added yet. Type a name above and click &quot;Add Sub Item&quot;.
                    </p>
                  )}
                </div>
              )}

              {/* 4. TABLE / GRID CONFIGURATION STUDIO: Full facilities for custom columns, input types, and group/data rows */}
              {isTableElement(elementType) && (
                <div className={`space-y-4 rounded-2xl border ${
                  elementType === 'final_table_grid' ? 'border-indigo-200' : 'border-emerald-200'
                } bg-slate-50/50 p-4 sm:p-5 animate-in fade-in duration-150`}>
                  
                  {/* Distinct Operations Banner (Online vs Final Inspection) */}
                  {elementType === 'final_table_grid' ? (
                    <div className="p-3.5 sm:p-4 rounded-xl border-2 border-indigo-300 bg-indigo-50/80 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                            Final Inspection Operations
                          </span>
                          <span className="text-xs font-bold text-indigo-950">
                            Sample Testing (3 Default Samples: S1, S2, S3)
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={handleAddSampleColumnInModal}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                            title="Add next sample testing column"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <TestTube className="w-3.5 h-3.5" />
                            <span>+ Add Sample</span>
                          </button>
                          {tableColumns.filter((c) => /sample/i.test(c.header)).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const sampleCols = tableColumns.filter((c) => /sample/i.test(c.header));
                                const lastCol = sampleCols[sampleCols.length - 1];
                                handleRemoveTableColumn(lastCol.id);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                              title="Remove last sample column"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>Remove Sample</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleLoadFinalInspectionPreset}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-100 text-indigo-800 text-xs font-semibold transition cursor-pointer shadow-2xs"
                            title="Reset to 3 default samples"
                          >
                            <RotateCcw className="w-3 h-3 text-indigo-600" />
                            <span>Reset 3 Samples</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-indigo-900/90 leading-relaxed font-medium">
                        Testing evaluates <strong>3 samples</strong> by default (Sample 1, Sample 2, Sample 3) for finished products. If more specimens are needed, click <strong>&quot;+ Add Sample&quot;</strong> to add Sample 4, 5, etc. directly.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 sm:p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/80 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-extrabold text-[10px] tracking-wider uppercase">
                            Online / Visual Operations
                          </span>
                          <span className="text-xs font-bold text-emerald-950">
                            In-Process Interval Monitoring (time 1, time 2)
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={handleAddTimeIntervalInModal}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                            title="Add next time interval column (time 3, time 4, etc.)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <Clock className="w-3.5 h-3.5" />
                            <span>+ Add Time Interval</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleLoadTwoIntervalPreset}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition cursor-pointer shadow-2xs"
                            title="Reload 2-interval format"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-700" />
                            <span>2-Interval Online Grid</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-900/90 leading-relaxed font-medium">
                        Online inspection tracks manufacturing quality across shift intervals. Each interval column includes an exact manual <strong>&quot;Time:&quot;</strong> textbox header for precise checkpoint timestamp logging.
                      </p>
                    </div>
                  )}

                  {/* Sub-tab Navigation */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTableConfigSubTab('columns')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                          tableConfigSubTab === 'columns'
                            ? (elementType === 'final_table_grid' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-emerald-600 text-white shadow-2xs')
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>1. Custom Columns ({tableColumns.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTableConfigSubTab('rows')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                          tableConfigSubTab === 'rows'
                            ? (elementType === 'final_table_grid' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-emerald-600 text-white shadow-2xs')
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Rows className="w-3.5 h-3.5" />
                        <span>2. Rows &amp; Group Headers ({tableRows.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTableConfigSubTab('preview')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                          tableConfigSubTab === 'preview'
                            ? (elementType === 'final_table_grid' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-emerald-600 text-white shadow-2xs')
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>3. Table Preview</span>
                      </button>
                    </div>

                    {/* Quick Presets Bar - specific to table type */}
                    <div className="flex items-center flex-wrap gap-1.5 text-xs">
                      {elementType === 'table_grid' && (
                        <button
                          type="button"
                          onClick={handleLoadTwoIntervalPreset}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold transition cursor-pointer shadow-2xs"
                          title="Reset Online Visual inspection checkpoints: Appearance, Markings, Color, Parting Line"
                        >
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reset Online Visual Grid (Visual Checkpoints)</span>
                        </button>
                      )}
                      {elementType === 'final_table_grid' && (
                        <button
                          type="button"
                          onClick={handleLoadFinalInspectionPreset}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold transition cursor-pointer shadow-2xs"
                          title="Reset Final Inspection testing checkpoints: Electrical, Mechanical, Packaging with 3 default samples"
                        >
                          <TestTube className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Reset Final Inspection (3 Default Samples)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SUB-TAB 1: DEFINE CUSTOM COLUMNS & INPUT TYPES */}
                  {tableConfigSubTab === 'columns' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-emerald-600" />
                            <span>Add New Custom Column</span>
                          </label>
                          <div className="flex items-center gap-2">
                            {elementType === 'final_table_grid' ? (
                              <button
                                type="button"
                                onClick={handleAddSampleColumnInModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold transition cursor-pointer shadow-2xs"
                                title="Add next sample column with Pass/Fail dropdown"
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                                <TestTube className="w-3.5 h-3.5 text-indigo-600" />
                                <span>+ Add Sample Column</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleAddTimeIntervalInModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition cursor-pointer shadow-2xs"
                                title="Add next time interval with manual Time: textbox"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>+ Add Time Interval</span>
                              </button>
                            )}
                            <span className="text-[11px] text-slate-400">
                              Define column name &amp; type
                            </span>
                          </div>
                        </div>

                        {/* Quick Add Suggestion Chips - STRICTLY UNIQUE TO ACTIVE TABLE GRID */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] pb-1 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Quick column templates:</span>
                          
                          {/* Final Inspection Columns ONLY */}
                          {elementType === 'final_table_grid' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewColHeader('Sample 1');
                                  setNewColType('dropdown');
                                  setNewColDropdownOptions('Pass, Fail, N/A');
                                  setNewColHasTime(false);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold cursor-pointer transition shadow-2xs"
                                title="Add Sample 1 test column"
                              >
                                <TestTube className="w-3 h-3 text-indigo-600" />
                                <span>+ Sample 1</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewColHeader('Sample 2');
                                  setNewColType('dropdown');
                                  setNewColDropdownOptions('Pass, Fail, N/A');
                                  setNewColHasTime(false);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold cursor-pointer transition shadow-2xs"
                                title="Add Sample 2 test column"
                              >
                                <TestTube className="w-3 h-3 text-indigo-600" />
                                <span>+ Sample 2</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewColHeader('Sample 3');
                                  setNewColType('dropdown');
                                  setNewColDropdownOptions('Pass, Fail, N/A');
                                  setNewColHasTime(false);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold cursor-pointer transition shadow-2xs"
                                title="Add Sample 3 test column"
                              >
                                <TestTube className="w-3 h-3 text-indigo-600" />
                                <span>+ Sample 3</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleAddSampleColumnInModal}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition shadow-2xs"
                                title="Automatically adds next sample column"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Next Sample</span>
                              </button>
                            </>
                          )}

                          {/* Online Inspection Columns ONLY */}
                          {elementType === 'table_grid' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewColHeader('time 1');
                                  setNewColType('dropdown');
                                  setNewColDropdownOptions('Pass, Fail, N/A');
                                  setNewColHasTime(true);
                                  setNewColDefaultTime('');
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold cursor-pointer transition shadow-2xs"
                                title="Add time 1 interval column with manual Time: textbox"
                              >
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>+ time 1 (Time:)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewColHeader('time 2');
                                  setNewColType('dropdown');
                                  setNewColDropdownOptions('Pass, Fail, N/A');
                                  setNewColHasTime(true);
                                  setNewColDefaultTime('');
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold cursor-pointer transition shadow-2xs"
                                title="Add time 2 interval column with manual Time: textbox"
                              >
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>+ time 2 (Time:)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewColHeader('time 3');
                                  setNewColType('dropdown');
                                  setNewColDropdownOptions('Pass, Fail, N/A');
                                  setNewColHasTime(true);
                                  setNewColDefaultTime('');
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold cursor-pointer transition shadow-2xs"
                                title="Add time 3 interval column with manual Time: textbox"
                              >
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>+ time 3 (Time:)</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleAddTimeIntervalInModal}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition shadow-2xs"
                                title="Automatically adds next interval column"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Next Interval</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setNewColHeader('MIC NO');
                              setNewColType('text_label');
                              setNewColHasTime(false);
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            + MIC NO
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewColHeader('Parameter');
                              setNewColType('text_label');
                              setNewColHasTime(false);
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            + Parameter
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewColHeader('Specifications');
                              setNewColType('text_label');
                              setNewColHasTime(false);
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            + Specifications
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewColHeader('Remarks');
                              setNewColType('text_input');
                              setNewColHasTime(false);
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            + Remarks
                          </button>
                        </div>

                        {/* Column Definition Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          <div className="sm:col-span-5 space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                              Column Header Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. MIC NO, Parameter, time 1, time 2, Specifications"
                              value={newColHeader}
                              onChange={(e) => {
                                setNewColHeader(e.target.value);
                                if (e.target.value.toLowerCase().includes('time')) {
                                  setNewColHasTime(true);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTableColumn();
                                }
                              }}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-4 space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                              Column Input Type
                            </label>
                            <select
                              value={newColType}
                              onChange={(e) => setNewColType(e.target.value as ColumnInputType)}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
                            >
                              <option value="dropdown">Dropdown (Intervals e.g. Pass/Fail)</option>
                              <option value="text_label">Text / Label (Specifications/Notes)</option>
                              <option value="text_input">Text Input (Live entry)</option>
                              <option value="number_input">Number Input (Measurements)</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <button
                              type="button"
                              onClick={handleAddTableColumn}
                              disabled={!newColHeader.trim()}
                              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Column</span>
                            </button>
                          </div>
                        </div>

                        {/* Exact Time Textbox Configuration in Header */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-2.5 rounded-lg border">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newColHasTime || newColHeader.toLowerCase().includes('time')}
                              onChange={(e) => setNewColHasTime(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Include &quot;Time:&quot; header textbox (user enters time manually)</span>
                            </span>
                          </label>

                          {(newColHasTime || newColHeader.toLowerCase().includes('time')) && (
                            <div className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono">Format:</span>
                              <span className="font-mono font-bold text-emerald-700">Time: [ manual entry ]</span>
                            </div>
                          )}
                        </div>

                        {/* Dropdown Options if Dropdown is selected */}
                        {newColType === 'dropdown' && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                              Dropdown Choices:
                            </label>
                            <input
                              type="text"
                              value={newColDropdownOptions}
                              onChange={(e) => setNewColDropdownOptions(e.target.value)}
                              placeholder="e.g. Pass, Fail, N/A"
                              className="flex-1 min-w-[180px] px-2.5 py-1 text-xs rounded border border-slate-300 bg-white text-slate-800"
                            />
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="text-slate-400">Presets:</span>
                              <button
                                type="button"
                                onClick={() => setNewColDropdownOptions('Pass, Fail, N/A')}
                                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                              >
                                Pass/Fail
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewColDropdownOptions('OK, NG')}
                                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                              >
                                OK/NG
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Current Configured Columns List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Defined Columns in Order ({tableColumns.length})</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Use controls to rename, enter exact times, reorder, or delete
                          </span>
                        </div>

                        <div className="space-y-2">
                          {tableColumns.map((col, idx) => {
                            const hasTime = col.hasTimeHeader || col.header.toLowerCase().includes('time');

                            return (
                              <div
                                key={col.id}
                                className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-wrap items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={col.header}
                                    onChange={(e) => handleUpdateColumnHeader(col.id, e.target.value)}
                                    className="px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 hover:bg-white"
                                    title="Edit column header name"
                                  />
                                  <span className="text-slate-400 text-xs">·</span>
                                  <select
                                    value={col.type}
                                    onChange={(e) => handleUpdateColumnType(col.id, e.target.value as ColumnInputType)}
                                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer"
                                  >
                                    <option value="dropdown">Dropdown (Interval)</option>
                                    <option value="text_label">Text / Label (Spec)</option>
                                    <option value="text_input">Text Input</option>
                                    <option value="number_input">Number Input</option>
                                  </select>
                                </div>

                                {/* Small Textbox to enter the time manually for time 1, time 2 */}
                                {hasTime ? (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono">Time:</span>
                                    <input
                                      type="text"
                                      value={col.defaultHeaderTime || ''}
                                      onChange={(e) => handleUpdateColumnDefaultTime(col.id, e.target.value)}
                                      placeholder="Manual entry"
                                      className="w-24 px-1.5 py-0.5 text-xs font-mono font-medium rounded border border-emerald-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                                      title="Header time (left blank for manual entry during inspection)"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleToggleColumnTimeHeader(col.id)}
                                      className="text-[10px] text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                                      title="Remove Time: box"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleColumnTimeHeader(col.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 text-slate-500 transition cursor-pointer"
                                    title="Add manual Time: textbox in column header"
                                  >
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>+ &quot;Time:&quot; Box</span>
                                  </button>
                                )}

                                {col.type === 'dropdown' && (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="text-[10px] text-slate-400 font-semibold">Options:</span>
                                    <input
                                      type="text"
                                      value={col.options?.join(', ') || ''}
                                      onChange={(e) => handleUpdateColumnOptions(col.id, e.target.value)}
                                      placeholder="Pass, Fail, N/A"
                                      className="px-2 py-0.5 text-xs rounded border border-slate-200 w-32"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveColumn(idx, 'left')}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                                    title="Move column left"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === tableColumns.length - 1}
                                    onClick={() => handleMoveColumn(idx, 'right')}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                                    title="Move column right"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={tableColumns.length <= 1}
                                    onClick={() => handleRemoveTableColumn(col.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-20 cursor-pointer"
                                    title="Delete column"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: CONFIGURE ROWS & GROUP HEADERS */}
                  {tableConfigSubTab === 'rows' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      {/* Insertion Controls for Group Headers and Data Rows */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* 1. Add Group Header Form */}
                        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-600" />
                              <span>Add Group Header</span>
                            </label>
                            <span className="text-[10px] text-indigo-600 font-medium">Spans full table</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newGroupHeaderTitle}
                              onChange={(e) => setNewGroupHeaderTitle(e.target.value)}
                              placeholder="e.g. 1 VISUAL INSPECTION, 2 COORDINATION..."
                              className="flex-1 px-3 py-2 text-xs rounded-lg border border-indigo-300 bg-white text-slate-800 placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={handleAddGroupHeader}
                              disabled={!newGroupHeaderTitle.trim()}
                              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                            >
                              + Add Header
                            </button>
                          </div>
                          {/* Quick suggestions */}
                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-indigo-700">
                            <span className="font-semibold">Quick add:</span>
                            {(elementType === 'final_table_grid'
                              ? [
                                  '1. ELECTRICAL & DIELECTRIC SAFETY TESTS',
                                  '2. COORDINATION, MECHANICAL & ASSEMBLY TESTS',
                                  '3. PACKAGING & FINAL LOT DISPOSITION',
                                ]
                              : [
                                  '1. ONLINE / VISUAL INSPECTION',
                                  '2. SURFACE FINISH & COATING',
                                  '3. MOULD PARTING & CLEANLINESS',
                                ]
                            ).map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => setNewGroupHeaderTitle(q)}
                                className="px-1.5 py-0.5 rounded bg-white border border-indigo-200 hover:bg-indigo-100 transition"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Add Regular Data Row Form */}
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              <span>Add Regular Data Row</span>
                            </label>
                            <span className="text-[10px] text-emerald-700 font-medium">Checkpoint item</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={newDataRowMic}
                              onChange={(e) => setNewDataRowMic(e.target.value)}
                              placeholder="MIC NO (e.g. 01)"
                              className="px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white text-slate-800 placeholder-slate-400"
                            />
                            <input
                              type="text"
                              value={newDataRowParam}
                              onChange={(e) => setNewDataRowParam(e.target.value)}
                              placeholder="Parameter (e.g. 1.4 Voltage Drop Test)"
                              className="px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white text-slate-800 placeholder-slate-400"
                            />
                            <input
                              type="text"
                              value={newDataRowSpec}
                              onChange={(e) => setNewDataRowSpec(e.target.value)}
                              placeholder="Specifications"
                              className="px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white text-slate-800 placeholder-slate-400"
                            />
                          </div>

                          {/* Input Mode Selector for the parameter row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Sample Value Mode:</span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {newDataRowInputType === 'text' ? '(Text Field for manual values)' : '(Pass/Fail Dropdown)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setNewDataRowInputType('dropdown')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                  newDataRowInputType === 'dropdown'
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                ✓ Dropdown (Pass/Fail)
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewDataRowInputType('text')}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                  newDataRowInputType === 'text'
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                ✎ Manual Text Field (e.g. Voltage Drop)
                              </button>
                            </div>
                          </div>

                          {/* Quick checkpoint templates based on active table grid type */}
                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-emerald-800">
                            <span className="font-semibold text-slate-500">Quick checkpoints:</span>
                            {(elementType === 'final_table_grid'
                              ? [
                                  { mic: '01', param: '1.1 High Voltage Flash (2000V AC)', spec: 'No breakdown or flashover for 1 min', inputType: 'dropdown' },
                                  { mic: '02', param: '1.2 Insulation Resistance (500V DC)', spec: '≥ 5.0 MΩ live parts to body', inputType: 'dropdown' },
                                  { mic: '03', param: '1.3 Earth Continuity / Ground Bond', spec: 'Resistance ≤ 0.05 Ω at 25A', inputType: 'dropdown' },
                                  { mic: '04', param: '1.4 Voltage Drop Test (Terminal to Contact)', spec: 'Voltage drop ≤ 45 mV at 13A rated load', inputType: 'text' },
                                  { mic: '05', param: '2.1 Rocker Snap Action & Fit', spec: 'Positive engagement, positive latching', inputType: 'dropdown' },
                                  { mic: '06', param: '2.2 Safety Shutter & Pin Force', spec: 'Withdrawal force 1.5 N - 5.4 N', inputType: 'dropdown' },
                                  { mic: '07', param: '2.3 Terminal Screws Torque', spec: '1.20 N·m (±0.15 N·m) SLS standard', inputType: 'dropdown' },
                                ]
                              : [
                                  { mic: '01', param: '1.1 Appearance', spec: 'Clean finish, zero flashes or cracks', inputType: 'dropdown' },
                                  { mic: '02', param: '1.2 Markings & Labeling', spec: 'Legible print, ratings visible', inputType: 'dropdown' },
                                  { mic: '03', param: '1.3 Color & Surface Finish', spec: 'Uniform batch shade, scratch-free', inputType: 'dropdown' },
                                  { mic: '04', param: '1.4 Mould Parting Line', spec: 'Flush seam, zero burrs', inputType: 'dropdown' },
                                ]
                            ).map((cp, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setNewDataRowMic(cp.mic);
                                  setNewDataRowParam(cp.param);
                                  setNewDataRowSpec(cp.spec);
                                  if (cp.inputType) setNewDataRowInputType(cp.inputType as any);
                                }}
                                className={`px-1.5 py-0.5 rounded border transition flex items-center gap-1 ${
                                  cp.inputType === 'text' 
                                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 font-bold' 
                                    : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {cp.inputType === 'text' && <span className="text-[9px] text-blue-600 font-bold">✎</span>}
                                <span>{cp.param.split(' ')[1] || cp.param}</span>
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={handleAddDataRow}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Insert Data Row</span>
                          </button>
                        </div>
                      </div>

                      {/* Configured Rows Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Configured Table Rows ({tableRows.length})</span>
                          <button
                            type="button"
                            onClick={handleClearTableRows}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            Clear All Rows
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                          {tableRows.map((row, idx) => {
                            if (row.isGroupHeader) {
                              return (
                                <div
                                  key={row.id}
                                  className="p-3 rounded-xl border border-slate-700 bg-slate-900 text-white shadow-2xs flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 uppercase tracking-wider">
                                      Group Header
                                    </span>
                                    <input
                                      type="text"
                                      value={row.groupTitle || ''}
                                      onChange={(e) => handleUpdateGroupTitle(row.id, e.target.value)}
                                      className="flex-1 px-2.5 py-1 text-xs font-extrabold text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                      title="Edit Group Header Title"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveRow(idx, 'up')}
                                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                                      title="Move up"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === tableRows.length - 1}
                                      onClick={() => handleMoveRow(idx, 'down')}
                                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                                      title="Move down"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(row.id)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 cursor-pointer"
                                      title="Delete group header"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={row.id}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-wrap items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-[280px]">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  {tableColumns.map((col) => (
                                    <input
                                      key={col.id}
                                      type="text"
                                      placeholder={col.header}
                                      value={row.cells[col.id] || ''}
                                      onChange={(e) => handleUpdateRowCell(row.id, col.id, e.target.value)}
                                      className="px-2 py-1 text-xs rounded border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:ring-1 focus:ring-emerald-500 w-28 flex-1"
                                    />
                                  ))}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {/* Row mode toggle: Dropdown vs Text Field */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRowInputType(row.id)}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer shrink-0 shadow-2xs ${
                                      (row.inputType === 'text' || (!row.inputType && /voltage drop/i.test(row.cells['col-fi-param'] || row.cells['col-param'] || '')))
                                        ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                                        : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                    }`}
                                    title="Toggle between Pass/Fail dropdown and manual text field for this row"
                                  >
                                    <ArrowUpDown className="w-2.5 h-2.5" />
                                    <span>{(row.inputType === 'text' || (!row.inputType && /voltage drop/i.test(row.cells['col-fi-param'] || row.cells['col-param'] || ''))) ? 'Text Field' : 'Dropdown'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveRow(idx, 'up')}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                                    title="Move row up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === tableRows.length - 1}
                                    onClick={() => handleMoveRow(idx, 'down')}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                                    title="Move row down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(row.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="Delete data row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: INTERACTIVE PREVIEW INSIDE MODAL */}
                  {tableConfigSubTab === 'preview' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>Live Preview of Configured Table</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({tableColumns.length} Columns · {tableRows.length} Rows)
                          </span>
                        </div>

                        {/* Quick Sample Button inside Preview */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAddSampleColumnInModal}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold transition cursor-pointer shadow-2xs"
                            title="Add another sample column directly to preview"
                          >
                            <Plus className="w-3.5 h-3.5 text-indigo-600" />
                            <TestTube className="w-3.5 h-3.5 text-indigo-600" />
                            <span>+ Add Sample</span>
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
                        <table className="w-full text-left border-collapse min-w-[650px]">
                          <thead>
                            <tr className="bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
                              {tableColumns.map((col) => {
                                const hasTime = col.hasTimeHeader || col.header.toLowerCase().includes('time');
                                const isSampleCol = /sample/i.test(col.header);

                                return (
                                  <th key={col.id} className="px-3.5 py-2.5 border-r border-slate-700 last:border-r-0 align-top">
                                    {hasTime ? (
                                      <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-100">
                                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                          <span>{col.header}</span>
                                        </div>
                                        {/* Small textbox in header with 12 hrs round clock picker */}
                                        <div 
                                          onClick={() => {
                                            setStudioClockPicker({
                                              isOpen: true,
                                              headerTitle: col.header,
                                              initialValue: col.defaultHeaderTime || '08:30 AM',
                                              onApply: (newTime) => {
                                                handleUpdateColumnDefaultTime(col.id, newTime);
                                              },
                                            });
                                          }}
                                          className="flex items-center gap-1.5 bg-slate-900 border border-slate-600 rounded px-2 py-0.5 hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400 cursor-pointer transition select-none group"
                                          title={`Click to open 12 hrs round clock time picker for ${col.header}`}
                                        >
                                          <span className="text-[10px] text-slate-300 font-bold font-mono">Time:</span>
                                          <span className="w-16 text-[11px] font-mono font-bold text-emerald-300 text-center select-none">
                                            {col.defaultHeaderTime || '08:30 AM'}
                                          </span>
                                          <button
                                            type="button"
                                            className="text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition shrink-0 p-0.5 cursor-pointer"
                                            title="Open 12 hrs round clock time picker"
                                          >
                                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : isSampleCol ? (
                                      <div className="flex flex-col items-center gap-1 min-w-[85px]">
                                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                                          <TestTube className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                          <span>{col.header}</span>
                                        </div>
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-semibold uppercase tracking-wider">
                                          Sample
                                        </span>
                                      </div>
                                    ) : (
                                      <span>{col.header}</span>
                                    )}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {tableRows.map((row) => {
                              if (row.isGroupHeader) {
                                return (
                                  <tr key={row.id} className="bg-slate-100 border-y-2 border-slate-300 font-extrabold text-slate-900 text-xs tracking-wide">
                                    <td colSpan={tableColumns.length} className="px-4 py-2 uppercase">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                        <span>{row.groupTitle}</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                                  {tableColumns.map((col) => (
                                    <td key={col.id} className="px-3.5 py-2 border-r border-slate-200 last:border-r-0 text-xs text-slate-700">
                                      {col.type === 'dropdown' ? (
                                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                                          {row.cells[col.id] || col.options?.[0] || 'Pass'}
                                        </span>
                                      ) : (
                                        <span>{row.cells[col.id] || '-'}</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAddElementModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!elementName.trim()}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white shadow-xs transition cursor-pointer ${
                    elementType === 'final_table_grid'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {editingElementId
                      ? 'Save Table Configuration'
                      : elementType === 'final_table_grid'
                      ? 'Add Final Inspection Grid'
                      : elementType === 'table_grid'
                      ? 'Add Online Inspection Grid'
                      : 'Add Element'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editor Rename Modal */}
      {isEditorRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Rename Current Form</h3>
            <p className="text-xs text-slate-500 mb-3">
              Change the display title for <strong className="text-slate-800">{activeForm.name}</strong>.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const trimmed = editorRenameValue.trim();
              if (trimmed) {
                handleRenameForm(activeForm.id, trimmed);
                setIsEditorRenameModalOpen(false);
              }
            }} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={editorRenameValue}
                onChange={(e) => setEditorRenameValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorRenameModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editor New Form Modal */}
      {isEditorNewFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white">Create New Form</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorNewFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const trimmed = editorNewFormName.trim();
              if (!trimmed) {
                setEditorNewFormError('Please enter form name.');
                return;
              }
              handleCreateNewForm(trimmed, 'full', 'White Series – Switched Socket Outlet', `F 17/3-2.${forms.length + 1}`);
              setIsEditorNewFormModalOpen(false);
            }} className="p-6 space-y-4">
              {editorNewFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {editorNewFormError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Form Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={editorNewFormName}
                  onChange={(e) => {
                    setEditorNewFormName(e.target.value);
                    setEditorNewFormError('');
                  }}
                  placeholder="e.g. Testing_2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorNewFormModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deploy to Specification / Inspection Portal Destination Modal */}
      {showDeployModal && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center min-h-screen py-4 sm:py-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeployModal(false);
          }}
        >
          <div 
            className="w-full max-w-xl max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onWheel={(e) => {
              // Smooth mouse wheel scrolling support anywhere over the modal
              const scrollEl = document.getElementById('deploy-modal-scroll-body');
              if (scrollEl && e.target !== scrollEl && !scrollEl.contains(e.target as Node)) {
                scrollEl.scrollTop += e.deltaY;
              }
            }}
          >
            {/* Header (Sticky at top) */}
            <div className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Save className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">Deploy Form to Inspection Portal</h3>
                  <p className="text-[11px] sm:text-xs text-blue-200">Select destination inside Main &amp; Child inspection for Make New Inspection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeployModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white cursor-pointer transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form - 100% visible and fully scrollable with mouse wheel */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmDeployToPortal();
              }} 
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div 
                id="deploy-modal-scroll-body"
                className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 pr-3.5 overscroll-contain"
                style={{ maxHeight: 'calc(92vh - 125px)' }}
              >
                
                {/* Form Title */}
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 block mb-1">
                    Inspection Form Name / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={deployFormName}
                    onChange={(e) => setDeployFormName(e.target.value)}
                    placeholder="e.g. Testing_1 - Online & Final Inspection Report"
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                {/* Step 1: Destination Inside Main Inspection */}
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 block mb-1">
                    1. Destination Inside Main Inspection
                  </label>
                  <select
                    value={deployMainId}
                    onChange={(e) => {
                      const newMain = e.target.value;
                      setDeployMainId(newMain);
                      const children = getChildCards(newMain);
                      if (children.length > 0) {
                        setDeployChildId(children[0].id);
                      } else {
                        setDeployChildId('');
                      }
                    }}
                    className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    {getMainCards().map(mc => (
                      <option key={mc.id} value={mc.id}>
                        {mc.name} ({mc.tag || 'Standard'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Destination Child Category */}
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 block mb-1">
                    2. Destination Child Inspection Category
                  </label>
                  {getChildCards(deployMainId).length === 0 ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                      No child categories configured under this main inspection yet.
                    </div>
                  ) : (
                    <select
                      value={deployChildId}
                      onChange={(e) => setDeployChildId(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                    >
                      {getChildCards(deployMainId).map(cc => (
                        <option key={cc.id} value={cc.id}>
                          {cc.name} {cc.tag ? `• ${cc.tag}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Step 3: Product Type in Form Header */}
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] sm:text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>3. Product Type (Saves to Form Header &amp; Deployed Category)</span>
                    </label>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase">
                      Header Field
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-blue-800 leading-relaxed">
                    Saved directly as <strong>Product Type</strong> in the form header. When inspectors click <strong>Make New Inspection</strong>, the form will be listed under this product type.
                  </p>
                  <input
                    type="text"
                    required
                    value={deployProductType}
                    onChange={(e) => setDeployProductType(e.target.value)}
                    placeholder="e.g. White Series – Switched Socket Outlet"
                    className="w-full px-3 py-1.5 sm:py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Deployment Destination Summary Box */}
                <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Deployment Target</span>
                    <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                      {getMainCards().find(m => m.id === deployMainId)?.name} → {getChildCards(deployMainId).find(c => c.id === deployChildId)?.name || 'Category'} → Make New Inspection
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                    {sections.length} Sections
                  </span>
                </div>

              </div>

              {/* Action Buttons (Always Visible at Bottom, Sticky Footer) */}
              <div className="px-5 sm:px-6 py-3 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2 transition-all hover:shadow-lg"
                  id="btn-confirm-deploy-portal"
                >
                  <Save className="w-4 h-4 text-emerald-300" />
                  <span>Confirm &amp; Deploy Form</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12-Hour Round Clock Time Picker Modal for Studio */}
      {studioClockPicker && studioClockPicker.isOpen && (
        <RoundClockTimePickerModal
          isOpen={studioClockPicker.isOpen}
          title={`Set Time for ${studioClockPicker.headerTitle || 'Interval'}`}
          initialValue={studioClockPicker.initialValue || ''}
          onClose={() => setStudioClockPicker(null)}
          onSelectTime={(newTime) => {
            studioClockPicker.onApply(newTime);
            setStudioClockPicker(null);
          }}
        />
      )}

    </div>
  );
};
