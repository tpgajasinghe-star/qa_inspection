import { 
  DocumentHeaderData, 
  SectionBlockSchema, 
  FormFooterData,
  DEFAULT_FORM_FOOTER,
  REFERENCE_SECTION_1_ELEMENTS,
  REFERENCE_SECTION_1_SAVED_DATA,
  REFERENCE_SECTION_2_ONLINE_ELEMENTS,
  REFERENCE_SECTION_3_FINAL_ELEMENTS
} from './components/FormEditorStudio';

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
  status: 'Active' | 'Under Review' | 'Draft';
  version: string;
  notes?: string;
}

export const LOCAL_STORAGE_DEPLOYED_FORMS_KEY = 'qc_deployed_inspection_forms_v1';
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
          'el-batch': '',
          'el-desc': '',
          'el-item-code': '',
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
    notes: 'Incoming acceptance for LED chip reels, chromatic binning and ESD barriers.',
  },
];

// Helper to retrieve all deployed forms from localStorage
export function getStoredDeployedForms(): DeployedInspectionForm[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY, JSON.stringify(INITIAL_DEFAULT_DEPLOYED_FORMS));
      return INITIAL_DEFAULT_DEPLOYED_FORMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure inspector name, emp no, item code, batch reference are clean of dummy data
      parsed.forEach((f: DeployedInspectionForm) => {
        if (f.footer) {
          if (f.footer.onlineInspectorName === 'H. P. Karunaratne' || f.footer.onlineInspectorName?.includes('Karunaratne')) f.footer.onlineInspectorName = '';
          if (f.footer.onlineEmpNo === 'EMP-4102' || f.footer.onlineEmpNo?.includes('4102')) f.footer.onlineEmpNo = '';
          if (f.footer.finalInspectorName === 'M. Vigneshwaran' || f.footer.finalInspectorName?.includes('Vigneshwaran')) f.footer.finalInspectorName = '';
          if (f.footer.finalEmpNo === 'QC-Lead-09' || f.footer.finalEmpNo?.includes('Lead-09')) f.footer.finalEmpNo = '';
        }
        f.sections?.forEach((sec) => {
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
      });
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse deployed forms from localStorage:', err);
  }
  return INITIAL_DEFAULT_DEPLOYED_FORMS;
}

// Helper to save deployed forms to localStorage and broadcast event
export function saveStoredDeployedForms(forms: DeployedInspectionForm[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY, JSON.stringify(forms));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DEPLOYED_FORMS_UPDATED_EVENT, { detail: forms }));
    }
  } catch (err) {
    console.error('Failed to save deployed forms to localStorage:', err);
  }
}

// Deploy a form: inserts or updates
export function deployInspectionForm(formInput: Omit<DeployedInspectionForm, 'id' | 'deployedAt'>): DeployedInspectionForm {
  const allForms = getStoredDeployedForms();
  const now = new Date();
  const dateFormatted = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  // Ensure productType is updated in documentHeader
  const updatedHeader: DocumentHeaderData = {
    ...formInput.documentHeader,
    productType: formInput.productType,
  };

  // Check if this source form was already deployed to the same target child card
  const existingIdx = allForms.findIndex(
    f => (f.sourceFormId === formInput.sourceFormId || f.name === formInput.name) && 
         f.targetChildCardId === formInput.targetChildCardId
  );

  const deployedId = existingIdx >= 0 
    ? allForms[existingIdx].id 
    : `deployed-${formInput.targetChildCardId}-${Date.now()}`;

  const fullDeployedForm: DeployedInspectionForm = {
    ...formInput,
    id: deployedId,
    documentHeader: updatedHeader,
    deployedAt: dateFormatted,
  };

  let updatedList: DeployedInspectionForm[];
  if (existingIdx >= 0) {
    updatedList = [...allForms];
    updatedList[existingIdx] = fullDeployedForm;
  } else {
    updatedList = [fullDeployedForm, ...allForms];
  }

  saveStoredDeployedForms(updatedList);
  return fullDeployedForm;
}

// Get deployed forms for a specific child card (or matching category)
export function getDeployedFormsForChildCard(childCardId: string, mainCardId?: string): DeployedInspectionForm[] {
  const all = getStoredDeployedForms();
  return all.filter(f => {
    if (f.targetChildCardId === childCardId) return true;
    if (mainCardId && f.targetMainCardId === mainCardId && (!f.targetChildCardId || f.targetChildCardId === 'all')) return true;
    return false;
  });
}

// Delete a deployed form
export function deleteDeployedForm(formId: string): DeployedInspectionForm[] {
  const all = getStoredDeployedForms();
  const remaining = all.filter(f => f.id !== formId);
  saveStoredDeployedForms(remaining);
  return remaining;
}
