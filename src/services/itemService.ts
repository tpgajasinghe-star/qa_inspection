import { supabase } from './supabase';

export interface DbItem {
  item_code: string;
  description: string;
  series?: string | null;
  category?: string | null;
  drawing_number?: string | null;
  department?: string | null;
}

// Fallback & fast seed database catalog containing verified factory items
export const SEED_FACTORY_ITEMS: DbItem[] = [
  { item_code: '3000000559', description: 'MSFZ 13- 13A S/Socket Outlet -Wh. Series', series: 'White Series', category: 'Sockets' },
  { item_code: '3000000537', description: 'Ms-10 1Gang One Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000538', description: 'Ms2-10 2 Gang One Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000539', description: 'Ms3-10 3 Gang One Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000540', description: 'Ms4-10 4 Gang One Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000541', description: 'Ms5-10 5 Gang One Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000542', description: 'Md10-1 Gang Two Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000543', description: 'Md2-10- Two Gang Two Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000544', description: 'Md3-10- Three Gang Two Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000545', description: 'Md4-10- Four Gang Two Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000546', description: 'Md5-10- Five Gang Two Way', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000547', description: 'Mp Bell Press', series: 'White Series', category: 'Bell' },
  { item_code: '3000000548', description: 'Mv - 75 Tv Socket', series: 'White Series', category: 'Video & Voice outlet' },
  { item_code: '3000000549', description: 'Mez - 4 Telephone Sock 04 Line', series: 'White Series', category: 'Video & Voice outlet' },
  { item_code: '3000000550', description: 'Blank Plate', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000551', description: 'Combine Tv & Tele. Socket W/S', series: 'White Series', category: 'Video & Voice outlet' },
  { item_code: '3000000552', description: 'Twin Tv Socket', series: 'White Series', category: 'Video & Voice outlet' },
  { item_code: '3000000554', description: 'Twin Telephone Socket', series: 'White Series', category: 'Video & Voice outlet' },
  { item_code: '3000000555', description: 'Mts 10 Tumbler Switch', series: 'White Series', category: 'Gang Switches' },
  { item_code: '3000000563', description: '13L 13Amp Socket W/N', series: 'White Series', category: 'Sockets' },
  { item_code: '3000000564', description: 'Light Dimmer With 1Gang-Msdl1', series: 'White Series', category: 'Controllers' },
  { item_code: '3000000566', description: 'Fan Control. With 1Gang -Msdf1', series: 'White Series', category: 'Controllers' },
  { item_code: '3000000568', description: 'Hum Free Fan Control. 4/5 Step', series: 'White Series', category: 'Controllers' },
  { item_code: '3000000569', description: 'Pendent Holder', series: 'Accessories', category: 'Holders' },
  { item_code: '3000000571', description: 'Single Sunk Box', series: 'Accessories', category: 'Sunk Boxes' },
  { item_code: '3000000572', description: 'Kv Junction Box', series: 'Accessories', category: 'Junction Box' },
  { item_code: '3000000573', description: 'Straight Batten Holder', series: 'Accessories', category: 'Holders' },
  { item_code: '3000000780', description: "10 A, 'L' Terminal (Brass / Copper Alloy)", series: 'Raw Material', category: 'Terminals' },
  { item_code: '3000018402', description: 'Kevilton 9W High-Lumen LED Bulb', series: 'LED', category: 'Kevilton LED' },
];

const LOCAL_STORAGE_DB_ITEMS_KEY = 'qc_supabase_cached_items_v3';

export async function fetchItems(): Promise<DbItem[]> {
  try {
    // Check localStorage cache first for immediate synchronous UI responsiveness
    const cached = localStorage.getItem(LOCAL_STORAGE_DB_ITEMS_KEY);
    let initialList: DbItem[] = SEED_FACTORY_ITEMS;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = parsed;
        }
      } catch (e) {
        // ignore parse error
      }
    }

    // Query all records from Supabase items table (all 779+ items) using range to ensure no cutoff
    const { data, error } = await supabase
      .from('items')
      .select('item_code, description, series, category')
      .order('item_code', { ascending: true })
      .range(0, 4999);

    if (error) {
      console.warn('[itemService] Supabase items fetch error, using cached/fallback catalog:', error);
      return initialList;
    }

    if (data && data.length > 0) {
      const mergedMap = new Map<string, DbItem>();
      // First seed fast catalog
      SEED_FACTORY_ITEMS.forEach(it => mergedMap.set(it.item_code, it));
      // Overwrite and populate with all live Supabase records
      (data as DbItem[]).forEach(it => mergedMap.set(it.item_code, it));
      const finalList = Array.from(mergedMap.values());
      console.log(`[itemService] Successfully fetched ${finalList.length} items from Supabase database.`);
      try {
        localStorage.setItem(LOCAL_STORAGE_DB_ITEMS_KEY, JSON.stringify(finalList));
      } catch (e) {
        console.warn('[itemService] Cache write quota:', e);
      }
      return finalList;
    }

    return initialList;
  } catch (err) {
    console.warn('[itemService] Unexpected error in fetchItems, using fallback catalog:', err);
    return SEED_FACTORY_ITEMS;
  }
}

