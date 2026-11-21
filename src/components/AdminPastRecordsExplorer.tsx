import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  Layers, 
  FolderArchive,
  Search,
  Filter
} from 'lucide-react';
import { 
  getMainCards, 
  getChildCards, 
  InspectionHierarchyCard, 
  HIERARCHY_UPDATED_EVENT 
} from '../inspectionHierarchyData';
import { InspectionCardIconRenderer } from './InspectionCardIconRenderer';
import { PastRecordsList } from './PastRecordsList';
import { PortalPageLayout } from './PortalPageLayout';

interface AdminPastRecordsExplorerProps {
  onBack: () => void;
}

export const AdminPastRecordsExplorer: React.FC<AdminPastRecordsExplorerProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Synchronize state with URL search params so browser Back/Forward & refreshing work naturally
  const currentMainCardId = searchParams.get('mainCard') || '';
  const currentChildCardId = searchParams.get('childCard') || '';

  // Hierarchy Data States
  const [mainCards, setMainCards] = useState<InspectionHierarchyCard[]>(() => getMainCards());
  const [childCards, setChildCards] = useState<InspectionHierarchyCard[]>(() => 
    currentMainCardId ? getChildCards(currentMainCardId) : []
  );

  useEffect(() => {
    const handleUpdate = () => {
      setMainCards(getMainCards());
      if (currentMainCardId) {
        setChildCards(getChildCards(currentMainCardId));
      }
    };
    window.addEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    };
  }, [currentMainCardId]);

  useEffect(() => {
    if (currentMainCardId) {
      setChildCards(getChildCards(currentMainCardId));
    } else {
      setChildCards([]);
    }
  }, [currentMainCardId]);

  // Resolve active objects
  const activeMainCard = mainCards.find(c => c.id === currentMainCardId);
  const activeChildCard = childCards.find(c => c.id === currentChildCardId);

  // Navigation handlers
  const handleSelectMainCard = (cardId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('mainCard', cardId);
    next.delete('childCard');
    next.delete('recordId');
    setSearchParams(next);
  };

  const handleSelectChildCard = (childId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('childCard', childId);
    next.delete('recordId');
    setSearchParams(next);
  };

  const handleBackToMainCards = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('mainCard');
    next.delete('childCard');
    next.delete('recordId');
    setSearchParams(next);
  };

  const handleBackToChildCards = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('childCard');
    next.delete('recordId');
    setSearchParams(next);
  };

  // =========================================================================
  // LEVEL 3: DIRECT PAST RECORDS LIST FOR SELECTED CHILD CARD
  // =========================================================================
  if (activeMainCard && activeChildCard) {
    return (
      <div className="w-full flex-1 flex flex-col px-4 sm:px-6 py-4 z-10 max-w-7xl mx-auto animate-in fade-in duration-200">
        {/* Compact Breadcrumb Navigation Bar (NO bulky document header) */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 px-4 py-3 mb-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 flex-wrap">
            <button
              type="button"
              onClick={handleBackToMainCards}
              className="hover:text-blue-600 transition cursor-pointer text-slate-500 font-medium"
            >
              Past Records
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <button
              type="button"
              onClick={handleBackToChildCards}
              className="hover:text-blue-600 transition cursor-pointer text-slate-600 font-medium"
            >
              {activeMainCard.name.replace(/#\s*\d*/g, '').replace(/#/g, '').trim()}
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <div className="flex items-center gap-1.5 font-bold text-slate-900 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>{activeChildCard.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              Direct Child Ledger
            </span>
          </div>
        </div>

        {/* Embedded Compact PastRecordsList (with Date Picker in Search Bar & Compact List View) */}
        <PastRecordsList
          isAdmin={true}
          categoryName={activeChildCard.name}
          childCardId={activeChildCard.id}
          moduleName={activeMainCard.name}
          hideHeader={true}
          defaultViewMode="list"
          onBack={handleBackToChildCards}
        />
      </div>
    );
  }

  // =========================================================================
  // LEVEL 2: CHILD CARDS FOR SELECTED MAIN MODULE
  // =========================================================================
  if (activeMainCard) {
    return (
      <PortalPageLayout
        maxWidthClass="max-w-7xl"
        className="animate-in fade-in duration-200"
        topBar={
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
              <span className="cursor-pointer hover:text-blue-600" onClick={handleBackToMainCards}>
                Past Records
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-slate-900">
                {activeMainCard.name.replace(/#\s*\d*/g, '').replace(/#/g, '').trim()}
              </span>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {childCards.length} Categories Available
            </span>
          </div>
        }
        header={
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/25 ring-2 ring-white mb-2">
              <InspectionCardIconRenderer iconName={activeMainCard.iconName} className="w-6 h-6 stroke-[2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeMainCard.name.replace(/#\s*\d*/g, '').replace(/#/g, '').trim()}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto font-medium mt-1">
              Select a child category below to view historical quality inspection sheets and audit logs
            </p>
          </div>
        }
      >
        {/* Child Cards Container */}
        <div className="w-full max-w-7xl mx-auto">
          {childCards.length === 0 ? (
            <div className="p-8 text-center bg-white/80 rounded-2xl border border-slate-200 max-w-md mx-auto">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Child Cards Configured Yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure child cards in Specification Controls to begin categorizing records.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-stretch justify-center gap-4 w-full mx-auto">
              {childCards.map((childCard) => {
                const cardWidthClass =
                  childCards.length === 1
                    ? 'w-full max-w-sm'
                    : childCards.length === 2
                    ? 'w-full sm:w-[calc(50%-12px)] max-w-sm'
                    : childCards.length === 3
                    ? 'w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] max-w-[340px]'
                    : childCards.length === 4
                    ? 'w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-16px)] max-w-[300px]'
                    : 'w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-14px)] lg:w-[calc(20%-14px)] max-w-[270px] min-w-[210px]';

                return (
                  <div
                    key={childCard.id}
                    onClick={() => handleSelectChildCard(childCard.id)}
                    className={`${cardWidthClass} portal-glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/95 shadow-sm hover:shadow-md border border-white/95`}
                    id={`admin-child-card-${childCard.id}`}
                  >
                    {/* Icon */}
                    <div className="relative mb-2.5">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
                        <InspectionCardIconRenderer iconName={childCard.iconName} className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
                      </div>
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white shadow-xs"></span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1 mb-3">
                      {childCard.name}
                    </h3>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChildCard(childCard.id);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-xs shadow-indigo-500/25 flex items-center justify-center gap-1.5 group-hover:shadow-sm cursor-pointer"
                    >
                      <span>View Past Records</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PortalPageLayout>
    );
  }

  // =========================================================================
  // LEVEL 1: MAIN MODULE CARDS (Incoming, In-Process, Subcontracting)
  // =========================================================================
  return (
    <PortalPageLayout
      maxWidthClass="max-w-6xl"
      className="animate-in fade-in duration-200"
      header={
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30 mb-2 ring-3 ring-blue-100/60">
            <FolderArchive className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Past Inspection Records
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm max-w-lg mx-auto">
            Select an inspection module to explore submitted quality audit sheets by category and item
          </p>
        </div>
      }
    >
      {/* Main Cards Grid */}
      <div className={`w-full ${
        mainCards.length === 1
          ? 'max-w-md'
          : mainCards.length === 2
          ? 'max-w-2xl'
          : mainCards.length === 3
          ? 'max-w-5xl'
          : 'max-w-6xl'
      } mx-auto`}>
        <div className="flex flex-wrap items-stretch justify-center gap-4 w-full mx-auto">
          {mainCards.map((card) => {
            const cardWidthClass =
              mainCards.length === 1
                ? 'w-full max-w-sm'
                : mainCards.length === 2
                ? 'w-full sm:w-[calc(50%-12px)] max-w-sm'
                : mainCards.length === 3
                ? 'w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] max-w-[340px]'
                : 'w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-16px)] max-w-[300px]';

            const cardChildren = getChildCards(card.id);

            return (
              <div 
                key={card.id}
                onClick={() => handleSelectMainCard(card.id)}
                className={`${cardWidthClass} portal-glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/95 shadow-sm hover:shadow-md border border-white/95`}
                id={`admin-main-card-${card.id}`}
              >
                {/* Module Icon */}
                <div className="relative mb-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs">
                    <InspectionCardIconRenderer iconName={card.iconName} className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white shadow-xs"></span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1 mb-3">
                  {card.name.replace(/#\s*\d*/g, '').replace(/#/g, '').trim()}
                </h3>

                <div className="w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMainCard(card.id);
                    }}
                    className="w-full py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-xs shadow-blue-500/25 flex items-center justify-center gap-1.5 group-hover:shadow-sm cursor-pointer"
                  >
                    <span>Explore Records</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PortalPageLayout>
  );
};
