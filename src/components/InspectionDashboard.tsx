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
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 z-10 max-w-7xl mx-auto">
      {/* Portal Header */}
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4 ring-4 ring-blue-100/60">
          <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          QA Inspection Portal
        </h1>
        <p className="text-slate-500 font-medium mt-1.5 text-base sm:text-lg">
          Select an inspection module to begin quality audits
        </p>
      </div>

      {/* Dynamic Module Cards Grid matching Inspection Editor configuration */}
      <div className={`grid grid-cols-1 ${
        mainCards.length === 1
          ? 'max-w-md'
          : mainCards.length === 2
          ? 'md:grid-cols-2 max-w-4xl'
          : 'md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
      } gap-6 sm:gap-7 w-full`}>
        {mainCards.map((card) => {
          return (
            <div 
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="portal-glass-card rounded-3xl p-8 flex flex-col items-center text-center relative group transition-all duration-300 hover:-translate-y-1.5 cursor-pointer bg-white/90 shadow-md hover:shadow-xl border border-white/95"
              id={`module-${card.id}-card`}
            >
              {/* Module Icon with subtle decorative halo */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <InspectionCardIconRenderer iconName={card.iconName} className="w-9 h-9 stroke-[1.8]" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white shadow-xs"></span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6 group-hover:text-blue-600 transition-colors">
                {card.name.replace(/#\s*\d*/g, '').replace(/#/g, '').trim()}
              </h3>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(card);
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/35 cursor-pointer"
                id={`btn-start-${card.id}`}
              >
                <span>Start Inspection</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
