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
  const [infoMessage, setInfoMessage] = useState('');

  // Sync role and identity whenever initialRole prop changes
  useEffect(() => {
    const role = normalizeRole(initialRole);
    setSelectedRole(role);
    setIdentity(role === 'admin' ? 'AD-1004' : 'QA-8941');
    setPassword('');
    setErrorMessage('');
    setInfoMessage('');
  }, [initialRole]);

  // Sync identity if user manually switches tabs
  const handleSwitchTab = (role: 'inspector' | 'admin') => {
    setSelectedRole(role);
    setIdentity(role === 'admin' ? 'AD-1004' : 'QA-8941');
    setPassword('');
    setErrorMessage('');
    setInfoMessage('');
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
    setInfoMessage('');
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-2 z-10 my-auto">
      {/* Return to workspace button */}
      <div className="w-full max-w-[390px] mb-1.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToSelection}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 bg-white/85 hover:bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs backdrop-blur-xs transition-all cursor-pointer"
          id="btn-back-to-workspaces"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Workspace</span>
        </button>
        <span className="text-[10px] font-mono text-slate-400">
          Gate ID: SEC-PORTAL-01
        </span>
      </div>

      {/* Central Auth Card Container - Fits 100% in viewport without scrolling */}
      <div 
        className="w-full max-w-[390px] bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-100 relative transition-all duration-300"
        id="auth-card"
      >
        {/* Floating QA Badge Icon */}
        <div className="flex justify-center -mt-9 mb-1.5">
          <div 
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white ring-3 ring-white transition-all duration-300 ${
              selectedRole === 'inspector'
                ? 'bg-gradient-to-tr from-blue-600 via-sky-500 to-blue-600 shadow-sm shadow-blue-500/35'
                : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 shadow-sm shadow-indigo-500/35'
            }`}
            id="portal-badge"
          >
            <span className="text-xs font-bold tracking-wider leading-none">
              {selectedRole === 'admin' ? 'AD' : 'QA'}
            </span>
            <Check className="w-3 h-3 mt-0.5 text-white/90 stroke-[3]" />
          </div>
        </div>

        {/* Selected Role Indicator Chip */}
        <div className="flex justify-center mb-1.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-colors duration-200 border ${
            selectedRole === 'inspector'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${selectedRole === 'inspector' ? 'bg-blue-600 animate-pulse' : 'bg-indigo-600 animate-pulse'}`} />
            <span>
              {selectedRole === 'inspector' ? 'Inspection Workspace' : 'Admin Panel Workspace'}
            </span>
          </span>
        </div>

        {/* Card Header */}
        <div className="text-center mb-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-snug">
            QA Inspection Portal
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
            Sign in to access your {selectedRole === 'admin' ? 'admin' : 'inspection'} workspace
          </p>
        </div>

        {/* Segmented Panel Selection Tabs */}
        <div 
          className="bg-slate-100/90 p-0.5 rounded-xl flex gap-1 mb-2.5 border border-slate-200/60"
          id="panel-toggle"
        >
          <button
            type="button"
            onClick={() => handleSwitchTab('inspector')}
            className={`flex-1 py-1 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'inspector'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-inspection"
          >
            <ClipboardCheck className={`w-3.5 h-3.5 ${selectedRole === 'inspector' ? 'text-white' : 'text-slate-400'}`} />
            <span>Inspection Panel</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('admin')}
            className={`flex-1 py-1 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-admin"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${selectedRole === 'admin' ? 'text-white' : 'text-slate-400'}`} />
            <span>Admin Panel</span>
          </button>
        </div>

        {/* Sign-in Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5" id="form-signin">
          {errorMessage && (
            <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}
          {infoMessage && (
            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {infoMessage}
            </div>
          )}

          {/* Inspector ID / Email Field */}
          <div>
            <label 
              htmlFor="identity"
              className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5"
            >
              {selectedRole === 'admin' ? 'Administrator Badge ID / Email' : 'Inspector Badge ID / Email'}
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                id="identity"
                name="identity"
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'AD-1004' : 'QA-8941'}
                required
                className={`block w-full pl-8 pr-3 py-1.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
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
              className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5"
            >
              Security Password
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
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
                placeholder="Enter password"
                required
                className={`block w-full pl-8 pr-8 py-1.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${
                  selectedRole === 'admin'
                    ? 'focus:ring-indigo-600/20 focus:border-indigo-600'
                    : 'focus:ring-blue-600/20 focus:border-blue-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                id="toggle-password"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {/* Demo Password Helper Text */}
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Demo pwd: <code className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded">password123</code></span>
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
          <div className="flex items-center justify-between pt-0.5 text-xs">
            <label className="inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`w-3.5 h-3.5 rounded focus:ring-1 transition cursor-pointer ${
                  selectedRole === 'admin' ? 'text-indigo-600 border-slate-300 focus:ring-indigo-500' : 'text-blue-600 border-slate-300 focus:ring-blue-500'
                }`}
                id="checkbox-remember"
              />
              <span className="ml-1.5 text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors select-none">
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={() => {
                setInfoMessage('Password reset verification link sent to registered email.');
              }}
              className={`text-[11px] font-semibold hover:underline transition-colors cursor-pointer ${
                selectedRole === 'admin' ? 'text-indigo-600 hover:text-indigo-700' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Forgot password?
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="pt-0.5">
            <button
              type="submit"
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow-md transition duration-200 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
              id="btn-submit-signin"
            >
              <span>{selectedRole === 'admin' ? 'Sign In as Administrator' : 'Sign In as Inspector'}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>

        {/* Quick Demo Pre-fill helpers */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
            Quick Sign-In Presets
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('inspector')}
              className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200/60 transition cursor-pointer"
            >
              Inspector: QA-8941
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200/60 transition cursor-pointer"
            >
              Admin: AD-1004
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
