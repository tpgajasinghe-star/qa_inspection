import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Layers
} from 'lucide-react';
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
  // Find current main card
  const [mainCard, setMainCard] = useState<InspectionHierarchyCard>(() => {
    const allMains = getMainCards();
    return allMains.find(m => m.id === mainCardId) || {
      id: mainCardId,
      name: 'Inspection Module',
      description: 'Quality audit and inspection category module',
      iconName: 'Building2',
      location: 'main',
      order: 3,
      moduleId: mainCardId.replace('main-', ''),
    };
  });

  // Configured child cards for this main card
  const [childCards, setChildCards] = useState<InspectionHierarchyCard[]>(() =>
    getChildCards(mainCardId)
  );

  // Active clicked child card (which will show the two operations: 1. Make New Inspection, 2. View Past Records)
  const [activeChildCard, setActiveChildCard] = useState<InspectionHierarchyCard | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const allMains = getMainCards();
      const updatedMain = allMains.find(m => m.id === mainCardId);
      if (updatedMain) setMainCard(updatedMain);
      setChildCards(getChildCards(mainCardId));
    };
    window.addEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    };
  }, [mainCardId]);

  // If a child card is clicked, show the two operations workspace
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
    <div className="w-full flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-6 z-10 max-w-7xl mx-auto min-h-[calc(100vh-6rem)] animate-in fade-in duration-200">
      
      {/* Top Header Section */}
      <div className="w-full flex flex-col items-center">
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-3.5 mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-4 ring-white">
              <InspectionCardIconRenderer iconName={mainCard.iconName} className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              {mainCard.name.replace(/#\s*\d*/g, '').replace(/#/g, '').trim()}
            </h1>
          </div>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto font-medium">
            Select a child category below to perform quality inspection operations
          </p>
        </div>
      </div>

      {/* Child Cards Grid */}
      <div className="w-full max-w-7xl my-auto mb-8">
        {childCards.length === 0 ? (
          <div className="p-12 text-center bg-white/80 rounded-3xl border border-slate-200 max-w-md mx-auto">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Child Cards Configured Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Admins can add child cards to this module using the Inspection Editor in Specification Controls.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
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
                className="portal-glass-card rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center justify-between relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer select-none border border-white/90 focus:outline-none focus:ring-4 focus:ring-blue-500/20 bg-white/90"
                id={`card-${childCard.id}`}
              >
                {/* Module Icon */}
                <div className="flex flex-col items-center w-full">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <InspectionCardIconRenderer iconName={childCard.iconName} className="w-9 h-9 stroke-[1.8]" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-xs group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Card Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-4 group-hover:text-blue-600 transition-colors">
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
                    className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/35 cursor-pointer"
                    id={`btn-open-${childCard.id}`}
                  >
                    <span>Select Operations</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return to QA Inspection Button at bottom */}
      <div className="w-full flex justify-center pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-xs sm:text-sm shadow-sm border border-slate-200/80 backdrop-blur-md transition-all cursor-pointer group hover:shadow-md"
          id="btn-return-to-qa-portal-module"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to QA Inspection Modules</span>
        </button>
      </div>

    </div>
  );
};
