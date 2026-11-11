import { 
  DocumentHeaderData, 
  SectionBlockSchema, 
  FormFooterData,
  DEFAULT_FORM_FOOTER,
  REFERENCE_SECTION_1_ELEMENTS,
  REFERENCE_SECTION_1_SAVED_DATA,
  TESTING_1_SECTION_1_ELEMENTS,
  TESTING_1_SECTION_1_SAVED_DATA,
  REFERENCE_SECTION_2_ONLINE_ELEMENTS,
  REFERENCE_SECTION_3_FINAL_ELEMENTS,
  IMD_FORM_INITIAL,
  INCOMING_TERMINAL_FORM_INITIAL
} from './components/FormEditorStudio';
import { syncDeployedFormsToCloud } from './services/formsSyncService';

export interface DeployedInspectionForm {
  id: string;
  sourceFormId: string;
  name: string;
  targetMainCardId: string; // e.g. 'main-incoming', 'main-inprocess', 'main-subcontracting'
  targetMainCardName: string;
  targetChildCardId: string; // e.g. 'child-white-series', 'child-led', 'child-raw-material'
  targetChildCardName: string;
  productType: string; // Saved as Product Type in the form header
  documentHeader: DocumentHeaderData;
  sections: SectionBlockSchema[];
  footer?: FormFooterData;
  deployedAt: string;
  deployedBy?: string;
  status: 'Active' | 'Under Review' | 'Draft' | 'Superseded';
  version: string;
  revisionNumber?: number; // Numeric revision counter (e.g. 1, 2, 3...)
  previousRevisionId?: string; // Links to prior superseded revision ID
  notes?: string;
}

export const DEPLOYED_FORMS_SCHEMA_VERSION = 'v6_2026_11_11_revisions_calibrated';
export const LOCAL_STORAGE_DEPLOYED_FORMS_KEY = 'qc_deployed_inspection_forms_v2';
export const LOCAL_STORAGE_DEPLOYED_VERSION_KEY = 'qc_deployed_forms_schema_ver';
export const DEPLOYED_FORMS_UPDATED_EVENT = 'inspection_deployed_forms_updated';

