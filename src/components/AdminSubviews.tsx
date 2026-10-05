import React, { useState } from 'react';
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
  TrendingUp,
  FileCheck2,
  Lock,
  UserPlus
} from 'lucide-react';
import { SpecificationItem, AdminUser, InspectionRecord, DefectMetric } from '../types';

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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 z-10 space-y-6">
        <div className="portal-glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                QA WORKFORCE DIRECTORY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              User Management & Access Controls
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Provision inspector badges, assign shift audits, and manage RBAC security clearance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('New inspector onboarding workflow initialized. Temporary badge credentials generated.')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision Inspector</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="portal-glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inspectors by Name, Badge ID, or Role..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Active Inspectors Online: <strong className="text-emerald-600">3 of 4</strong>
          </div>
        </div>

        {/* Users Table */}
        <div className="portal-glass-card rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Operator Name & Email</th>
                <th className="py-3.5 px-4">Badge / Inspector ID</th>
                <th className="py-3.5 px-4">Security Role</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Shift Assignment</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-400">{user.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                    {user.badgeId}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{user.department}</td>
                  <td className="py-3.5 px-4 text-slate-600">{user.activeShift}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      user.status === 'Online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : user.status === 'On Line Audit'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Re-calibrating badge credentials for ${user.badgeId}`)}
                      className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
                    >
                      Audit Permissions
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

  // 2. Specification Controls View
  if (activeView === 'admin-specs') {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 z-10 space-y-6">
        <div className="portal-glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                ENGINEERING METROLOGY STANDARDS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Specification & Tolerance Controls
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure CAD nominal dimensions, upper/lower tolerance envelopes, and active revision benchmarks.
            </p>
          </div>

          <button
            onClick={() => alert('Add Specification Modal: Opens CAD revision parameter mapping.')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Spec Benchmark</span>
          </button>
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

  // 3. Inspection Records & Audit Trail View
  if (activeView === 'admin-records') {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 z-10 space-y-6">
        <div className="portal-glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                AUDIT & COMPLIANCE LEDGER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quality Audit Records & Digital Sign-Offs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Cryptographically verified inspection trail for regulatory ISO 9001 and FAA/IATF audits.
            </p>
          </div>

          <button
            onClick={() => alert('Exporting full audit trail ledger in CSV/PDF format...')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Ledger</span>
          </button>
        </div>

        {/* Records Table */}
        <div className="portal-glass-card rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Audit ID & Lot</th>
                <th className="py-3.5 px-4">Module / Area</th>
                <th className="py-3.5 px-4">Component & Deviation</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Inspector Signature</th>
                <th className="py-3.5 px-4">Verification Stamp</th>
                <th className="py-3.5 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-blue-50/30 transition">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="font-bold text-slate-900">{rec.id}</div>
                    <div className="text-slate-400 text-[11px]">{rec.lotNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium uppercase text-[11px] text-slate-600">
                    {rec.module}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{rec.partName}</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      Measured: {rec.measuredValue} {rec.unit} (Nominal: {rec.nominalValue})
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      rec.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'fail'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{rec.inspectorName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{rec.timestamp}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {rec.verifiedBy || 'QA-LEAD-PENDING'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Certificate of Inspection for ${rec.lotNumber}\nStatus: ${rec.status.toUpperCase()}\nInspector: ${rec.inspectorName}\nTimestamp: ${rec.timestamp}`)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      View Certificate
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
          <span className="text-xs font-bold text-slate-600">Period: Current Production Shift</span>
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
