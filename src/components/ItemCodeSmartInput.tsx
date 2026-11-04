import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Check, 
  Database, 
  ChevronDown, 
  X, 
  ArrowRight, 
  CornerDownLeft, 
  Layers 
} from 'lucide-react';
import { 
  DbItem, 
  fetchItems, 
  findMatchingItemCandidates, 
  resolveItemCodeOnEnter, 
  parseItemCode,
  lookupDatabaseItem,
  SEED_FACTORY_ITEMS 
} from '../backend/itemService';

export interface ItemCodeSmartInputProps {
  value: string;
  onChange: (fullCode: string, item?: DbItem) => void;
  onSelectDescription?: (description: string, item: DbItem) => void;
  itemsList?: DbItem[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
  contextHint?: string;
  compact?: boolean;
}

export const ItemCodeSmartInput: React.FC<ItemCodeSmartInputProps> = ({
  value,
  onChange,
  onSelectDescription,
  itemsList: propsItemsList,
  placeholder = 'Item Code',
  className = '',
  autoFocus = false,
  disabled = false,
  id = 'smart-item-code-input',
  contextHint,
  compact = false,
}) => {
  const [internalItems, setInternalItems] = useState<DbItem[]>(() => {
    if (propsItemsList && propsItemsList.length > 0) return propsItemsList;
    return SEED_FACTORY_ITEMS;
  });

  const [typedValue, setTypedValue] = useState(value);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [multipleCandidates, setMultipleCandidates] = useState<DbItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [justResolvedItem, setJustResolvedItem] = useState<DbItem | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    setTypedValue(value);
  }, [value]);

  // Load items from Supabase if not provided
  useEffect(() => {
    let isMounted = true;
    if (!propsItemsList || propsItemsList.length === 0) {
      fetchItems().then((data) => {
        if (isMounted && data && data.length > 0) {
          setInternalItems(data);
        }
      });
    } else {
      setInternalItems(propsItemsList);
    }
    return () => {
      isMounted = false;
    };
  }, [propsItemsList]);

  // Outside click handler to close popup
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeCatalog = useMemo(() => {
    return internalItems && internalItems.length > 0 ? internalItems : SEED_FACTORY_ITEMS;
  }, [internalItems]);

  // Calculate live matching candidate count
  const searchResult = useMemo(() => {
    if (!typedValue || !typedValue.trim()) {
      return { 
        exactMatch: null, 
        exactTailMatches: [], 
        suffixMatches: [], 
        containsMatches: [], 
        allCandidates: [],
        hasDifferentHeadsConflict: false,
      };
    }
    return findMatchingItemCandidates(typedValue.trim(), activeCatalog);
  }, [typedValue, activeCatalog]);

  const exactMatchedCurrent = useMemo(() => {
    if (!typedValue.trim()) return null;
    return activeCatalog.find(
      (it) => it.item_code.toLowerCase() === typedValue.trim().toLowerCase()
    ) || null;
  }, [typedValue, activeCatalog]);

  // Matching candidates to show in small popup right next to the field
  const liveCandidates = useMemo(() => {
    const trimmed = typedValue.trim();
    if (!trimmed) return [];
    // If the input is already an exact 10-digit code, don't show the popup unless picker was explicitly toggled
    if (exactMatchedCurrent && trimmed.length >= 10 && !isPickerOpen) return [];

    if (searchResult.exactTailMatches.length > 0) {
      return searchResult.exactTailMatches;
    }
    if (searchResult.suffixMatches.length > 0) {
      return searchResult.suffixMatches.slice(0, 8);
    }
    if (searchResult.allCandidates.length > 0) {
      return searchResult.allCandidates.slice(0, 8);
    }
    return [];
  }, [typedValue, exactMatchedCurrent, searchResult, isPickerOpen]);

  const popupCandidates = multipleCandidates.length > 0 ? multipleCandidates : liveCandidates;

  const showPopup = (isPickerOpen || (isFocused && typedValue.trim().length >= 1 && !exactMatchedCurrent)) && popupCandidates.length > 0;

  // Select an item from popup or lookup
  const handleSelectItem = (selected: DbItem) => {
    setTypedValue(selected.item_code);
    setIsPickerOpen(false);
    setIsFocused(false);
    setMultipleCandidates([]);
    setJustResolvedItem(selected);
    onChange(selected.item_code, selected);
    if (onSelectDescription) {
      onSelectDescription(selected.description, selected);
    }
    setTimeout(() => {
      setJustResolvedItem(null);
    }, 3500);
  };

  // Perform Enter resolution
  const handleTriggerResolution = () => {
    const trimmed = typedValue.trim();
    if (!trimmed) return;

    const resolution = resolveItemCodeOnEnter(trimmed, activeCatalog);

    if (resolution.type === 'single') {
      handleSelectItem(resolution.item);
    } else if (resolution.type === 'multiple') {
      setMultipleCandidates(resolution.candidates);
      setHighlightedIndex(0);
      setIsPickerOpen(true);
    } else {
      if (searchResult.allCandidates.length > 0) {
        setMultipleCandidates(searchResult.allCandidates.slice(0, 8));
        setHighlightedIndex(0);
        setIsPickerOpen(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (popupCandidates.length > 0) {
        const itemToPick = popupCandidates[highlightedIndex] || popupCandidates[0];
        handleSelectItem(itemToPick);
      } else {
        handleTriggerResolution();
      }
    } else if (e.key === 'ArrowDown') {
      if (popupCandidates.length > 0) {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % popupCandidates.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (popupCandidates.length > 0) {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + popupCandidates.length) % popupCandidates.length);
      }
    } else if (e.key === 'Escape') {
      setIsPickerOpen(false);
      setIsFocused(false);
    }
  };

  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  // Position popup right under input in screen coordinates (unclipped by any overflow:hidden)
  useEffect(() => {
    if (showPopup && inputRef.current) {
      const updatePosition = () => {
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setCoords({
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 320),
          });
        }
      };
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [showPopup]);

  // Unified handler for all input events (user typing, pasting, and browser autofill history clicks)
  const handleInputChange = (raw: string) => {
    setTypedValue(raw);
    setHighlightedIndex(0);

    const trimmed = raw.trim();
    if (!trimmed) {
      setIsPickerOpen(false);
      setMultipleCandidates([]);
      onChange(raw);
      return;
    }

    // Immediately check if this input corresponds to any item in activeCatalog:
    // 1) Direct exact code match (e.g. "3000000559" from browser autofill)
    // 2) Suffix / short code resolution (e.g. "559" -> "3000000559")
    // 3) General lookup via lookupDatabaseItem
    const matched = lookupDatabaseItem(trimmed, activeCatalog, contextHint);

    if (matched) {
      const isExactCode = trimmed.toLowerCase() === matched.item_code.toLowerCase();
      const isFullLength = trimmed.length >= 10;
      const isShortTail = trimmed === parseItemCode(matched.item_code).tail;

      if (isExactCode || isFullLength || isShortTail) {
        // Full resolution (browser autofill history click, paste, exact code, or short code tail)
        onChange(matched.item_code, matched);
        if (onSelectDescription) {
          onSelectDescription(matched.description, matched);
        }
        setJustResolvedItem(matched);
        setIsPickerOpen(false);
        setMultipleCandidates([]);
      } else {
        // User typed partial code
        onChange(raw, matched);
        if (onSelectDescription) {
          onSelectDescription(matched.description, matched);
        }
      }
    } else {
      onChange(raw);
    }
  };

  const handleBlur = () => {
    const trimmed = typedValue.trim();
    if (trimmed) {
      const matched = lookupDatabaseItem(trimmed, activeCatalog, contextHint);
      if (matched) {
        setTypedValue(matched.item_code);
        onChange(matched.item_code, matched);
        if (onSelectDescription) {
          onSelectDescription(matched.description, matched);
        }
        setJustResolvedItem(matched);
      }
    }
    // Small timeout so onMouseDown clicks on popup options register
    setTimeout(() => setIsFocused(false), 200);
  };

  // Browser autofill cache/history detector for native input filling
  useEffect(() => {
    const inputNode = inputRef.current;
    if (!inputNode) return;

    const onNativeChange = () => {
      const currentVal = inputNode.value;
      if (currentVal && currentVal !== typedValue) {
        handleInputChange(currentVal);
      }
    };

    inputNode.addEventListener('change', onNativeChange);
    inputNode.addEventListener('input', onNativeChange);

    // Staggered timers to catch delayed browser autofill injections
    const t1 = setTimeout(onNativeChange, 120);
    const t2 = setTimeout(onNativeChange, 350);

    return () => {
      inputNode.removeEventListener('change', onNativeChange);
      inputNode.removeEventListener('input', onNativeChange);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [typedValue, activeCatalog, contextHint]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          id={id}
          disabled={disabled}
          autoFocus={autoFocus}
          value={typedValue}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChange={(e) => handleInputChange(e.target.value)}
          onInput={(e: React.FormEvent<HTMLInputElement>) => {
            const targetVal = (e.target as HTMLInputElement).value;
            if (targetVal !== typedValue) {
              handleInputChange(targetVal);
            }
          }}
          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
            const pasted = e.clipboardData.getData('text');
            if (pasted) {
              handleInputChange(pasted);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className || `w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 pr-14 shadow-2xs transition`}
        />

        {/* Right Action Icons */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {typedValue.trim() && (
            <button
              type="button"
              onClick={handleTriggerResolution}
              title="Enter to auto-fill"
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer flex items-center justify-center shadow-2xs"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {activeCatalog.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (isPickerOpen) {
                  setIsPickerOpen(false);
                } else {
                  const candidates = searchResult.allCandidates.length > 0 
                    ? searchResult.allCandidates.slice(0, 10) 
                    : activeCatalog.slice(0, 10);
                  setMultipleCandidates(candidates);
                  setHighlightedIndex(0);
                  setIsPickerOpen(true);
                }
              }}
              title={`Browse item codes (${activeCatalog.length} available)`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPickerOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Verified Item Indicator */}
      {exactMatchedCurrent && (
        <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-in fade-in">
          <span className="truncate flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            <strong className="font-mono">{exactMatchedCurrent.item_code}</strong>
            <span className="text-slate-500 truncate">• {exactMatchedCurrent.description}</span>
          </span>
          <span className="text-[9px] text-emerald-700 font-bold bg-white px-1.5 py-0.2 rounded border border-emerald-100 shrink-0">
            {exactMatchedCurrent.series || 'Verified'}
          </span>
        </div>
      )}

      {/* SMALL POPUP RENDERED VIA PORTAL TO BODY - MINIMAL GRAY-BLACK THEME */}
      {showPopup && coords && typeof document !== 'undefined' && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 99999,
          }}
          className="bg-zinc-950 text-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 font-sans"
        >
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-900 p-1">
            {popupCandidates.map((cand, idx) => {
              const isSelected = idx === highlightedIndex;

              return (
                <div
                  key={cand.item_code}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectItem(cand);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3 py-2 rounded-lg cursor-pointer transition flex flex-col gap-0.5 ${
                    isSelected 
                      ? 'bg-zinc-800 text-white' 
                      : 'hover:bg-zinc-900 text-zinc-200'
                  }`}
                >
                  {/* Full Item Code */}
                  <span className="font-mono text-xs font-black tracking-wider text-white">
                    {cand.item_code}
                  </span>

                  {/* Item Name / Description */}
                  <span className="text-xs font-medium text-zinc-300 truncate" title={cand.description}>
                    {cand.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
