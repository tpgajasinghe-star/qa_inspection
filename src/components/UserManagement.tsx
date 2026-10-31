import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserPlus, 
  Plus,
  ShieldCheck, 
  UserCheck, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Shield, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  RefreshCw,
  Crown,
  KeyRound,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { UserProfile, ProfileRole } from '../types';
import { 
  seedSuperAdmin, 
  fetchProfiles, 
  createUser,
  createProfileUser, 
  updateProfileUser, 
  deleteProfileUser 
} from '../backend/adminUserService';

interface UserManagementProps {
  onBack: () => void;
  currentUserRole?: ProfileRole;
}

export const UserManagement: React.FC<UserManagementProps> = ({ 
  onBack, 
  currentUserRole: propRole 
}) => {
  // Current logged in user's profile role (SUPER_ADMIN or ADMIN)
  const [currentUserRole, setCurrentUserRole] = useState<ProfileRole>(() => {
    if (propRole) return propRole;
    const sessionRole = sessionStorage.getItem('qc_auth_profile_role') as ProfileRole | null;
    if (sessionRole === 'SUPER_ADMIN' || sessionRole === 'ADMIN' || sessionRole === 'USER') {
      return sessionRole;
    }
    return 'SUPER_ADMIN'; // Default to SUPER_ADMIN if unspecified
  });

  // State: profiles from Supabase / adminUserService
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seedingState, setSeedingState] = useState<{
    running: boolean;
    done: boolean;
    message: string;
  }>({
    running: false,
    done: false,
    message: '',
  });

  // Navigation within User Management: 'cards' | 'create-user' | 'view-all-users'
  const [activeView, setActiveView] = useState<'cards' | 'create-user' | 'view-all-users'>('cards');

  // Create Form State
  const [createRoleType, setCreateRoleType] = useState<'ADMIN' | 'USER'>('USER');
  const [createFullName, setCreateFullName] = useState('');
  const [createEmployeeId, setCreateEmployeeId] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View All Users Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'USER'>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Modals State
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // 1. Initial Load & Super Admin Seeding Check
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      setLoading(true);
      setSeedingState({ running: true, done: false, message: 'Verifying Super Admin auth...' });

      try {
        // Run Super Admin seeding utility
        const seedResult = await seedSuperAdmin();
        if (isMounted) {
          setSeedingState({
            running: false,
            done: true,
            message: seedResult.message,
          });
        }

        // Fetch profiles with strict RBAC
        const data = await fetchProfiles(currentUserRole);
        if (isMounted) {
          setProfiles(data);
        }
      } catch (error: any) {
        console.error('[UserManagement:initialize] Error loading profiles:', error);
        toast.error(error.message || 'Database connection failed or quota exceeded');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [currentUserRole]);

  // Refresh profile list
  const reloadProfiles = async () => {
    setLoading(true);
    try {
      const data = await fetchProfiles(currentUserRole);
      setProfiles(data);
    } catch (error: any) {
      console.error('[UserManagement:reloadProfiles] Error refreshing profiles:', error);
      toast.error(error.message || 'Database connection failed or quota exceeded');
    } finally {
      setLoading(false);
    }
  };

  // Open Create View
  const handleOpenCreateView = () => {
    // Strict RBAC: If ADMIN, hardcode creation role to USER
    if (currentUserRole === 'ADMIN') {
      setCreateRoleType('USER');
    } else {
      setCreateRoleType('USER');
    }
    setCreateFullName('');
    setCreateEmployeeId('');
    setCreatePassword('');
    setShowCreatePassword(false);
    setActiveView('create-user');
  };

  // Update role in form
  const handleSelectRoleInCreate = (newRole: 'ADMIN' | 'USER') => {
    // If logged in as ADMIN, block selecting ADMIN
    if (currentUserRole === 'ADMIN') return;
    setCreateRoleType(newRole);
  };

  // Generate strong password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreatePassword(pwd);
    setShowCreatePassword(true);
    toast.success('Auto-generated secure password!');
  };

  // Submit Create User
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFullName.trim()) {
      toast.error('Please enter the user full name');
      return;
    }
    if (!createEmployeeId.trim()) {
      toast.error('Please enter Employee ID');
      return;
    }
    if (!createPassword.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsSubmitting(true);
    try {
      // Strict RBAC: If ADMIN, hardcode role to USER
      const targetRole = currentUserRole === 'ADMIN' ? 'USER' : createRoleType;

      const newRecord = await createUser(
        {
          employee_id: createEmployeeId.trim(),
          full_name: createFullName.trim(),
          role: targetRole,
          password: createPassword.trim(),
        },
        currentUserRole
      );

      await reloadProfiles();
      toast.success('User successfully created!');
      setActiveView('view-all-users');
    } catch (error: any) {
      console.error('[UserManagement:createUser] Error caught:', error);
      toast.error(error.message || 'Database connection failed or quota exceeded');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Password in Table Row
  const toggleRowPassword = (id: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Submit Edit User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.full_name.trim() || !editingUser.employee_id.trim()) {
      toast.error('Full name and Employee ID cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileUser(
        editingUser.id,
        {
          employee_id: editingUser.employee_id,
          full_name: editingUser.full_name,
          role: editingUser.role,
          password: editPassword.trim() || undefined,
        },
        currentUserRole
      );

      await reloadProfiles();
      toast.success('User successfully updated!');
      setEditingUser(null);
      setEditPassword('');
    } catch (error: any) {
      console.error('[UserManagement:updateUser] Error caught:', error);
      toast.error(error.message || 'Database connection failed or quota exceeded');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      await deleteProfileUser(deletingUser.id, currentUserRole);
      await reloadProfiles();
      toast.success('User successfully deleted!');
      setDeletingUser(null);
    } catch (error: any) {
      console.error('[UserManagement:deleteUser] Error caught:', error);
      toast.error(error.message || 'Database connection failed or quota exceeded');
    } finally {
      setIsSubmitting(false);
    }
  };

  // RBAC permissions checker
  const canEditUser = (target: UserProfile) => {
    if (currentUserRole === 'SUPER_ADMIN') return true;
    if (currentUserRole === 'ADMIN') {
      // ADMIN cannot edit SUPER_ADMIN or other ADMIN accounts
      return target.role === 'USER';
    }
    return false;
  };

  const canDeleteUser = (target: UserProfile) => {
    // Root SUPER_ADMIN cannot be deleted by anyone
    if (target.role === 'SUPER_ADMIN' || target.employee_id.toLowerCase() === 'admin') {
      return false;
    }
    if (currentUserRole === 'SUPER_ADMIN') return true;
    if (currentUserRole === 'ADMIN') {
      // ADMIN cannot delete ADMIN or SUPER_ADMIN
      return target.role === 'USER';
    }
    return false;
  };

  // Operational profiles only (excludes internal Super Admin developer account from table)
  const visibleProfiles = profiles.filter(
    p => p.role !== 'SUPER_ADMIN' && (p.employee_id || '').toLowerCase() !== 'admin'
  );

  const adminCount = visibleProfiles.filter(p => p.role === 'ADMIN').length;
  const userCount = visibleProfiles.filter(p => p.role === 'USER').length;

  // Filtered profiles for data table
  const filteredProfiles = visibleProfiles.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.full_name.toLowerCase().includes(q) ||
      p.employee_id.toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (roleFilter !== 'all') {
      return p.role === roleFilter;
    }
    return true;
  });

  return (
    <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-4 sm:py-6 z-10 max-w-6xl mx-auto my-auto animate-in fade-in duration-300">

      {/* Top RBAC Role Indicator Bar & Testing Switcher */}
      <div className="w-full max-w-3xl mb-4 bg-white/80 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Active Auth Role:
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border shadow-2xs ${
            currentUserRole === 'SUPER_ADMIN'
              ? 'bg-purple-100 text-purple-800 border-purple-300'
              : currentUserRole === 'ADMIN'
              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
              : 'bg-blue-100 text-blue-800 border-blue-300'
          }`}>
            {currentUserRole === 'SUPER_ADMIN' ? (
              <Crown className="w-3.5 h-3.5 text-purple-700 stroke-[2.5]" />
            ) : currentUserRole === 'ADMIN' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-700 stroke-[2.2]" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-blue-700 stroke-[2.2]" />
            )}
            <span>{currentUserRole}</span>
          </span>
          {currentUserRole === 'ADMIN' && (
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Restricted to managing USER accounts only)
            </span>
          )}
        </div>

        {/* Quick RBAC Switcher for testing between SUPER_ADMIN and ADMIN */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Test Role:</span>
          <button
            type="button"
            onClick={() => {
              setCurrentUserRole('SUPER_ADMIN');
              sessionStorage.setItem('qc_auth_profile_role', 'SUPER_ADMIN');
              toast.success('Switched testing role to SUPER_ADMIN');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
              currentUserRole === 'SUPER_ADMIN'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            SUPER_ADMIN
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentUserRole('ADMIN');
              sessionStorage.setItem('qc_auth_profile_role', 'ADMIN');
              toast.success('Switched testing role to ADMIN (USER-only scope)');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
              currentUserRole === 'ADMIN'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ADMIN
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: THE TWO MAIN OPERATION CARDS                                      */}
      {/* 1. Create User Card                                                       */}
      {/* 2. View All Users Card                                                    */}
      {/* ========================================================================= */}
      {activeView === 'cards' && (
        <div className="w-full flex-1 flex flex-col items-center justify-between my-auto">
          {/* Section Header */}
          <div className="w-full text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-3 ring-blue-100 mb-3">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto mt-1">
              Workforce Accounts Management &amp; Access Controls
            </p>
          </div>

          {/* THE 2 CARDS */}
          <div className="w-full max-w-3xl mx-auto my-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-8">
            
            {/* CARD 1: CREATE USER */}
            <div
              onClick={handleOpenCreateView}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenCreateView();
                }
              }}
              className="portal-glass-card rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer select-none border border-slate-200/90 hover:border-blue-500 bg-white/95 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              id="card-user-mgmt-create"
            >
              <div className="flex flex-col items-center w-full py-2">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs group-hover:shadow-blue-500/25">
                    <UserPlus className="w-8 h-8 stroke-[1.9]" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-2xs group-hover:scale-110 transition-transform" />
                </div>

                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 mb-1">
                  ACCOUNT PROVISIONING
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                  Create User
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-2 max-w-xs">
                  {currentUserRole === 'SUPER_ADMIN' ? (
                    <>Register a new <strong>Admin</strong> or <strong>User</strong> with Full Name, Employee ID, and secure password.</>
                  ) : (
                    <>Register a new <strong>User (Inspector)</strong> profile with Full Name, Employee ID, and secure password.</>
                  )}
                </p>
                {currentUserRole === 'ADMIN' && (
                  <div className="mt-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Role locked to USER for Admins
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateView();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
                  id="btn-card-create-user"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create User</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 ml-1" />
                </button>
              </div>
            </div>

            {/* CARD 2: VIEW ALL USERS */}
            <div
              onClick={() => setActiveView('view-all-users')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveView('view-all-users');
                }
              }}
              className="portal-glass-card rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer select-none border border-slate-200/90 hover:border-indigo-500 bg-white/95 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
              id="card-user-mgmt-view-all"
            >
              <div className="flex flex-col items-center w-full py-2">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs group-hover:shadow-indigo-500/25">
                    <Users className="w-8 h-8 stroke-[1.9]" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full shadow-2xs group-hover:scale-110 transition-transform" />
                </div>

                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-1">
                  WORKFORCE DIRECTORY
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                  View All Users
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-2 max-w-xs">
                  {currentUserRole === 'SUPER_ADMIN' ? (
                    <>Review and manage all registered workforce accounts across <strong>Admin</strong> and <strong>User</strong> roles.</>
                  ) : (
                    <>Review and manage all registered <strong>User (Inspector)</strong> profiles in the directory.</>
                  )}
                </p>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>{visibleProfiles.length} Users Registered</span>
                  </span>
                </div>
              </div>

              <div className="w-full mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveView('view-all-users');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm shadow-indigo-500/25 flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
                  id="btn-card-view-all-users"
                >
                  <Eye className="w-4 h-4" />
                  <span>View All Users</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 ml-1" />
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Back Button to QA Admin Dashboard */}
          <div className="w-full flex justify-center pt-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-xs sm:text-sm shadow-sm border border-slate-200/80 backdrop-blur-md transition-all cursor-pointer group hover:shadow-md"
              id="btn-back-to-admin-dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to QA Admin Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CREATE USER FORM                                                  */}
      {/* Strict RBAC:                                                              */}
      {/* - SUPER_ADMIN can select ADMIN or USER                                    */}
      {/* - ADMIN: Role dropdown is hidden and hardcoded to USER                    */}
      {/* ========================================================================= */}
      {activeView === 'create-user' && (
        <div className="w-full max-w-2xl mx-auto my-auto animate-in fade-in duration-300">
          
          <div className="w-full flex items-center justify-between mb-5 pb-3 border-b border-slate-200/70">
            <button
              type="button"
              onClick={() => setActiveView('cards')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to User Cards</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView('view-all-users')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                View All Users ({profiles.length}) &rarr;
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
            <div className="p-6 sm:p-7 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
                  <UserPlus className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Create New User Profile
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100 font-medium mt-0.5">
                    {currentUserRole === 'SUPER_ADMIN' 
                      ? 'Select profile role (ADMIN / USER), enter details, and set password'
                      : 'Create a new standard USER account (Inspector workspace)'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* STEP 1: ROLE SELECTION (STRICT RBAC) */}
              {currentUserRole === 'SUPER_ADMIN' ? (
                <div>
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2.5">
                    1. Select Profile Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option: ADMIN */}
                    <div
                      onClick={() => handleSelectRoleInCreate('ADMIN')}
                      role="button"
                      tabIndex={0}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        createRoleType === 'ADMIN'
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          createRoleType === 'ADMIN' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <ShieldCheck className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-extrabold text-slate-900 block">ADMIN</span>
                          <span className="text-[11px] text-slate-500 font-medium">Admin Panel &amp; Specs Management</span>
                        </div>
                      </div>
                      {createRoleType === 'ADMIN' && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Option: USER */}
                    <div
                      onClick={() => handleSelectRoleInCreate('USER')}
                      role="button"
                      tabIndex={0}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        createRoleType === 'USER'
                          ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          createRoleType === 'USER' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <UserCheck className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-extrabold text-slate-900 block">USER</span>
                          <span className="text-[11px] text-slate-500 font-medium">Standard QA Inspector / Operator</span>
                        </div>
                      </div>
                      {createRoleType === 'USER' && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* FOR ADMIN: ROLE DROPDOWN IS HIDDEN & HARDCODED TO USER */
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Assigned Profile Role
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        USER (Quality Inspector)
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    Hardcoded by RBAC Policy
                  </span>
                </div>
              )}

              {/* STEP 2: USER FULL NAME */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                  2. User Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                  id="input-create-fullname"
                />
              </div>

              {/* STEP 3: EMPLOYEE ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    3. Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Email will be: [employee_id]@abc.com
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={createEmployeeId}
                  onChange={(e) => setCreateEmployeeId(e.target.value.toUpperCase())}
                  placeholder={createRoleType === 'ADMIN' && currentUserRole === 'SUPER_ADMIN' ? 'AD-1005' : 'QA-8945'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                  id="input-create-employee-id"
                />
              </div>

              {/* STEP 4: PASSWORD WITH MANDATORY SHOW/HIDE ICON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    4. Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-300 bg-white text-sm font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                    id="input-create-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
                    title={showCreatePassword ? 'Hide password' : 'Show password'}
                    id="btn-toggle-create-password"
                  >
                    {showCreatePassword ? (
                      <EyeOff className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('cards')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-75"
                  id="btn-save-created-user"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save &amp; Create Profile</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: VIEW ALL USERS TABLE (STRICT RBAC)                                */}
      {/* - Table hides restricted actions based on logged-in user role             */}
      {/* ========================================================================= */}
      {activeView === 'view-all-users' && (
        <div className="w-full max-w-6xl mx-auto my-auto animate-in fade-in duration-300">
          
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200/70">
            <button
              type="button"
              onClick={() => setActiveView('cards')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              id="btn-back-to-cards"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to User Management Cards</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reloadProfiles}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                title="Refresh from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateView}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                id="btn-add-another-user"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create New User</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="portal-glass-card rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-white/90">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, employee ID, or email..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({visibleProfiles.length})
              </button>
              {currentUserRole === 'SUPER_ADMIN' && (
                <button
                  type="button"
                  onClick={() => setRoleFilter('ADMIN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    roleFilter === 'ADMIN'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Admins ({adminCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setRoleFilter('USER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'USER'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Users ({userCount})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="portal-glass-card rounded-3xl overflow-hidden shadow-sm border border-white/90 mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Role / Type</th>
                    <th className="py-3.5 px-4">User Full Name</th>
                    <th className="py-3.5 px-4">Employee ID</th>
                    <th className="py-3.5 px-4">Password</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-4 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">Loading user profiles from Supabase...</p>
                      </td>
                    </tr>
                  ) : filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-4 text-center text-slate-400">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">
                          {searchQuery ? `No users found matching "${searchQuery}"` : 'No user profiles registered in database yet.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenCreateView}
                          className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                        >
                          + Create User Now
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((user) => {
                      const isAdmin = user.role === 'ADMIN';
                      const isPwdRevealed = Boolean(revealedPasswords[user.id]);
                      const pwd = user.password || '••••••••';
                      const allowEdit = canEditUser(user);
                      const allowDelete = canDeleteUser(user);

                      return (
                        <tr key={user.id} className="hover:bg-blue-50/30 transition">
                          
                          {/* Role Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border shadow-2xs ${
                              isAdmin
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {isAdmin ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 stroke-[2.2]" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5 text-blue-600 stroke-[2.2]" />
                              )}
                              <span>{isAdmin ? 'ADMIN' : 'USER'}</span>
                            </span>
                          </td>

                          {/* Full Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                            <div>{user.full_name}</div>
                            <div className="text-[11px] font-normal text-slate-400">
                              {user.email || `${user.employee_id.toLowerCase()}@abc.com`}
                            </div>
                          </td>

                          {/* Employee ID */}
                          <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs ${
                              isAdmin 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {user.employee_id}
                            </span>
                          </td>

                          {/* Password with Eye Toggle Icon */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80">
                              <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                                {isPwdRevealed ? pwd : '••••••••'}
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => toggleRowPassword(user.id)}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                                title={isPwdRevealed ? 'Hide password' : 'Show password'}
                                id={`btn-toggle-pwd-${user.id}`}
                              >
                                {isPwdRevealed ? (
                                  <EyeOff className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Eye className="w-4 h-4 text-slate-500" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Action Buttons: View, Edit, Delete (Strict RBAC hidden/shown) */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setViewingUser(user)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition cursor-pointer"
                                title={`View ${user.full_name}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit User: HIDDEN if user is not authorized */}
                              {allowEdit ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUser({ ...user });
                                    setEditPassword(user.password || '');
                                    setShowEditPassword(false);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition cursor-pointer"
                                  title={`Edit ${user.full_name}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              ) : (
                                <span 
                                  className="p-1.5 text-slate-300 cursor-not-allowed" 
                                  title="Editing restricted by RBAC policy"
                                >
                                  <Lock className="w-4 h-4" />
                                </span>
                              )}

                              {/* Delete User: HIDDEN if restricted or Super Admin */}
                              {allowDelete ? (
                                <button
                                  type="button"
                                  onClick={() => setDeletingUser(user)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                                  title={`Delete ${user.full_name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span 
                                  className="p-1.5 text-slate-300 cursor-not-allowed" 
                                  title="Deletion restricted by RBAC policy"
                                >
                                  <Shield className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Back Button */}
          <div className="w-full flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setActiveView('cards')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-xs sm:text-sm shadow-sm border border-slate-200/80 backdrop-blur-md transition-all cursor-pointer group hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to User Management Cards</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW USER PROFILE                                                */}
      {/* ========================================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm ${
                  viewingUser.role === 'SUPER_ADMIN' ? 'bg-purple-600' : viewingUser.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-blue-600'
                }`}>
                  {viewingUser.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{viewingUser.full_name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    viewingUser.role === 'SUPER_ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : viewingUser.role === 'ADMIN'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {viewingUser.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Employee ID</span>
                <span className="font-mono font-bold text-slate-900">{viewingUser.employee_id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Auth Email</span>
                <span className="font-mono text-slate-800">{viewingUser.email || `${viewingUser.employee_id.toLowerCase()}@abc.com`}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Profile UUID</span>
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">{viewingUser.id}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Password</span>
                <span className="font-mono font-bold text-blue-700">{viewingUser.password || '••••••••'}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER (STRICT RBAC)                                          */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit User Profile</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.employee_id}
                  onChange={(e) => setEditingUser({ ...editingUser, employee_id: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Role selector: ONLY visible to SUPER_ADMIN */}
              {currentUserRole === 'SUPER_ADMIN' ? (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as ProfileRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="USER">USER</option>
                  </select>
                </div>
              ) : (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Role</span>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                    USER (Locked)
                  </div>
                </div>
              )}

              {/* Password update */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Update Password (Optional)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete User Profile?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to delete <strong>{deletingUser.full_name}</strong> ({deletingUser.employee_id})? This will remove their profile and Supabase Auth credentials.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
