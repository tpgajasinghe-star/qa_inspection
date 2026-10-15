import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { InspectionRecord } from '../types';
import {
  getChildCards,
  getMainCards,
  InspectionHierarchyCard,
  HIERARCHY_UPDATED_EVENT
} from '../inspectionHierarchyData';
import { InspectionCardIconRenderer } from './InspectionCardIconRenderer';
import { ChildCardOperationsWorkspace } from './ChildCardOperationsWorkspace';

interface ModuleInspectionPortalProps {
  mainCardId: string;
  onBack: () => void;
  userId: string;
  inspections?: InspectionRecord[];
  onAddInspectionRecord?: (item: InspectionRecord) => void;
}

export const ModuleInspectionPortal: React.FC<ModuleInspectionPortalProps> = ({
  mainCardId,
  onBack,
  userId,
  inspections = [],
  onAddInspectionRecord,
}) => {
  const [activeChildCard, setActiveChildCard] = useState<InspectionHierarchyCard | null>(null);

  // Load configured main card data
  const [mainCard, setMainCard] = useState<InspectionHierarchyCard | undefined>(() =>
    getMainCards().find(c => c.id === mainCardId)
  );

  // Load configured child cards for this main card
  const [childCards, setChildCards] = useState<InspectionHierarchyCard[]>(() =>
    getChildCards(mainCardId)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setMainCard(getMainCards().find(c => c.id === mainCardId));
      setChildCards(getChildCards(mainCardId));
    };
    window.addEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    };
  }, [mainCardId]);

  if (!mainCard) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Module Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The selected inspection module could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // If a child card is clicked, open the operations workspace (1. Make New Inspection, 2. View Past Records)
  if (activeChildCard) {
    return (
      <ChildCardOperationsWorkspace
        mainCard={mainCard}
        childCard={activeChildCard}
        userId={userId}
        inspections={inspections}
        onAddInspectionRecord={onAddInspectionRecord}
        onBackToChildCards={() => setActiveChildCard(null)}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-2 z-10 max-w-7xl mx-auto my-auto animate-in fade-in duration-200">
      
      {/* Top Header Section - Compact to fit 100% in viewport */}
      <div className="w-full flex flex-col items-center">
        <div className="text-center mb-2 sm:mb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 ring-2 ring-white">
              <InspectionCardIconRenderer iconName={mainCard.iconName} className="w-5 h-5 stroke-[2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {mainCard.name.replace(/#\s*\d*/g, '').replace(/#/g, '').trim()}
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto font-medium">
            Select a child category below to perform quality inspection operations
          </p>
        </div>
      </div>

      {/* Child Cards Grid */}
      <div className="w-full max-w-7xl my-auto mb-2 sm:mb-3">
        {childCards.length === 0 ? (
          <div className="p-8 text-center bg-white/80 rounded-2xl border border-slate-200 max-w-md mx-auto">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Child Cards Configured Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Admins can add child cards to this module using the Inspection Editor in Specification Controls.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5">
            {childCards.map((childCard) => (
              <div
                key={childCard.id}
                onClick={() => setActiveChildCard(childCard)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveChildCard(childCard);
                  }
                }}
                className="portal-glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer select-none border border-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white/95 shadow-xs"
                id={`card-${childCard.id}`}
              >
                {/* Module Icon */}
                <div className="flex flex-col items-center w-full">
                  <div className="relative mb-2.5 sm:mb-3">
                    <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                      <InspectionCardIconRenderer iconName={childCard.iconName} className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full shadow-2xs group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Card Title */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-2.5 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {childCard.name}
                  </h3>
                </div>

                {/* Card Action Button */}
                <div className="w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChildCard(childCard);
                    }}
                    className="w-full py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-all duration-200 shadow-2xs shadow-blue-500/25 flex items-center justify-center gap-1.5 group-hover:shadow-xs cursor-pointer"
                    id={`btn-open-${childCard.id}`}
                  >
                    <span>Select Operations</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return to QA Inspection Button at bottom */}
      <div className="w-full flex justify-center pt-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-xs shadow-xs border border-slate-200/80 backdrop-blur-md transition-all cursor-pointer group hover:shadow-xs"
          id="btn-return-to-qa-portal-module"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to QA Inspection Modules</span>
        </button>
      </div>

    </div>
  );
};
