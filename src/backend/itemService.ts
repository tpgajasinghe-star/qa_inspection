import { supabase } from './supabase';

export interface DbItem {
  item_code: string;
  description: string;
  series?: string | null;
  category?: string | null;
}

export async function fetchItems(): Promise<DbItem[]> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('item_code, description, series, category')
      .order('item_code', { ascending: true });

    if (error) {
      console.error('Error fetching items from Supabase:', error);
      return [];
    }

    return (data as DbItem[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching items:', err);
    return [];
  }
}