export const INITIAL_DEFAULT_DEPLOYED_FORMS: DeployedInspectionForm[] = [
  {
    id: 'deployed-white-series-testing-1',
    sourceFormId: 'form-testing-1',
    name: 'Testing_1 - Online & Final Inspection Report',
    targetMainCardId: 'main-inprocess',
    targetMainCardName: 'Online / In-Process',
    targetChildCardId: 'child-white-series',
    targetChildCardName: 'White Series',
    productType: 'White Series – Switched Socket Outlet',
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
        title: 'INSPECTION LOG',
        elements: TESTING_1_SECTION_1_ELEMENTS,
        isSaved: true,
        savedData: TESTING_1_SECTION_1_SAVED_DATA,
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
    footer: {
      ...DEFAULT_FORM_FOOTER,
      onlineInspectorName: '',
      onlineEmpNo: '',
      finalInspectorName: '',
      finalEmpNo: '',
    },
    deployedAt: '2026-10-12 10:15 AM',
    deployedBy: 'QC Lead Engineer',
    status: 'Active',
    version: 'Rev 04',
    revisionNumber: 4,
    notes: 'Calibrated factory standard form for White Series Switched Socket Outlets with manual Voltage Drop text field & dropdown checkpoints.',
  },
  {
    id: 'deployed-led-optics-1',
    sourceFormId: 'form-led-incoming',
    name: 'LED SMD Chipset & Flux Acceptance Form',
    targetMainCardId: 'main-incoming',
    targetMainCardName: 'Incoming Inspection',
    targetChildCardId: 'child-led',
    targetChildCardName: 'LED',
    productType: 'Optoelectronics – High Luminous Flux SMD LEDs',
    documentHeader: {
      documentNo: 'F 12/2-1.0',
      dateOfIssue: '2025-11-18',
      revisionNo: '02',
      documentType: 'Incoming Optoelectronics Inspection',
      productType: 'Optoelectronics – High Luminous Flux SMD LEDs',
      refStandard: 'IEC 62031 / LM-80',
    },
    sections: [
      {
        id: 'section-led-1',
        sectionNumber: 1,
        title: '1. ITEM & SUPPLIER BATCH TRACEABILITY',
        elements: REFERENCE_SECTION_1_ELEMENTS,
        isSaved: true,
        savedData: {
          'el-date': '',
          'el-item-code': '',
          'el-desc': '',
          'el-batch': '',
        },
      },
      {
        id: 'section-led-2',
        sectionNumber: 2,
        title: '2. PHOTOMETRIC & CHROMATICITY CRITERIA',
        elements: REFERENCE_SECTION_2_ONLINE_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
      {
        id: 'section-led-3',
        sectionNumber: 3,
        title: '3. SAMPLE ELECTRICAL & FORWARD VOLTAGE TEST',
        elements: REFERENCE_SECTION_3_FINAL_ELEMENTS,
        isSaved: true,
        savedData: {},
      },
    ],
    footer: {
      ...DEFAULT_FORM_FOOTER,
      onlineInspectorName: '',
      onlineEmpNo: '',
      finalInspectorName: '',
      finalEmpNo: '',
    },
    deployedAt: '2026-10-11 02:40 PM',
    deployedBy: 'QA Lab Tech',
    status: 'Active',
    version: 'Rev 02',
    revisionNumber: 2,
    notes: 'Incoming acceptance for LED chip reels, chromatic binning and ESD barriers.',
  },
  {
    id: 'deployed-imd-1',
    sourceFormId: 'form-imd',
    name: 'IMD - Online & Quantitative Inspection Report',
    targetMainCardId: 'main-inprocess',
    targetMainCardName: 'Online / In-Process',
    targetChildCardId: 'child-injection',
    targetChildCardName: 'Injection Molding',
    productType: 'In-Mold Decoration (IMD) Series',
    documentHeader: {
      documentNo: 'F 17/3-2.1',
      dateOfIssue: '2024-03-20',
      revisionNo: '04',
      documentType: 'IMD Online & Quantitative Inspection Report',
      productType: 'In-Mold Decoration (IMD) Series',
      refStandard: 'SLS 734',
    },
    sections: IMD_FORM_INITIAL.sections,
    footer: {
      ...DEFAULT_FORM_FOOTER,
      onlineInspectorName: '',
      onlineEmpNo: '',
      finalInspectorName: '',
      finalEmpNo: '',
    },
    deployedAt: '2026-11-06 10:00 AM',
    deployedBy: 'QC Lead Engineer',
    status: 'Active',
    version: 'Rev 04',
    revisionNumber: 4,
    notes: 'Calibrated factory standard form for IMD / Injection Molding with swapped Result/Specification columns and quantitative metrics.',
  },
  {
    id: 'deployed-incoming-terminal-1',
    sourceFormId: 'form-incoming-10a-terminal',
    name: "Incoming - 10A 'L' Terminal",
    targetMainCardId: 'main-incoming',
    targetMainCardName: 'Incoming Inspection',
    targetChildCardId: 'child-raw-material',
    targetChildCardName: 'Raw Material',
    productType: "10 A, 'L' Terminal",
    documentHeader: INCOMING_TERMINAL_FORM_INITIAL.documentHeader,
    sections: INCOMING_TERMINAL_FORM_INITIAL.sections,
    footer: {
      ...DEFAULT_FORM_FOOTER,
      onlineInspectorName: '',
      onlineEmpNo: '',
      finalInspectorName: '',
      finalEmpNo: '',
    },
    deployedAt: '2026-11-08 09:30 AM',
    deployedBy: 'QC Lead Engineer',
    status: 'Active',
    version: 'Rev 01',
    revisionNumber: 1,
    notes: "Incoming material quality inspection report for 10 A, 'L' Terminal as per Doc F17/1 with Dimensional Inspection (mm) and Master Inspection Characteristics.",
  },
];

export const LOCAL_STORAGE_DELETED_DEPLOYED_FORMS_KEY = 'inspection_deleted_deployed_form_ids';

export function getDeletedDeployedFormIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_DEPLOYED_FORMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function markDeployedFormAsDeleted(formId: string, additionalKeys: string[] = []): void {
  try {
    const current = getDeletedDeployedFormIds();
    const updated = Array.from(new Set([...current, formId, ...additionalKeys]));
    localStorage.setItem(LOCAL_STORAGE_DELETED_DEPLOYED_FORMS_KEY, JSON.stringify(updated));
  } catch {}
}

export function unmarkDeployedFormAsDeleted(formId: string, additionalKeys: string[] = []): void {
  try {
    const current = getDeletedDeployedFormIds();
    const keysToRemove = new Set([formId, ...additionalKeys]);
    const updated = current.filter(id => !keysToRemove.has(id));
    localStorage.setItem(LOCAL_STORAGE_DELETED_DEPLOYED_FORMS_KEY, JSON.stringify(updated));
  } catch {}
}

// Desired order for Inspection Log section elements:
// 1. Date, 2. Item Code, 3. Product Description, 4. Machine No, 5. Raw Material Lot, 6. Raw Material Grade, 7. Batch No
const getFieldRank = (id: string, name: string): number => {
  if (id === 'el-date' || /date/i.test(name)) return 1;
  if (id === 'el-item-code' || /item\s*code/i.test(name)) return 2;
  if (id === 'el-desc' || /product\s*desc|description/i.test(name)) return 3;
  if (id === 'el-mc-no' || /machine/i.test(name)) return 4;
  if (id === 'el-raw-lot' || /raw.*lot/i.test(name)) return 5;
  if (id === 'el-raw-grade' || /raw.*grade/i.test(name)) return 6;
  if (id === 'el-batch' || /batch/i.test(name)) return 7;
  return 99;
};

// Helper to retrieve all deployed forms from localStorage
export function getStoredDeployedForms(): DeployedInspectionForm[] {
  try {
    const deletedIds = new Set(getDeletedDeployedFormIds());
    const raw = localStorage.getItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY);
    const storedVersion = localStorage.getItem(LOCAL_STORAGE_DEPLOYED_VERSION_KEY);
    const isOutdatedVersion = storedVersion !== DEPLOYED_FORMS_SCHEMA_VERSION;
    
    // First-time visit: no raw in storage
    if (!raw) {
      // Seed fresh defaults excluding explicitly deleted ones
      const calibratedDefaults = INITIAL_DEFAULT_DEPLOYED_FORMS.filter(
        f => !deletedIds.has(f.id) && (!f.sourceFormId || !deletedIds.has(f.sourceFormId))
      );
      localStorage.setItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY, JSON.stringify(calibratedDefaults));
      localStorage.setItem(LOCAL_STORAGE_DEPLOYED_VERSION_KEY, DEPLOYED_FORMS_SCHEMA_VERSION);
      return calibratedDefaults;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any explicitly deleted forms
      let validForms = parsed.filter(
        (f: DeployedInspectionForm) => !deletedIds.has(f.id) && (!f.sourceFormId || !deletedIds.has(f.sourceFormId))
      );

      // System updates: only introduce brand-new developmental defaults that were NEVER in the system before and not deleted
      if (isOutdatedVersion) {
        INITIAL_DEFAULT_DEPLOYED_FORMS.forEach(defaultForm => {
          if (!deletedIds.has(defaultForm.id) && (!defaultForm.sourceFormId || !deletedIds.has(defaultForm.sourceFormId))) {
            const exists = validForms.some(f => f.id === defaultForm.id || (f.sourceFormId && f.sourceFormId === defaultForm.sourceFormId));
            if (!exists) {
              validForms.push({ ...defaultForm });
            }
          }
        });
        localStorage.setItem(LOCAL_STORAGE_DEPLOYED_VERSION_KEY, DEPLOYED_FORMS_SCHEMA_VERSION);
      }

      // Sanitize fields on existing active forms
      validForms.forEach((f: DeployedInspectionForm) => {
        if (f.footer) {
          if (f.footer.onlineInspectorName === 'H. P. Karunaratne' || f.footer.onlineInspectorName?.includes('Karunaratne') || f.footer.onlineInspectorName === 'admin') f.footer.onlineInspectorName = '';
          if (f.footer.onlineEmpNo === 'EMP-4102' || f.footer.onlineEmpNo?.includes('4102') || f.footer.onlineEmpNo === 'admin') f.footer.onlineEmpNo = '';
          if (f.footer.finalInspectorName === 'M. Vigneshwaran' || f.footer.finalInspectorName?.includes('Vigneshwaran') || f.footer.finalInspectorName === 'admin') f.footer.finalInspectorName = '';
          if (f.footer.finalEmpNo === 'QC-Lead-09' || f.footer.finalEmpNo?.includes('Lead-09') || f.footer.finalEmpNo === 'admin') f.footer.finalEmpNo = '';
        }
        f.sections?.forEach((sec) => {
          if (sec.title) {
            sec.title = sec.title.replace(/DIGITAL FACTORY\s*/i, '');
          }

          if (Array.isArray(sec.elements) && sec.elements.some(el => el.id === 'el-item-code' || el.id === 'el-batch')) {
            sec.elements.sort((a, b) => getFieldRank(a.id, a.name) - getFieldRank(b.id, b.name));
          }

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
        });

        // Ensure IMD deployed form has target card and documentHeader defaults without overwriting deployed updates
        const isImdForm = f.id === 'deployed-imd-1' || f.sourceFormId === 'form-imd' || /imd/i.test(f.name || '') || /in-mold/i.test(f.productType || '');
        if (isImdForm) {
          f.targetChildCardId = 'child-injection';
          f.targetChildCardName = 'Injection Molding';
          if (!f.productType) f.productType = 'In-Mold Decoration (IMD) Series';
          // Preserve deployed sections! Only initialize from default if sections are missing or empty
          if (!Array.isArray(f.sections) || f.sections.length === 0) {
            f.sections = IMD_FORM_INITIAL.sections;
          }
          if (!f.documentHeader) {
            f.documentHeader = {
              ...IMD_FORM_INITIAL.documentHeader,
              productType: 'In-Mold Decoration (IMD) Series',
            };
          }
        }

        // Ensure Testing_1 and Modular Switch deployed forms have the Cordination radio button element
        const isTesting1 = f.sourceFormId === 'form-testing-1' || f.id === 'deployed-white-series-testing-1' || f.name?.toLowerCase().includes('testing_1') || f.name?.toLowerCase().includes('testing 1');
        const isModular2 = f.sourceFormId === 'form-modular-2' || f.name?.toLowerCase().includes('modular_switch_qa_2') || f.name?.toLowerCase().includes('modular switch');
        if (isTesting1 || isModular2) {
          const sec1 = f.sections?.find(s => s.id === 'section-1' || s.sectionNumber === 1 || /inspection log/i.test(s.title || ''));
          if (sec1) {
            const targetSubItems = isTesting1
              ? [
                  'SSO (13 A)',
                  'SSO - Neon Indicator (13 A) All parts should be correctly assembled.',
                  'SSO - Twin (With / Without neon)',
                ]
              : [
                  'Switch (10 A)',
                  'Switch - Bell press (10 A)',
                  'Switch - Bell push (4 A)',
                  'Switch - Double pole (20 A)',
                ];
            const cordId = isTesting1 ? 'el-cordination-sso' : 'el-cordination-modular';
            const cordEl = {
              id: cordId,
              name: 'Cordination',
              type: 'radio' as const,
              subItems: targetSubItems,
            };
            if (!Array.isArray(sec1.elements)) {
              sec1.elements = isTesting1 ? TESTING_1_SECTION_1_ELEMENTS : REFERENCE_SECTION_1_ELEMENTS;
            } else {
              const existingIdx = sec1.elements.findIndex(el => /cordination/i.test(el.name) || el.id.includes('cordination'));
              if (existingIdx >= 0) {
                sec1.elements[existingIdx] = cordEl;
              } else {
                sec1.elements.push(cordEl);
              }
            }
          }
        }
      });

      // Synchronize back to localStorage
      localStorage.setItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY, JSON.stringify(validForms));
      localStorage.setItem(LOCAL_STORAGE_DEPLOYED_VERSION_KEY, DEPLOYED_FORMS_SCHEMA_VERSION);

      return validForms;
    }
  } catch (err) {
    console.error('Failed to parse deployed forms from localStorage:', err);
  }
  return [];
}

