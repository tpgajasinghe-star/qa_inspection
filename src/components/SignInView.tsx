import React, { useState, useEffect } from 'react';
import { Check, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, ClipboardCheck } from 'lucide-react';

interface SignInViewProps {
  initialRole: 'inspector' | 'admin' | 'inspection';
  onSignIn: (role: 'inspector' | 'admin', id: string) => void;
  onBackToSelection: () => void;
}

const normalizeRole = (r?: string): 'inspector' | 'admin' => {
  return r === 'admin' ? 'admin' : 'inspector';
};

export const SignInView: React.FC<SignInViewProps> = ({
  initialRole,
  onSignIn,
  onBackToSelection,
}) => {
  const normalizedInitialRole = normalizeRole(initialRole);
  const [selectedRole, setSelectedRole] = useState<'inspector' | 'admin'>(normalizedInitialRole);
  const [identity, setIdentity] = useState(
    normalizedInitialRole === 'admin' ? 'AD-1004' : 'QA-8941'
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync role and identity whenever initialRole prop changes
  useEffect(() => {
    const role = normalizeRole(initialRole);
    setSelectedRole(role);
    setIdentity(role === 'admin' ? 'AD-1004' : 'QA-8941');
    setPassword('');
    setErrorMessage('');
  }, [initialRole]);

  // Sync identity if user manually switches tabs
  const handleSwitchTab = (role: 'inspector' | 'admin') => {
    setSelectedRole(role);
    setIdentity(role === 'admin' ? 'AD-1004' : 'QA-8941');
    setPassword('');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim()) {
      setErrorMessage('Please enter an Inspector ID or email');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your security password to access this workspace');
      return;
    }
    setErrorMessage('');
    onSignIn(selectedRole, identity.trim());
  };

  const handleQuickFill = (role: 'inspector' | 'admin') => {
    setSelectedRole(role);
    setIdentity(role === 'admin' ? 'AD-1004' : 'QA-8941');
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-10 px-4 z-10">
      {/* Return to workspace button */}
      <div className="w-full max-w-[440px] mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToSelection}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs backdrop-blur-xs transition-all cursor-pointer"
          id="btn-back-to-workspaces"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Workspace</span>
        </button>
        <span className="text-[11px] font-mono text-slate-400">
          Gate ID: SEC-PORTAL-01
        </span>
      </div>

      {/* Central Auth Card Container */}
      <div 
        className="w-full max-w-[440px] bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-9 shadow-2xl border border-slate-100 relative transition-all duration-300"
        id="auth-card"
      >
        {/* Floating QA Badge Icon */}
        <div className="flex justify-center -mt-16 mb-4">
          <div 
            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white ring-4 ring-white transition-all duration-300 ${
              selectedRole === 'inspector'
                ? 'bg-gradient-to-tr from-blue-600 via-sky-500 to-blue-600 shadow-lg shadow-blue-500/35'
                : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 shadow-lg shadow-indigo-500/35'
            }`}
            id="portal-badge"
          >
            <span className="text-base font-bold tracking-wider leading-none">
              {selectedRole === 'admin' ? 'AD' : 'QA'}
            </span>
            <Check className="w-4 h-4 mt-0.5 text-white/90 stroke-[3]" />
          </div>
        </div>

        {/* Selected Role Indicator Chip */}
        <div className="flex justify-center mb-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-colors duration-200 border ${
            selectedRole === 'inspector'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${selectedRole === 'inspector' ? 'bg-blue-600 animate-pulse' : 'bg-indigo-600 animate-pulse'}`} />
            <span>
              {selectedRole === 'inspector' ? 'Inspection Workspace Selected' : 'Admin Panel Workspace Selected'}
            </span>
          </span>
        </div>

        {/* Card Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            QA Inspection Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Sign in to access your {selectedRole === 'admin' ? 'admin' : 'inspection'} workspace
          </p>
        </div>

        {/* Segmented Panel Selection Tabs */}
        <div 
          className="bg-slate-100/90 p-1.5 rounded-2xl flex gap-1.5 mb-6 border border-slate-200/60"
          id="panel-toggle"
        >
          <button
            type="button"
            onClick={() => handleSwitchTab('inspector')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'inspector'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-inspection"
          >
            <ClipboardCheck className={`w-4 h-4 ${selectedRole === 'inspector' ? 'text-white' : 'text-slate-400'}`} />
            <span>Inspection Panel</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('admin')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-admin"
          >
            <ShieldCheck className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-white' : 'text-slate-400'}`} />
            <span>Admin Panel</span>
          </button>
        </div>

        {/* Sign-in Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="form-signin">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Inspector ID / Email Field */}
          <div>
            <label 
              htmlFor="identity"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              {selectedRole === 'admin' ? 'Administrator Badge ID / Email' : 'Inspector Badge ID / Email'}
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="identity"
                name="identity"
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'e.g. AD-1004 or admin@abccompany.com' : 'e.g. QA-8941 or inspector@abccompany.com'}
                required
                className={`block w-full pl-10 pr-4 py-2.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                  selectedRole === 'admin'
                    ? 'focus:ring-indigo-600/20 focus:border-indigo-600'
                    : 'focus:ring-blue-600/20 focus:border-blue-600'
                }`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Security Password
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter security password"
                required
                className={`block w-full pl-10 pr-10 py-2.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                  selectedRole === 'admin'
                    ? 'focus:ring-indigo-600/20 focus:border-indigo-600'
                    : 'focus:ring-blue-600/20 focus:border-blue-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                id="toggle-password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Demo Password Helper Text */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Demo password: <code className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">password123</code></span>
              <button
                type="button"
                onClick={() => {
                  setPassword('password123');
                  setErrorMessage('');
                }}
                className={`font-semibold underline cursor-pointer hover:opacity-80 transition ${
                  selectedRole === 'admin' ? 'text-indigo-600' : 'text-blue-600'
                }`}
                id="btn-quick-fill-pwd"
              >
                Auto-fill
              </button>
            </div>
          </div>

          {/* Utilities: Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1 text-sm">
            <label className="inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`w-4 h-4 rounded focus:ring-2 transition cursor-pointer ${
                  selectedRole === 'admin' ? 'text-indigo-600 border-slate-300 focus:ring-indigo-500' : 'text-blue-600 border-slate-300 focus:ring-blue-500'
                }`}
                id="checkbox-remember"
              />
              <span className="ml-2 text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors select-none">
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={() => alert('Password reset verification link sent to registered enterprise directory email.')}
              className={`text-xs font-semibold hover:underline transition-colors cursor-pointer ${
                selectedRole === 'admin' ? 'text-indigo-600 hover:text-indigo-700' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Forgot password?
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition duration-200 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/30'
              }`}
              id="btn-submit-signin"
            >
              <span>{selectedRole === 'admin' ? 'Sign In as Administrator' : 'Sign In as Inspector'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>

        {/* Quick Demo Pre-fill helpers for instant reviewer testing */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium mb-2 uppercase tracking-wider">
            Quick Sign-In Presets
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('inspector')}
              className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200/60 transition cursor-pointer"
            >
              Inspector: QA-8941
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-2.5 py-1 text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200/60 transition cursor-pointer"
            >
              Admin: AD-1004
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
