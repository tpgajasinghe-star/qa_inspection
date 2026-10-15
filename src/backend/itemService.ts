import { supabase } from './supabase';

export interface DbItem {
  item_code: string;
  description: string;
  series?: string | null;
  category?: string | null;
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
  { item_code: '3000018402', description: 'Kevilton 9W High-Lumen LED Bulb', series: 'LED', category: 'Kevilton LED' },
];

const LOCAL_STORAGE_DB_ITEMS_KEY = 'qc_supabase_cached_items_v2';

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

    // Query Supabase items table in real-time
    const { data, error } = await supabase
      .from('items')
      .select('item_code, description, series, category')
      .order('item_code', { ascending: true });

    if (error) {
      console.warn('Supabase fetch error, using fallback catalog:', error);
      return initialList;
    }

    if (data && data.length > 0) {
      const mergedMap = new Map<string, DbItem>();
      // First put seeds
      SEED_FACTORY_ITEMS.forEach(it => mergedMap.set(it.item_code, it));
      // Overwrite with live Supabase data
      (data as DbItem[]).forEach(it => mergedMap.set(it.item_code, it));
      const finalList = Array.from(mergedMap.values());
      localStorage.setItem(LOCAL_STORAGE_DB_ITEMS_KEY, JSON.stringify(finalList));
      return finalList;
    }

    return initialList;
  } catch (err) {
    console.warn('Unexpected error in fetchItems, using fallback catalog:', err);
    return SEED_FACTORY_ITEMS;
  }
}

/**
 * Intelligent Item Code lookup against the database catalog:
 * - Entering "559" -> resolves directly to "3000000559" ("MSFZ 13- 13A S/Socket Outlet -Wh. Series")
 * - Entering "3000000559" -> exact match
 * - Entering any numeric suffix (e.g. 537, 538, 550, 563) -> maps to corresponding 3000000XXX code
 */
export function lookupDatabaseItem(
  rawInput: string,
  itemsList: DbItem[],
  contextHint?: string
): DbItem | null {
  const trimmed = rawInput.trim();
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