// Helper to save deployed forms to localStorage and broadcast event
export function saveStoredDeployedForms(forms: DeployedInspectionForm[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY, JSON.stringify(forms));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DEPLOYED_FORMS_UPDATED_EVENT, { detail: forms }));
    }
    // Instant Cross-Computer Cloud Sync via Supabase
    syncDeployedFormsToCloud(forms, getDeletedDeployedFormIds());
  } catch (err) {
    console.error('Failed to save deployed forms to localStorage:', err);
  }
}

// Deploy a form: inserts or updates with revision tracking
export function deployInspectionForm(formInput: Omit<DeployedInspectionForm, 'id' | 'deployedAt'>): DeployedInspectionForm {
  const allForms = getStoredDeployedForms();
  const now = new Date();
  const dateFormatted = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  // Find all previous deployed versions for this sourceFormId or form name at the SAME target child card
  const existingRevisions = allForms.filter(
    f => (f.sourceFormId === formInput.sourceFormId || f.name === formInput.name) && 
         f.targetChildCardId === formInput.targetChildCardId
  );

  // Determine next revision number
  let finalRevNumber = 1;
  let finalVersionStr = formInput.version || 'Rev 01';

  // If user set an explicit revision number in documentHeader or version (e.g. "05", "Rev 05")
  let parsedUserRev: number | null = null;
  if (formInput.documentHeader?.revisionNo) {
    const match = formInput.documentHeader.revisionNo.match(/\d+/);
    if (match) parsedUserRev = parseInt(match[0], 10);
  } else if (formInput.version) {
    const match = formInput.version.match(/\d+/);
    if (match) parsedUserRev = parseInt(match[0], 10);
  }

  if (existingRevisions.length > 0) {
    // Find maximum revision number among existing deployed versions
    const maxExistingRev = existingRevisions.reduce((max, rev) => {
      const num = rev.revisionNumber || (rev.version?.match(/\d+/) ? parseInt(rev.version.match(/\d+/)![0], 10) : 1);
      return Math.max(max, num);
    }, 0);

    if (parsedUserRev && parsedUserRev > maxExistingRev) {
      finalRevNumber = parsedUserRev;
    } else {
      finalRevNumber = maxExistingRev + 1;
    }
    finalVersionStr = `Rev ${String(finalRevNumber).padStart(2, '0')}`;
  } else {
    if (parsedUserRev) {
      finalRevNumber = parsedUserRev;
      finalVersionStr = `Rev ${String(finalRevNumber).padStart(2, '0')}`;
    }
  }

  // Ensure documentHeader has updated revision and productType
  const updatedHeader: DocumentHeaderData = {
    ...formInput.documentHeader,
    revisionNo: String(finalRevNumber).padStart(2, '0'),
    productType: formInput.productType,
  };

  // Generate a distinct unique ID for this newly deployed revision
  const newRevisionId = `deployed-${formInput.targetChildCardId}-rev-${finalRevNumber}-${Date.now()}`;

  // Unmark as deleted if it was previously deleted by the user
  unmarkDeployedFormAsDeleted(newRevisionId, [
    formInput.sourceFormId,
    `deleted-source-${formInput.sourceFormId}-${formInput.targetChildCardId}`
  ]);

  const fullDeployedForm: DeployedInspectionForm = {
    ...formInput,
    id: newRevisionId,
    documentHeader: updatedHeader,
    deployedAt: dateFormatted,
    status: 'Active',
    version: finalVersionStr,
    revisionNumber: finalRevNumber,
    previousRevisionId: existingRevisions[0]?.id,
    notes: formInput.notes || `Revision ${finalVersionStr} deployed to ${formInput.targetChildCardName}`,
  };

  // Mark all previous deployed versions for this form at this location as 'Superseded'
  // (Preserving them in storage so admins can inspect or delete them individually)
  const updatedAllForms = allForms.map(f => {
    if (
      (f.sourceFormId === formInput.sourceFormId || f.name === formInput.name) && 
      f.targetChildCardId === formInput.targetChildCardId
    ) {
      return {
        ...f,
        status: 'Superseded' as const,
      };
    }
    return f;
  });

  const updatedList = [fullDeployedForm, ...updatedAllForms];

  saveStoredDeployedForms(updatedList);
  return fullDeployedForm;
}

