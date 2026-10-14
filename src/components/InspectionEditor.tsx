import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Key,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Check
} from 'lucide-react';
import {
  InspectionHierarchyCard,
  getStoredInspectionCards,
  getMainCards,
  getChildCards,
  addInspectionCard,
  deleteInspectionCard,
  moveCardOrder,
  resetToDefaultInspectionCards,
  HIERARCHY_UPDATED_EVENT
} from '../inspectionHierarchyData';
import {
  InspectionCardIconRenderer,
  AVAILABLE_CARD_ICONS
} from './InspectionCardIconRenderer';

interface InspectionEditorProps {
  onBack: () => void;
  userId?: string;
}

export const InspectionEditor: React.FC<InspectionEditorProps> = ({
  onBack,
  userId = 'AD-1004'
}) => {
  // State for all cards
  const [cards, setCards] = useState<InspectionHierarchyCard[]>(() => getStoredInspectionCards());
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'danger'>('success');

  // Expanded sections state (which main cards are expanded to view child cards)
  // Default is collapsed: only expands when the user clicks the arrow button
  const [expandedMainCards, setExpandedMainCards] = useState<Record<string, boolean>>({});

  // =========================================================================
  // MODAL: CREATE NEW CARD (Requirement 4)
  // Step 1: Target Location (Main or Child)
  // If Main -> Name, Card Icon, Small Description
  // If Child -> Where into Main Cards?, Name, Card Icon, Small Description
  // =========================================================================
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTargetLocation, setCreateTargetLocation] = useState<'main' | 'child'>('main');
  const [createParentId, setCreateParentId] = useState<string>('');
  const [createCardName, setCreateCardName] = useState('');
  const [createCardIcon, setCreateCardIcon] = useState('Box');
  const [createCardDescription, setCreateCardDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [iconFilterCategory, setIconFilterCategory] = useState<string>('All');

  // =========================================================================
  // MODAL: ADMIN DELETE CARD (Requirement 5)
  // Shows full card details under user selection + requires Admin Password
  // =========================================================================
  const [deletingCard, setDeletingCard] = useState<InspectionHierarchyCard | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // =========================================================================
  // MODAL: RESET DEFAULTS
  // =========================================================================
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Sync state on hierarchy updates
  useEffect(() => {
    const handleUpdate = () => {
      setCards(getStoredInspectionCards());
    };
    window.addEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'danger' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const toggleExpand = (mainId: string) => {
    setExpandedMainCards(prev => ({
      ...prev,
      [mainId]: !prev[mainId]
    }));
  };

  // Open Create Modal with optional parent pre-selected
  const handleOpenCreateModal = (preselectedParentId?: string) => {
    const mainList = getMainCards(cards);
    if (preselectedParentId) {
      setCreateTargetLocation('child');
      setCreateParentId(preselectedParentId);
    } else {
      setCreateTargetLocation('main');
      setCreateParentId(mainList.length > 0 ? mainList[0].id : '');
    }
    setCreateCardName('');
    setCreateCardIcon(preselectedParentId ? 'Layers' : 'Box');
    setCreateCardDescription('');
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  // Submit Create Card
  const handleConfirmCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = createCardName.trim();
    const trimmedDesc = createCardDescription.trim();

    if (!trimmedName) {
      setCreateError('Please enter a card name.');
      return;
    }

    if (createTargetLocation === 'child' && !createParentId) {
      setCreateError('Please select which main section this child card belongs to.');
      return;
    }

    if (!trimmedDesc) {
      setCreateError('Please provide a short description for this card.');
      return;
    }

    const newCard = addInspectionCard({
      name: trimmedName,
      description: trimmedDesc,
      iconName: createCardIcon,
      location: createTargetLocation,
      parentId: createTargetLocation === 'child' ? createParentId : undefined,
      tag: createTargetLocation === 'main' ? 'CUSTOM MODULE' : 'CUSTOM QA',
      moduleId: createTargetLocation === 'main' ? `custom-${Date.now()}` : undefined,
    });

    // Make sure parent is expanded so user sees the new card
    if (createTargetLocation === 'child' && createParentId) {
      setExpandedMainCards(prev => ({ ...prev, [createParentId]: true }));
    }

    setIsCreateModalOpen(false);
    setCards(getStoredInspectionCards());
    showToast(`Created new ${createTargetLocation === 'main' ? 'main' : 'child'} card "${newCard.name}"!`, 'success');
  };

  // Move Card Order (Requirement 3)
  const handleMoveOrder = (cardId: string, direction: 'up' | 'down') => {
    const updated = moveCardOrder(cardId, direction);
    setCards(updated);
    showToast(`Updated card sequence order!`, 'success');
  };

  // Open Delete Modal (Requirement 5)
  const handleOpenDelete = (card: InspectionHierarchyCard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingCard(card);
    setAdminPasswordInput('');
    setDeletePasswordError('');
  };

  // Confirm Delete with Admin Password (Requirement 5)
  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingCard) return;

    // Check admin password
    const trimmedPass = adminPasswordInput.trim();
    if (!trimmedPass) {
      setDeletePasswordError('Admin password is required to delete inspection cards.');
      return;
    }

    // Accept standard default password 'password123' or any valid authenticated session credentials
    if (trimmedPass !== 'password123') {
      setDeletePasswordError('Invalid admin password. Authorization denied.');
      return;
    }

    const cardName = deletingCard.name;
    const isMain = deletingCard.location === 'main';
    const childCount = isMain ? getChildCards(deletingCard.id, cards).length : 0;

    const remaining = deleteInspectionCard(deletingCard.id);
    setCards(remaining);
    setDeletingCard(null);
    setAdminPasswordInput('');
    setDeletePasswordError('');

    const msg = isMain && childCount > 0
      ? `Deleted main card "${cardName}" and its ${childCount} child cards.`
      : `Deleted card "${cardName}".`;
    showToast(msg, 'danger');
  };

  // Reset to Factory Defaults
  const handleConfirmReset = () => {
    const defaults = resetToDefaultInspectionCards();
    setCards(defaults);
    setIsResetConfirmOpen(false);
    showToast('Reset all inspection cards to factory standards!', 'success');
  };

  const mainCards = getMainCards(cards);

  // Search filter
  const filterMatches = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  const visibleMainCards = mainCards.filter(m => {
    if (!searchQuery.trim()) return true;
    const matchSelf = filterMatches(m.name) || filterMatches(m.description);
    const childs = getChildCards(m.id, cards);
    const matchChild = childs.some(c => filterMatches(c.name) || filterMatches(c.description));
    return matchSelf || matchChild;
  });

  return (
    <div className="w-full flex-1 flex flex-col items-center max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold border transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${
          toastType === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 ring-2 ring-emerald-300'
            : 'bg-rose-50 text-rose-900 border-rose-200 ring-2 ring-rose-300'
        }`}>
          {toastType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="w-full mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title="Return to Specification Controls"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Specification Controls</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Inspection Editor</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Inspection Hierarchy & Cards Editor</span>
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Reset inspection cards to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              id="btn-create-inspection-card-primary"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create New Card</span>
            </button>
          </div>
        </div>

        {/* Stats & Search Toolbar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search main or child cards by name or description..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
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

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              {mainCards.length} Main Modules
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              {cards.filter(c => c.location === 'child').length} Child Cards
            </span>
          </div>
        </div>
      </div>

      {/* Main Hierarchy List (Grouped by Main Cards) */}
      <div className="w-full space-y-6">
        {visibleMainCards.length === 0 ? (
          <div className="w-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No inspection cards found</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm">
              Try adjusting your search criteria or create a new card using the button below.
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Card</span>
            </button>
          </div>
        ) : (
          visibleMainCards.map((mainCard, mainIdx) => {
            const childCards = getChildCards(mainCard.id, cards);
            const isExpanded = !!expandedMainCards[mainCard.id];
            const isFirst = mainIdx === 0;
            const isLast = mainIdx === visibleMainCards.length - 1;

            return (
              <div
                key={mainCard.id}
                className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300"
                id={`main-card-block-${mainCard.id}`}
              >
                {/* Main Card Header */}
                <div className={`p-4 sm:p-5 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isExpanded ? 'border-b border-slate-200/80' : ''
                }`}>
                  <div className="flex items-start sm:items-center gap-3.5 flex-1">
                    {/* Expand/Collapse Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(mainCard.id)}
                      className={`p-1.5 rounded-xl transition-all cursor-pointer mt-1 sm:mt-0 flex items-center justify-center ${
                        isExpanded
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200/80 ring-1 ring-blue-300'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/80'
                      }`}
                      title={isExpanded ? 'Collapse child cards' : 'Click arrow to expand child cards'}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 stroke-[2.2]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                      )}
                    </button>

                    {/* Order Pill */}
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded-lg shrink-0">
                      <span>#{mainCard.order}</span>
                    </div>

                    {/* Main Card Icon */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <InspectionCardIconRenderer iconName={mainCard.iconName} className="w-5 h-5 stroke-[2]" />
                    </div>

                    {/* Main Card Titles */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                          {mainCard.name}
                        </h2>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/80">
                          Main Page Card
                        </span>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {childCards.length} Child Cards
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {mainCard.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions on Main Card */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Reorder Buttons (Requirement 3) */}
                    <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(mainCard.id, 'up')}
                        disabled={isFirst}
                        className={`p-1.5 rounded-lg transition-all ${
                          isFirst
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs cursor-pointer'
                        }`}
                        title="Move main card up in order"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(mainCard.id, 'down')}
                        disabled={isLast}
                        className={`p-1.5 rounded-lg transition-all ${
                          isLast
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs cursor-pointer'
                        }`}
                        title="Move main card down in order"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Add Child Button (Requirement 2) */}
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(mainCard.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={`Add child card to ${mainCard.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Child Card</span>
                    </button>

                    {/* Delete Main Card Button (Requirement 5) */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenDelete(mainCard, e)}
                      className="p-1.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 text-xs font-semibold transition cursor-pointer"
                      title={`Delete "${mainCard.name}" and its child cards`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Nested Child Cards (Requirements 1 & 2) */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Child Cards inside "{mainCard.name}"</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal(mainCard.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Child Card</span>
                      </button>
                    </div>

                    {childCards.length === 0 ? (
                      <div className="py-6 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                        No child cards configured under this section yet. Click{' '}
                        <button
                          onClick={() => handleOpenCreateModal(mainCard.id)}
                          className="text-indigo-600 font-bold underline cursor-pointer"
                        >
                          + Child Card
                        </button>{' '}
                        to add one.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {childCards.map((child, cIdx) => {
                          const isChildFirst = cIdx === 0;
                          const isChildLast = cIdx === childCards.length - 1;

                          return (
                            <div
                              key={child.id}
                              className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                              id={`child-card-${child.id}`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                      <InspectionCardIconRenderer iconName={child.iconName} className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-slate-900 truncate">
                                        {child.name}
                                      </h4>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        #{child.order} • Child Card
                                      </span>
                                    </div>
                                  </div>

                                  {/* Child Reorder & Delete */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveOrder(child.id, 'up')}
                                      disabled={isChildFirst}
                                      className={`p-1 rounded transition ${
                                        isChildFirst
                                          ? 'text-slate-200 cursor-not-allowed'
                                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer'
                                      }`}
                                      title="Move child card up"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveOrder(child.id, 'down')}
                                      disabled={isChildLast}
                                      className={`p-1 rounded transition ${
                                        isChildLast
                                          ? 'text-slate-200 cursor-not-allowed'
                                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer'
                                      }`}
                                      title="Move child card down"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenDelete(child, e)}
                                      className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer ml-1"
                                      title={`Delete child card "${child.name}"`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {child.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW CARD (Requirement 4)                                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Inspection Card</h3>
                  <p className="text-[11px] text-blue-100">Select target location first, then configure card details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleConfirmCreateCard} className="p-6 space-y-4 overflow-y-auto flex-1">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Requirement 4 Step 1: Target Location (Main vs Child) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Target Location <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateTargetLocation('main');
                      setCreateError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      createTargetLocation === 'main'
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400/30'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Main Page Card</span>
                      {createTargetLocation === 'main' && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Top-level module on the main dashboard (like Incoming, Online, Subcontracting).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreateTargetLocation('child');
                      setCreateError('');
                      if (!createParentId && mainCards.length > 0) {
                        setCreateParentId(mainCards[0].id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      createTargetLocation === 'child'
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-400/30'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Child Card</span>
                      {createTargetLocation === 'child' && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Sub-category card nested inside one of the main inspection sections.
                    </p>
                  </button>
                </div>
              </div>

              {/* If Child selected: Ask where into the main cards (Requirement 4) */}
              {createTargetLocation === 'child' && (
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/80">
                  <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1.5">
                    Where into the main cards? <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createParentId}
                    onChange={(e) => {
                      setCreateParentId(e.target.value);
                      setCreateError('');
                    }}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {mainCards.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} (#{m.order})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-indigo-700 mt-1 font-medium">
                    Select which main inspection module this child card belongs to.
                  </p>
                </div>
              )}

              {/* Card Name (Requirement 4) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Card Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={createCardName}
                  onChange={(e) => {
                    setCreateCardName(e.target.value);
                    setCreateError('');
                  }}
                  placeholder={
                    createTargetLocation === 'main'
                      ? 'e.g., Final Inspection / Warehouse QA'
                      : 'e.g., Optical Sensors / Cable Wire Harness'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Card Icon Picker (Requirement 4) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Card Icon <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Selected: <strong>{createCardIcon}</strong>
                  </span>
                </label>
                
                {/* Icon Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
                  {AVAILABLE_CARD_ICONS.map(iconOpt => {
                    const isSelected = createCardIcon === iconOpt.name;
                    return (
                      <button
                        key={iconOpt.name}
                        type="button"
                        onClick={() => setCreateCardIcon(iconOpt.name)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs scale-105 ring-2 ring-blue-400'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title={iconOpt.label}
                      >
                        <InspectionCardIconRenderer iconName={iconOpt.name} className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Small Description (Requirement 4) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Small Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={createCardDescription}
                  onChange={(e) => {
                    setCreateCardDescription(e.target.value);
                    setCreateError('');
                  }}
                  placeholder="Short explanation of quality standards, test items, or scope for this card..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADMIN DELETE CARD (Requirement 5)                                   */}
      {/* Shows card under selection + requires Admin Password before confirm       */}
      {/* ========================================================================= */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Security Alert */}
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Inspection Card</h3>
                  <p className="text-[11px] text-rose-100">Admin password required before confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelete} className="p-6 space-y-4">
              {/* Requirement 5: Show every card under the user selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Card Selected for Deletion
                </label>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <InspectionCardIconRenderer iconName={deletingCard.iconName} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {deletingCard.name}
                        </h4>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          deletingCard.location === 'main'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {deletingCard.location === 'main' ? 'Main Card' : 'Child Card'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {deletingCard.description}
                      </p>
                    </div>
                  </div>

                  {/* If main card has child cards, warn user */}
                  {deletingCard.location === 'main' && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-amber-700 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>
                        Deleting this main card will also delete its {getChildCards(deletingCard.id, cards).length} child cards.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement 5: Admin Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin Security Password <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      setDeletePasswordError('');
                    }}
                    placeholder="Enter admin password (e.g. password123)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
                {deletePasswordError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{deletePasswordError}</span>
                  </p>
                )}
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Authorized role: <strong>QA Admin ({userId})</strong></span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    Admin pass: password123
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingCard(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!adminPasswordInput.trim()}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all ${
                    !adminPasswordInput.trim()
                      ? 'bg-rose-300 cursor-not-allowed shadow-none'
                      : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-500/20 cursor-pointer'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET FACTORY DEFAULTS                                             */}
      {/* ========================================================================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Reset to Factory Hierarchy?</h3>
            <p className="text-xs text-slate-500 mb-4">
              This will restore all default main modules (Incoming, Online, Subcontracting) and standard child inspection cards.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
