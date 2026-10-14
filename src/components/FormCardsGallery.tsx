import React, { useState } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  FileSpreadsheet, 
  Layers, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  Search, 
  Calendar, 
  Clock, 
  Sparkles, 
  Sliders, 
  FileText, 
  Star,
  CheckCircle2,
  FolderPlus,
  AlertCircle
} from 'lucide-react';
import { DocumentHeaderData, SectionBlockSchema, FormFooterData } from './FormEditorStudio';

export interface InspectionFormCardData {
  id: string;
  name: string;
  isOngoing?: boolean;
  status: 'Draft' | 'Pending' | 'Active' | 'Under Review';
  createdAt: string;
  updatedAt: string;
  documentHeader: DocumentHeaderData;
  sections: SectionBlockSchema[];
  footer?: FormFooterData;
  notes?: string;
  productSeries?: string;
}

interface FormCardsGalleryProps {
  forms: InspectionFormCardData[];
  activeFormId: string | null;
  onSelectForm: (formId: string) => void;
  onCreateNewForm: (name: string, templateType: 'full' | 'online' | 'final' | 'blank', productType: string, docNo: string) => void;
  onDuplicateForm: (formId: string) => void;
  onRenameForm: (formId: string, newName: string) => void;
  onDeleteForm: (formId: string) => void;
  onBackToPortal: () => void;
}

