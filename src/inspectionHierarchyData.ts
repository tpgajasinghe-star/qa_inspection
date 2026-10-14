export interface InspectionHierarchyCard {
  id: string;
  name: string;
  description: string;
  iconName: string;
  location: 'main' | 'child';
  parentId?: string; // id of parent card when location === 'child'
  order: number;
  moduleId?: string; // For main cards: 'incoming' | 'in-process' | 'subcontracting' | custom
  createdAt?: string;
  updatedAt?: string;
  tag?: string;
  itemCount?: number;
}

export const LOCAL_STORAGE_HIERARCHY_KEY = 'qc_inspection_hierarchy_cards_v1';
export const HIERARCHY_UPDATED_EVENT = 'inspection_cards_hierarchy_updated';

export const DEFAULT_INSPECTION_CARDS: InspectionHierarchyCard[] = [
  // ==================== MAIN PAGE CARDS ====================
  {
    id: 'main-incoming',
    name: 'Incoming Inspection',
    description: 'Verify incoming raw materials, LED, fans, protection components, subcontractors & packaging.',
    iconName: 'Box',
    location: 'main',
    order: 1,
    moduleId: 'incoming',
    tag: 'SUPPLIER QA',
    createdAt: '2026-01-10',
  },
  {
    id: 'main-inprocess',
    name: 'Online / In-Process',
    description: 'Perform live assembly line quality checks, tolerance calibrations, and real-time defect tracking.',
    iconName: 'ClipboardCheck',
    location: 'main',
    order: 2,
    moduleId: 'in-process',
    tag: 'LINE AUDIT',
    createdAt: '2026-01-10',
  },
  {
    id: 'main-subcontracting',
    name: 'Subcontracting Inspection',
    description: 'Audit outsourced manufacturing batches, external processing stages, and subcontracted deliveries.',
    iconName: 'Building2',
    location: 'main',
    order: 3,
    moduleId: 'subcontracting',
    tag: 'EXTERNAL VENDORS',
    createdAt: '2026-01-10',
  },

  // ==================== CHILD CARDS: INCOMING ====================
  {
    id: 'child-raw-material',
    name: 'Raw Material',
    description: 'Incoming sheet metals, alloy bars, extruded aluminum, copper coils, and raw polymers.',
    iconName: 'Layers',
    location: 'child',
    parentId: 'main-incoming',
    order: 1,
    tag: 'Metals & Polymers',
    itemCount: 42,
  },
  {
    id: 'child-led',
    name: 'LED',
    description: 'SMD LED chipsets, COB arrays, optical diodes, luminous flux ratings, and CCT binning.',
    iconName: 'Zap',
    location: 'child',
    parentId: 'main-incoming',
    order: 2,
    tag: 'Optoelectronics',
    itemCount: 28,
  },
  {
    id: 'child-fan',
    name: 'Fan',
    description: 'Brushless DC cooling fans, axial impeller assemblies, static pressure & dynamic balance.',
    iconName: 'Fan',
    location: 'child',
    parentId: 'main-incoming',
    order: 3,
    tag: 'Thermal & Airflow',
    itemCount: 19,
  },
  {
    id: 'child-protection',
    name: 'Protection',
    description: 'Metal oxide varistors (MOV), thermal fuses, ceramic cartridge fuses, TVS diodes, and ESD barriers.',
    iconName: 'ShieldCheck',
    location: 'child',
    parentId: 'main-incoming',
    order: 4,
    tag: 'Safety & Circuit Guard',
    itemCount: 31,
  },
  {
    id: 'child-subcontractor-sf',
    name: 'Subcontractor SF',
    description: 'Semi-finished outsourced components: SMT soldered sub-boards, stamped chassis, and blank CNC gears.',
    iconName: 'Cpu',
    location: 'child',
    parentId: 'main-incoming',
    order: 5,
    tag: 'Semi-Finished Outsourced',
    itemCount: 37,
  },
  {
    id: 'child-subcontractor-fg',
    name: 'Subcontractor FG',
    description: 'Finished outsourced assemblies, turn-key modules, programmed controllers, and partner products.',
    iconName: 'PackageCheck',
    location: 'child',
    parentId: 'main-incoming',
    order: 6,
    tag: 'Finished Turn-Key Goods',
    itemCount: 22,
  },
  {
    id: 'child-packing-items',
    name: 'Packing Items',
    description: 'Double-wall corrugated shipping boxes, ESD antistatic bubble rolls, serialized barcode labels, cushions.',
    iconName: 'Package',
    location: 'child',
    parentId: 'main-incoming',
    order: 7,
    tag: 'Packaging & Labels',
    itemCount: 25,
  },
  {
    id: 'child-others',
    name: 'Others',
    description: 'Industrial fasteners, silicone potting compound, threadlockers, neoprene gaskets, O-rings & consumables.',
    iconName: 'Boxes',
    location: 'child',
    parentId: 'main-incoming',
    order: 8,
    tag: 'Hardware & Consumables',
    itemCount: 34,
  },

  // ==================== CHILD CARDS: IN-PROCESS ====================
  {
    id: 'child-automation',
    name: 'Automation',
    description: 'Robotic assembly, automated pick-and-place, vision alignment systems, high-speed SMT solder verification.',
    iconName: 'Bot',
    location: 'child',
    parentId: 'main-inprocess',
    order: 1,
    tag: 'Robotics & Vision',
    itemCount: 5,
  },
  {
    id: 'child-white-series',
    name: 'White Series',
    description: 'High-gloss white aesthetic faceplates, pure white switches, non-yellowing UV stabilized polymers.',
    iconName: 'Sparkles',
    location: 'child',
    parentId: 'main-inprocess',
    order: 2,
    tag: 'Aesthetic & Optical',
    itemCount: 4,
  },
  {
    id: 'child-modular-nature',
    name: 'Modular/Nature',
    description: 'Modular grid framing, snap-fit interlocking tolerances, organic natural texture overlays, wood and stone effect.',
    iconName: 'Layers',
    location: 'child',
    parentId: 'main-inprocess',
    order: 3,
    tag: 'Structural & Decorative',
    itemCount: 3,
  },
  {
    id: 'child-inp-led',
    name: 'LED & Luminaire',
    description: 'High-speed luminous flux photometry, CCT chromaticity coordinate calibration, heatsink thermal resistance.',
    iconName: 'Zap',
    location: 'child',
    parentId: 'main-inprocess',
    order: 4,
    tag: 'Photometry & Thermal',
    itemCount: 6,
  },
  {
    id: 'child-injection',
    name: 'Injection Molding',
    description: 'Melt flow index, tool dimensional shrinkage, clamp pressure, gate vestige, sink mark depth and flash inspection.',
    iconName: 'Factory',
    location: 'child',
    parentId: 'main-inprocess',
    order: 5,
    tag: 'Polymer Processing',
    itemCount: 7,
  },

  // ==================== CHILD CARDS: SUBCONTRACTING ====================
  {
    id: 'child-sub-smt',
    name: 'Outsourced SMT Assemblies',
    description: 'Surface mount technology board sub-assemblies delivered by tier-1 contracted EMS partner facilities.',
    iconName: 'Cpu',
    location: 'child',
    parentId: 'main-subcontracting',
    order: 1,
    tag: 'Tier-1 EMS',
    itemCount: 16,
  },
  {
    id: 'child-sub-plating',
    name: 'Plating & Surface Treatment',
    description: 'Zinc galvanizing, nickel coating, electro-polishing, and corrosion resistance salt spray tests.',
    iconName: 'ShieldCheck',
    location: 'child',
    parentId: 'main-subcontracting',
    order: 2,
    tag: 'Chemical Finishing',
    itemCount: 12,
  },
  {
    id: 'child-sub-harness',
    name: 'Wire Harness Subcontract',
    description: 'Pre-crimped wire looms, multi-pin connector terminations, pin retention pull tests and continuity.',
    iconName: 'Activity',
    location: 'child',
    parentId: 'main-subcontracting',
    order: 3,
    tag: 'Wiring Harnesses',
    itemCount: 14,
  },
  {
    id: 'child-sub-stamping',
    name: 'Metal Stamping Outsourced',
    description: 'Precision progressive die stamped brackets, earthing clips, and brass terminal contacts.',
    iconName: 'Factory',
    location: 'child',
    parentId: 'main-subcontracting',
    order: 4,
    tag: 'Tooling & Stamping',
    itemCount: 18,
  },
];