export interface ItemCodeParts {
  fullCode: string;
  head: string;      // e.g. '3' or '4'
  zeros: string;     // e.g. '000000'
  tail: string;      // e.g. '559', '4559', '6471'
  tailLength: number;
}

/**
 * Extracts head series, middle zeros, and non-zero tail number from an item code:
 * - "3000000559" -> head: "3", zeros: "000000", tail: "559" (3 digits)
 * - "4000004559" -> head: "4", zeros: "00000", tail: "4559" (4 digits)
 * - "3000006471" -> head: "3", zeros: "00000", tail: "6471" (4 digits)
 * - "4000006471" -> head: "4", zeros: "00000", tail: "6471" (4 digits)
 */
export function parseItemCode(rawCode: string): ItemCodeParts {
  const code = (rawCode || '').trim();
  const match = code.match(/^([1-9])(0+)([1-9][0-9]*)$/);
  if (match) {
    return {
      fullCode: code,
      head: match[1],
      zeros: match[2],
      tail: match[3],
      tailLength: match[3].length,
    };
  }
  return {
    fullCode: code,
    head: code.charAt(0) || '',
    zeros: '',
    tail: code,
    tailLength: code.length,
  };
}

export interface ItemCandidateSearchResult {
  exactMatch: DbItem | null;
  exactTailMatches: DbItem[];
  suffixMatches: DbItem[];
  containsMatches: DbItem[];
  allCandidates: DbItem[];
  hasDifferentHeadsConflict: boolean;
}

/**
 * Searches for item code candidates matching a given input:
 * - If input is "559" (3 digits): exactly matches "3000000559" (tail 559, 3 digits).
 *   "4000004559" (tail 4559, 4 digits) is NOT an exact tail match.
 * - If input is "4559" (4 digits): exactly matches "4000004559".
 * - If input is "6471": matches both "3000006471" and "4000006471" (different heads 3 vs 4).
 */
export function findMatchingItemCandidates(
  rawInput: string,
  itemsList: DbItem[]
): ItemCandidateSearchResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      exactMatch: null,
      exactTailMatches: [],
      suffixMatches: [],
      containsMatches: [],
      allCandidates: [],
      hasDifferentHeadsConflict: false,
    };
  }

  const catalog = itemsList && itemsList.length > 0 ? itemsList : SEED_FACTORY_ITEMS;

  // 1. Exact match on full item_code
  const exactMatch = catalog.find(
    it => it.item_code.toLowerCase() === trimmed.toLowerCase()
  ) || null;

  // 2. Exact tail match (where non-zero tail length & value equals input, e.g. "559" === "559")
  const exactTailMatches = catalog.filter(it => {
    const parts = parseItemCode(it.item_code);
    return parts.tail.toLowerCase() === trimmed.toLowerCase();
  });

  // Check if different 1st head digits exist among exact tail matches
  const uniqueHeads = new Set(exactTailMatches.map(it => parseItemCode(it.item_code).head));
  const hasDifferentHeadsConflict = exactTailMatches.length > 1 && uniqueHeads.size > 1;

  // 3. General suffix matches that are not in exactTailMatches
  const suffixMatches = catalog.filter(it => {
    if (exactTailMatches.some(e => e.item_code === it.item_code)) return false;
    return it.item_code.endsWith(trimmed);
  });

  // 4. Substring / Description contains match
  const containsMatches = catalog.filter(it => {
    if (it.item_code === exactMatch?.item_code) return false;
    if (exactTailMatches.some(s => s.item_code === it.item_code)) return false;
    if (suffixMatches.some(s => s.item_code === it.item_code)) return false;
    return (
      it.item_code.includes(trimmed) ||
      (it.description || '').toLowerCase().includes(trimmed.toLowerCase())
    );
  });

  // Combine unique candidates in order of relevance: exact -> exact tail -> suffix -> contains
  const seen = new Set<string>();
  const allCandidates: DbItem[] = [];

  if (exactMatch) {
    allCandidates.push(exactMatch);
    seen.add(exactMatch.item_code);
  }

  exactTailMatches.forEach(it => {
    if (!seen.has(it.item_code)) {
      allCandidates.push(it);
      seen.add(it.item_code);
    }
  });

  suffixMatches.forEach(it => {
    if (!seen.has(it.item_code)) {
      allCandidates.push(it);
      seen.add(it.item_code);
    }
  });

  containsMatches.forEach(it => {
    if (!seen.has(it.item_code)) {
      allCandidates.push(it);
      seen.add(it.item_code);
    }
  });

  return {
    exactMatch,
    exactTailMatches,
    suffixMatches,
    containsMatches,
    allCandidates,
    hasDifferentHeadsConflict,
  };
}

