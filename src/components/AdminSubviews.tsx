import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Sliders, 
  FileSpreadsheet, 
  BarChart3, 
  Plus, 
  Search, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  FileCheck2,
  Lock,
  UserPlus
} from 'lucide-react';
import { SpecificationItem, AdminUser, InspectionRecord, DefectMetric } from '../types';
import { UserManagement } from './UserManagement';
import { PastRecordsList } from './PastRecordsList';

interface AdminSubviewsProps {
  activeView: 'admin-specs' | 'admin-records' | 'admin-analytics' | 'admin-users';
  specs: SpecificationItem[];
  users: AdminUser[];
  inspections: InspectionRecord[];
  defectMetrics: DefectMetric[];
  onBackToDashboard: () => void;
}

export const AdminSubviews: React.FC<AdminSubviewsProps> = ({
  activeView,
  specs: initialSpecs,
  users: initialUsers,
  inspections,
  defectMetrics,
  onBackToDashboard,
}) => {
  const navigate = useNavigate();
  const [specs, setSpecs] = useState<SpecificationItem[]>(initialSpecs);
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState('');

  // Filtered lists
  const filteredSpecs = specs.filter(s => 
    s.partName.toLowerCase().includes(search.toLowerCase()) ||
    s.partCode.toLowerCase().includes(search.toLowerCase()) ||
    s.parameter.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.badgeId.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRecords = inspections.filter(r => 
    r.partName.toLowerCase().includes(search.toLowerCase()) ||
    r.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.inspectorName.toLowerCase().includes(search.toLowerCase())
  );

  // 1. User Management View
  if (activeView === 'admin-users') {
    return (
      <UserManagement
        onBack={() => navigate('/admin')}
      />
    );
  }

  // 2. Specification Controls View
  if (activeView === 'admin-specs') {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 z-10 space-y-6">
        <div className="portal-glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                QUALITY MEETS PRECISION • STANDARDS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Specification & Tolerance Controls
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure CAD nominal dimensions, upper/lower tolerance envelopes, and active revision benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Admin</span>
            </button>
            <button
              onClick={() => alert('Add Specification Modal: Opens CAD revision parameter mapping.')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Spec Benchmark</span>
            </button>
          </div>
        </div>

        {/* Specs Table */}
        <div className="portal-glass-card rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Part Code</th>
                <th className="py-3.5 px-4">Component Name</th>
                <th className="py-3.5 px-4">Inspection Parameter</th>
                <th className="py-3.5 px-4">Nominal Target</th>
                <th className="py-3.5 px-4">Allowed Tolerance (±)</th>
                <th className="py-3.5 px-4">Revision</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSpecs.map((spec) => (
                <tr key={spec.id} className="hover:bg-blue-50/30 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{spec.partCode}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{spec.partName}</td>
                  <td className="py-3.5 px-4 text-blue-700 font-medium">{spec.parameter}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {spec.nominal} {spec.unit}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                    ±{spec.tolerance} {spec.unit}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{spec.revision}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {spec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Editing tolerance envelope for ${spec.partCode}`)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Calibrate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. Inspection Records & Audit Trail View (Shared Reusable PastRecordsList)
  if (activeView === 'admin-records') {
    return (
      <PastRecordsList
        isAdmin={true}
        moduleName="Regulatory QA Ledger"
        onBack={() => navigate('/admin')}
      />
    );
  }

  // 4. QA Analytics & Metrics View
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 z-10 space-y-6">
      <div className="portal-glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
              EXECUTIVE QA INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            QA Analytics & Defect Severity Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pareto defect distribution, first-pass yield metrics, and plant scrap reduction trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Admin</span>
          </button>
          <span className="text-xs font-bold text-slate-600 hidden sm:inline">Period: Current Production Shift</span>
        </div>
      </div>

      {/* Analytics KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="portal-glass-card rounded-3xl p-6 border border-white">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            First Pass Yield (FPY)
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
            98.2%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
            <TrendingUp className="w-4 h-4" />
            <span>+0.8% higher than Plant 04 target</span>
          </div>
        </div>

        <div className="portal-glass-card rounded-3xl p-6 border border-white">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Defect Parts Per Million (PPM)
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            142 PPM
          </div>
          <div className="text-xs text-slate-500 mt-2">
            World-class Six Sigma benchmark target: &lt; 200 PPM
          </div>
        </div>

        <div className="portal-glass-card rounded-3xl p-6 border border-white">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Total Scrapped Cost
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 tracking-tight">
            $420.00
          </div>
          <div className="text-xs text-rose-600 font-semibold mt-2">
            2 critical quarantined components today
          </div>
        </div>
      </div>

      {/* Pareto Chart Representation */}
      <div className="portal-glass-card rounded-3xl p-6 border border-white">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Pareto Analysis: Defect Frequency by Failure Mode
        </h3>
        <div className="space-y-4">
          {defectMetrics.map((dm) => (
            <div key={dm.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-800">{dm.category}</span>
                <span className="font-mono text-slate-600">
                  {dm.count} occurrences ({dm.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    dm.severity === 'critical' 
                      ? 'bg-rose-500' 
                      : dm.severity === 'major' 
                      ? 'bg-amber-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${dm.percentage * 2}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
