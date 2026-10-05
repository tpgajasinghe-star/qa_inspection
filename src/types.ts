export type WorkspaceMode =
  | 'workspace-selection'
  | 'sign-in'
  | 'inspection-dashboard'
  | 'incoming-inspection'
  | 'in-process-inspection'
  | 'admin-dashboard'
  | 'live-inspection'
  | 'admin-specs'
  | 'admin-records'
  | 'admin-analytics'
  | 'admin-users';

export type InspectionModule = 'incoming' | 'in-process' | 'subcontracting';

export type InProcessCategoryType =
  | 'Automation'
  | 'White Series'
  | 'Modular/Nature'
  | 'LED'
  | 'Injection Molding';

export interface InProcessCategoryItem {
  id: string;
  name: InProcessCategoryType;
  code: string;
  description: string;
  activeLines: number;
  yieldRate: number;
  sampleItems: string[];
  inspectionStandard: string;
  lineStations: string[];
  tag: string;
}

export type IncomingCategoryType =
  | 'Raw Material'
  | 'LED'
  | 'Fan'
  | 'Protection'
  | 'Subcontractor SF'
  | 'Subcontractor FG'
  | 'Packing Items'
  | 'Others';

export interface IncomingCategoryItem {
  id: string;
  name: IncomingCategoryType;
  code: string;
  description: string;
  itemCount: number;
  pendingLots: number;
  passRate: number;
  sampleItems: string[];
  inspectionStandard: string;
  supplierCount: number;
  tag: string;
}

export type QAStatus = 'pass' | 'fail' | 'pending';

export type DefectSeverity = 'none' | 'minor' | 'major' | 'critical';

export interface InspectionRecord {
  id: string;
  lotNumber: string;
  batchId: string;
  partNumber: string;
  partName: string;
  module: InspectionModule;
  supplierOrLine: string;
  nominalValue: number;
  toleranceMin: number;
  toleranceMax: number;
  measuredValue: number;
  unit: string;
  status: QAStatus;
  defectType?: string;
  defectSeverity: DefectSeverity;
  inspectorId: string;
  inspectorName: string;
  timestamp: string;
  notes?: string;
  verifiedBy?: string;
}

export interface SpecificationItem {
  id: string;
  partCode: string;
  partName: string;
  parameter: string;
  nominal: number;
  tolerance: number;
  unit: string;
  revision: string;
  category: 'Mechanical' | 'Electrical' | 'Surface Finish' | 'Thermal';
  status: 'Active' | 'Under Review' | 'Deprecated';
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'QA Lead' | 'Senior Inspector' | 'Line Auditor' | 'System Admin';
  badgeId: string;
  department: string;
  activeShift: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)';
  status: 'Online' | 'On Line Audit' | 'Offline';
}

export interface DefectMetric {
  category: string;
  count: number;
  percentage: number;
  severity: DefectSeverity;
}