// Helper to retrieve all cards from localStorage with fallback to defaults
export function getStoredInspectionCards(): InspectionHierarchyCard[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HIERARCHY_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_HIERARCHY_KEY, JSON.stringify(DEFAULT_INSPECTION_CARDS));
      return DEFAULT_INSPECTION_CARDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse inspection hierarchy from localStorage:', err);
  }
  return DEFAULT_INSPECTION_CARDS;
}

// Helper to save cards to localStorage and broadcast update event
export function saveStoredInspectionCards(cards: InspectionHierarchyCard[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_HIERARCHY_KEY, JSON.stringify(cards));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(HIERARCHY_UPDATED_EVENT, { detail: cards }));
    }
  } catch (err) {
    console.error('Failed to save inspection hierarchy to localStorage:', err);
  }
}

// Get only main page cards, sorted by order
export function getMainCards(cards?: InspectionHierarchyCard[]): InspectionHierarchyCard[] {
  const source = cards || getStoredInspectionCards();
  return source
    .filter(c => c.location === 'main')
    .sort((a, b) => a.order - b.order);
}

// Get child cards for a given parent main card, sorted by order
export function getChildCards(parentId: string, cards?: InspectionHierarchyCard[]): InspectionHierarchyCard[] {
  const source = cards || getStoredInspectionCards();
  return source
    .filter(c => c.location === 'child' && c.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

// Reorder cards of a specific group
export function moveCardOrder(cardId: string, direction: 'up' | 'down'): InspectionHierarchyCard[] {
  const allCards = getStoredInspectionCards();
  const targetCard = allCards.find(c => c.id === cardId);
  if (!targetCard) return allCards;

  // Get sibling cards (either all main cards, or all child cards of the same parent)
  let siblings = targetCard.location === 'main'
    ? allCards.filter(c => c.location === 'main').sort((a, b) => a.order - b.order)
    : allCards.filter(c => c.location === 'child' && c.parentId === targetCard.parentId).sort((a, b) => a.order - b.order);

  const currentIndex = siblings.findIndex(c => c.id === cardId);
  if (currentIndex === -1) return allCards;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return allCards;

  // Swap order values
  const currentCard = siblings[currentIndex];
  const siblingCard = siblings[targetIndex];

  const tempOrder = currentCard.order;
  currentCard.order = siblingCard.order;
  siblingCard.order = tempOrder;

  // Re-normalize siblings order indices: 1, 2, 3...
  siblings.sort((a, b) => (direction === 'up' ? a.order - b.order : a.order - b.order));
  const newOrderMap = new Map<string, number>();
  // Swap positions in array
  const reorderedSiblings = [...siblings];
  const [removed] = reorderedSiblings.splice(currentIndex, 1);
  reorderedSiblings.splice(targetIndex, 0, removed);
  reorderedSiblings.forEach((item, idx) => {
    newOrderMap.set(item.id, idx + 1);
  });

  const updatedAll = allCards.map(c => {
    if (newOrderMap.has(c.id)) {
      return { ...c, order: newOrderMap.get(c.id)! };
    }
    return c;
  });

  saveStoredInspectionCards(updatedAll);
  return updatedAll;
}

// Add a new card
export function addInspectionCard(card: Omit<InspectionHierarchyCard, 'id' | 'order'>): InspectionHierarchyCard {
  const allCards = getStoredInspectionCards();
  const newId = `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Determine next order number in group
  const siblings = card.location === 'main'
    ? allCards.filter(c => c.location === 'main')
    : allCards.filter(c => c.location === 'child' && c.parentId === card.parentId);

  const nextOrder = siblings.length + 1;

  const newCard: InspectionHierarchyCard = {
    ...card,
    id: newId,
    order: nextOrder,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };

  const updatedAll = [...allCards, newCard];
  saveStoredInspectionCards(updatedAll);
  return newCard;
}

// Delete card (and its child cards if it's a main card)
export function deleteInspectionCard(cardId: string): InspectionHierarchyCard[] {
  const allCards = getStoredInspectionCards();
  const target = allCards.find(c => c.id === cardId);
  if (!target) return allCards;

  let remaining: InspectionHierarchyCard[] = [];

  if (target.location === 'main') {
    // Also remove any child cards belonging to this main card
    remaining = allCards.filter(c => c.id !== cardId && c.parentId !== cardId);
    // Renumber remaining main cards
    let mOrder = 1;
    remaining = remaining.map(c => {
      if (c.location === 'main') {
        return { ...c, order: mOrder++ };
      }
      return c;
    });
  } else {
    // Child card deletion: remove this child and renumber its siblings
    remaining = allCards.filter(c => c.id !== cardId);
    let cOrder = 1;
    remaining = remaining.map(c => {
      if (c.location === 'child' && c.parentId === target.parentId) {
        return { ...c, order: cOrder++ };
      }
      return c;
    });
  }

  saveStoredInspectionCards(remaining);
  return remaining;
}

// Reset hierarchy to default factory layout
export function resetToDefaultInspectionCards(): InspectionHierarchyCard[] {
  saveStoredInspectionCards(DEFAULT_INSPECTION_CARDS);
  return DEFAULT_INSPECTION_CARDS;
}
