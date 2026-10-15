import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { InspectionModule } from '../types';
import {
  getMainCards,
  InspectionHierarchyCard,
  HIERARCHY_UPDATED_EVENT
} from '../inspectionHierarchyData';
import { InspectionCardIconRenderer } from './InspectionCardIconRenderer';

interface InspectionDashboardProps {
  onSelectModule: (module: InspectionModule, cardId?: string) => void;
}

export const InspectionDashboard: React.FC<InspectionDashboardProps> = ({
  onSelectModule,
}) => {
  const [mainCards, setMainCards] = useState<InspectionHierarchyCard[]>(() => getMainCards());

  useEffect(() => {
    const handleUpdate = () => {
      setMainCards(getMainCards());
    };
    window.addEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(HIERARCHY_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const handleCardClick = (card: InspectionHierarchyCard) => {
    const mod = card.moduleId || '';
    const nameLower = card.name.toLowerCase();

    if (mod === 'incoming' || nameLower.includes('incoming')) {
      onSelectModule('incoming', card.id);
    } else if (mod === 'in-process' || nameLower.includes('in-process') || nameLower.includes('online')) {
      onSelectModule('in-process', card.id);
    } else if (mod === 'subcontracting' || nameLower.includes('subcontract')) {
      onSelectModule('subcontracting', card.id);
    } else {
      onSelectModule('subcontracting', card.id);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-2 z-10 max-w-6xl mx-auto my-auto">
      {/* Portal Header - Compact to ensure 100% viewport fit */}
      <div className="text-center mb-3 sm:mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30 mb-1.5 ring-3 ring-blue-100/60">
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          QA Inspection Portal
        </h1>
        <p className="text-slate-500 font-medium mt-0.5 text-xs sm:text-sm">
          Select an inspection module to begin quality audits
        </p>
      </div>

      {/* Dynamic Module Cards Grid matching Inspection Editor configuration */}
      <div className={`grid grid-cols-1 ${
        mainCards.length === 1
          ? 'max-w-md'
          : mainCards.length === 2
          ? 'md:grid-cols-2 max-w-2xl'
          : mainCards.length === 3
          ? 'md:grid-cols-3 max-w-4xl'
          : 'sm:grid-cols-2 lg:grid-cols-4 max-w-6xl'
      } gap-3 sm:gap-4.5 w-full my-auto`}>
        {mainCards.map((card) => {
          return (
            <div 
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="portal-glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center relative group transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/95 shadow-sm hover:shadow-md border border-white/95"
              id={`module-${card.id}-card`}
            >
              {/* Module Icon with subtle decorative halo */}
              <div className="relative mb-2.5 sm:mb-3">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <InspectionCardIconRenderer iconName={card.iconName} className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white shadow-xs"></span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-2.5 group-hover:text-blue-600 transition-colors line-clamp-1">
                {card.name.replace(/#\s*\d*/g, '').replace(/#/g, '').trim()}
              </h3>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(card);
                }}
                className="w-full py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-xs shadow-blue-500/25 flex items-center justify-center gap-1.5 group-hover:shadow-sm cursor-pointer"
                id={`btn-start-${card.id}`}
              >
                <span>Start Inspection</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