export const FormCardsGallery: React.FC<FormCardsGalleryProps> = ({
  forms,
  activeFormId,
  onSelectForm,
  onCreateNewForm,
  onDuplicateForm,
  onRenameForm,
  onDeleteForm,
  onBackToPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Draft' | 'Active'>('All');
  
  // New Form Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormError, setNewFormError] = useState('');

  // Rename Modal State
  const [renamingForm, setRenamingForm] = useState<InspectionFormCardData | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete Confirm Modal State
  const [deletingForm, setDeletingForm] = useState<InspectionFormCardData | null>(null);

  // Filter forms
  const filteredForms = forms.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      f.name.toLowerCase().includes(q) ||
      (f.documentHeader?.documentNo && f.documentHeader.documentNo.toLowerCase().includes(q)) ||
      (f.documentHeader?.productType && f.documentHeader.productType.toLowerCase().includes(q)) ||
      (f.productSeries && f.productSeries.toLowerCase().includes(q));

    const matchesStatus = 
      statusFilter === 'All' || 
      f.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleOpenNewModal = () => {
    const nextNum = forms.length + 1;
    setNewFormName(`Testing_${nextNum}`);
    setNewFormError('');
    setIsNewModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFormName.trim();
    if (!trimmed) {
      setNewFormError('Please enter a valid form name (e.g. Testing_2).');
      return;
    }
    // Check if name already exists
    if (forms.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewFormError(`A form named "${trimmed}" already exists. Please choose a unique name.`);
      return;
    }
    onCreateNewForm(trimmed, 'full', 'White Series – Switched Socket Outlet', `F 17/3-2.${forms.length + 1}`);
    setIsNewModalOpen(false);
  };

  const handleOpenRename = (form: InspectionFormCardData, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingForm(form);
    setRenameValue(form.name);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingForm) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    onRenameForm(renamingForm.id, trimmed);
    setRenamingForm(null);
  };

  const handleOpenDelete = (form: InspectionFormCardData, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingForm(form);
  };

  const handleConfirmDelete = () => {
    if (!deletingForm) return;
    onDeleteForm(deletingForm.id);
    setDeletingForm(null);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-200">
      
      {/* Top Header & Actions Bar */}
      <div className="w-full mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={onBackToPortal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title="Return to Specification Controls"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Specification Controls</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-bold">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Form Generator Studio</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                {forms.length} Pending Forms
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Form Directory</span>
            </h1>
          </div>

          {/* Primary Action: + New Form */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenNewModal}
              id="btn-create-new-form-primary"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ New Form</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms by name (e.g. Testing_1), doc number, or product..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-semibold self-start sm:self-auto">
            {(['All', 'Pending', 'Draft', 'Active'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forms Cards Grid */}
      <div className="w-full">
        {filteredForms.length === 0 ? (
          <div className="w-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No forms match your search</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm">
              Try adjusting your search criteria or create a new form using the button below.
            </p>
            <button
              type="button"
              onClick={handleOpenNewModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Form</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredForms.map((form) => {
              const isOngoing = form.name === 'Testing_1' || form.isOngoing;
              const totalElements = form.sections.reduce((acc, sec) => acc + (sec.elements?.length || 0), 0);
              const hasOnlineGrid = form.sections.some(s => s.elements?.some(e => e.type === 'table_grid'));
              const hasFinalGrid = form.sections.some(s => s.elements?.some(e => e.type === 'final_table_grid'));

              return (
                <div
                  key={form.id}
                  onClick={() => onSelectForm(form.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectForm(form.id);
                    }
                  }}
                  className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group cursor-pointer select-none text-left ${
                    isOngoing
                      ? 'bg-gradient-to-b from-white via-amber-50/15 to-white border-2 border-amber-400/90 shadow-md shadow-amber-500/10 hover:shadow-xl hover:border-amber-500 hover:-translate-y-1 ring-2 ring-amber-300/30'
                      : 'bg-white border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-1'
                  }`}
                  id={`form-card-${form.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  aria-label={`Form Card ${form.name}`}
                >
                  {/* Ongoing Form Ribbon / Badge */}
                  {isOngoing && (
                    <div className="absolute -top-3 left-5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold tracking-wide uppercase shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      <span>Ongoing Form</span>
                    </div>
                  )}

                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isOngoing
                            ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white'
                            : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                        }`}>
                          <FileSpreadsheet className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>{form.name}</span>
                            {isOngoing && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Ongoing Active Form" />
                            )}
                          </h3>
                          <div className="text-[11px] font-semibold text-slate-500">
                            Doc: <span className="font-mono text-slate-700">{form.documentHeader?.documentNo || 'F 17/3-2.1'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                        form.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : form.status === 'Pending'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {form.status}
                      </span>
                    </div>

                    {/* Product & Standard Information */}
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 mb-3.5">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1 mb-0.5">
                        {form.documentHeader?.productType || 'White Series – Switched Socket Outlet'}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Std: <strong className="font-mono text-slate-600">{form.documentHeader?.refStandard || 'SLS 734'}</strong></span>
                        <span>Rev: <strong className="font-mono text-slate-600">{form.documentHeader?.revisionNo || '04'}</strong></span>
                      </div>
                    </div>

                    {/* Section & Features Badges */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>{form.sections.length} Sections configured</span>
                        </span>
                        <span className="font-semibold text-slate-700">{totalElements} Elements</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        {hasOnlineGrid && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-100">
                            Online Shift Grid
                          </span>
                        )}
                        {hasFinalGrid && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                            Final 3-Sample Grid
                          </span>
                        )}
                        {form.sections.some(s => s.id === 'section-1') && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                            Digital Log
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {/* Rename button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenRename(form, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={`Rename ${form.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateForm(form.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={`Duplicate ${form.name}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button (safeguard: keep at least 1 form) */}
                      {forms.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDelete(form, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={`Delete ${form.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Open in Form Generator Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectForm(form.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs group-hover:shadow-xs cursor-pointer ${
                        isOngoing
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span>Open Form Generator</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: + New Form */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">Create New Form</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {newFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{newFormError}</span>
                </div>
              )}

              {/* Form Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Form Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFormName}
                  onChange={(e) => {
                    setNewFormName(e.target.value);
                    setNewFormError('');
                  }}
                  placeholder="e.g. Testing_2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Action Buttons: Cancel and Create */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-create-form"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Rename Form */}
      {renamingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Rename Inspection Form</h3>
            <p className="text-xs text-slate-500 mb-3">
              Change the display title for <strong className="text-slate-800">{renamingForm.name}</strong>.
            </p>
            <form onSubmit={handleConfirmRename} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingForm(null)}
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

      {/* MODAL: Delete Form Confirm */}
      {deletingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Form "{deletingForm.name}"?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to remove this pending form? This action will remove its configured sections and tables.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingForm(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Delete Form
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