// Get deployed forms for a specific child card (or matching category)
export function getDeployedFormsForChildCard(childCardId: string, mainCardId?: string): DeployedInspectionForm[] {
  const all = getStoredDeployedForms();
  let matched = all.filter(f => {
    if (f.targetChildCardId === childCardId) return true;
    if (mainCardId && f.targetMainCardId === mainCardId && (!f.targetChildCardId || f.targetChildCardId === 'all')) return true;
    return false;
  });

  // Sort: Active revision first, then revisionNumber descending, then deployedAt descending
  matched.sort((a, b) => {
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (b.status === 'Active' && a.status !== 'Active') return 1;
    const revA = a.revisionNumber || (a.version?.match(/\d+/) ? parseInt(a.version.match(/\d+/)![0], 10) : 0);
    const revB = b.revisionNumber || (b.version?.match(/\d+/) ? parseInt(b.version.match(/\d+/)![0], 10) : 0);
    return revB - revA;
  });

  return matched;
}

// Delete a deployed form from operational location
export function deleteDeployedForm(formId: string): DeployedInspectionForm[] {
  const all = getStoredDeployedForms();
  const formToDelete = all.find(f => f.id === formId);
  const remaining = all.filter(f => f.id !== formId);

  // If the deleted form was 'Active', and there are previous revisions for the same form at the same location,
  // automatically promote the highest remaining previous revision to 'Active'
  if (formToDelete && formToDelete.status === 'Active') {
    const matchingRemaining = remaining
      .filter(
        f => (f.sourceFormId === formToDelete.sourceFormId || f.name === formToDelete.name) &&
             f.targetChildCardId === formToDelete.targetChildCardId
      )
      .sort((a, b) => {
        const revA = a.revisionNumber || (a.version?.match(/\d+/) ? parseInt(a.version.match(/\d+/)![0], 10) : 0);
        const revB = b.revisionNumber || (b.version?.match(/\d+/) ? parseInt(b.version.match(/\d+/)![0], 10) : 0);
        return revB - revA;
      });

    if (matchingRemaining.length > 0) {
      matchingRemaining[0].status = 'Active';
    }
  }

  // Check if any other revisions of this form remain at this location
  const hasOtherRevisions = remaining.some(
    f => (f.sourceFormId === formToDelete?.sourceFormId || f.name === formToDelete?.name) &&
         f.targetChildCardId === formToDelete?.targetChildCardId
  );

  // Permanently record as deleted ONLY if NO revisions remain for this form at this location
  const extraKeys: string[] = [];
  if (!hasOtherRevisions && formToDelete?.sourceFormId) {
    extraKeys.push(formToDelete.sourceFormId);
    extraKeys.push(`deleted-source-${formToDelete.sourceFormId}-${formToDelete.targetChildCardId}`);
  }
  markDeployedFormAsDeleted(formId, extraKeys);

  saveStoredDeployedForms(remaining);
  return remaining;
}