export type ItemResolutionResult = 
  | { type: 'none' }
  | { type: 'single'; item: DbItem }
  | { type: 'multiple'; candidates: DbItem[]; isDifferentHeads: boolean };

/**
 * Resolves an item code when the user presses Enter or triggers lookup:
 * 1. If exact full code matches: returns 'single' directly.
 * 2. If exact tail matches (e.g. "559" -> 3000000559):
 *    - If exactly 1 match: returns 'single' directly (no popup/selection!).
 *    - If multiple matches with different heads (e.g. 3000006471 and 4000006471):
 *      returns 'multiple' with candidates and isDifferentHeads=true to trigger popup modal!
 * 3. Fallback to suffix / contains matches.
 */
export function resolveItemCodeOnEnter(
  rawInput: string,
  itemsList: DbItem[]
): ItemResolutionResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { type: 'none' };

  const { 
    exactMatch, 
    exactTailMatches, 
    suffixMatches, 
    containsMatches,
    hasDifferentHeadsConflict 
  } = findMatchingItemCandidates(trimmed, itemsList);

  // 1. Exact full 10-digit match
  if (exactMatch && exactMatch.item_code.toLowerCase() === trimmed.toLowerCase()) {
    return { type: 'single', item: exactMatch };
  }

  // 2. Exact tail match (e.g. "559" matches 3000000559, NOT 4000004559)
  if (exactTailMatches.length === 1) {
    return { type: 'single', item: exactTailMatches[0] };
  }

  if (exactTailMatches.length > 1) {
    return { 
      type: 'multiple', 
      candidates: exactTailMatches, 
      isDifferentHeads: hasDifferentHeadsConflict 
    };
  }

  // 3. Fallback suffix match (e.g. partial tail)
  if (suffixMatches.length === 1) {
    return { type: 'single', item: suffixMatches[0] };
  }

  if (suffixMatches.length > 1) {
    const uniqueHeads = new Set(suffixMatches.map(it => parseItemCode(it.item_code).head));
    return { 
      type: 'multiple', 
      candidates: suffixMatches, 
      isDifferentHeads: uniqueHeads.size > 1 
    };
  }

  // 4. Fallback contains match
  if (containsMatches.length === 1) {
    return { type: 'single', item: containsMatches[0] };
  }

  if (containsMatches.length > 1) {
    return { 
      type: 'multiple', 
      candidates: containsMatches.slice(0, 10), 
      isDifferentHeads: false 
    };
  }

  return { type: 'none' };
}

/**
 * Intelligent Item Code lookup against the database catalog:
 * - Entering "559" -> resolves directly to "3000000559" ("MSFZ 13- 13A S/Socket Outlet -Wh. Series")
 * - Entering "3000000559" -> exact match
 * - Entering any numeric suffix (e.g. 537, 538, 550, 563) -> maps to corresponding 3000000XXX code
 */
export function lookupDatabaseItem(
  rawInput?: string | null,
  itemsList?: DbItem[],
  contextHint?: string
): DbItem | null {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return null;

  const catalog = itemsList && itemsList.length > 0 ? itemsList : SEED_FACTORY_ITEMS;

  // 1. Exact match on item_code (case-insensitive)
  const exact = catalog.find(it => it.item_code.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  // 2. Direct 10-digit pad if numeric short code (e.g. "559" -> "3000000559")
  if (/^\d+$/.test(trimmed)) {
    if (trimmed.length <= 4) {
      const paddedCode = `3000000${trimmed.padStart(3, '0')}`;
      const foundPadded = catalog.find(it => it.item_code === paddedCode);
      if (foundPadded) return foundPadded;
    }

    // Direct match if padded with zeros to 10 digits
    const padded10 = trimmed.padStart(10, '0');
    const found10 = catalog.find(it => it.item_code === padded10);
    if (found10) return found10;
  }

  // 3. Suffix match: ends with input digits (e.g. ends with "559")
  const suffixCandidates = catalog.filter(it => it.item_code.endsWith(trimmed));
  if (suffixCandidates.length > 0) {
    if (contextHint) {
      const hint = contextHint.toLowerCase();
      const contextual = suffixCandidates.find(it => {
        const s = (it.series || '').toLowerCase();
        const c = (it.category || '').toLowerCase();
        return s.includes(hint) || c.includes(hint) || (hint.includes('white') && s.includes('white'));
      });
      if (contextual) return contextual;
    }
    return suffixCandidates[0];
  }

  // 4. Substring contains match on item code
  const containsCandidates = catalog.filter(it => it.item_code.includes(trimmed));
  if (containsCandidates.length > 0) {
    return containsCandidates[0];
  }

  return null;
}
