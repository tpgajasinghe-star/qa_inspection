import { supabase, isSupabaseConfigured } from './supabase';
import { 
  DeployedInspectionForm, 
  LOCAL_STORAGE_DEPLOYED_FORMS_KEY, 
  LOCAL_STORAGE_DELETED_DEPLOYED_FORMS_KEY,
  DEPLOYED_FORMS_UPDATED_EVENT,
  getStoredDeployedForms,
  getDeletedDeployedFormIds
} from '../deployedFormsData';
import { InspectionFormCardData } from '../components/FormCardsGallery';
import { 
  LOCAL_STORAGE_FORMS_KEY, 
  LOCAL_STORAGE_DELETED_TEMPLATES_KEY,
  getDeletedTemplateIds 
} from '../components/FormEditorStudio';

export const CLOUD_DEPLOYED_STATE_KEY = '__SYSTEM_DEPLOYED_FORMS_STATE__';
export const CLOUD_TEMPLATES_STATE_KEY = '__SYSTEM_TEMPLATES_STATE__';
export const TEMPLATES_UPDATED_EVENT = 'inspection_templates_updated';

// Helper timestamp tracker to avoid echo-loops
let lastLocalDeployedPushTime = 0;
let lastLocalTemplatesPushTime = 0;

/**
 * Pushes the latest deployed forms & deleted form IDs to Supabase.
 * Any computer connected to the system will immediately receive this state.
 */
export async function syncDeployedFormsToCloud(
  forms: DeployedInspectionForm[],
  deletedIds: string[]
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const timestamp = new Date().toISOString();
    lastLocalDeployedPushTime = Date.now();

    const payload = {
      item_code: CLOUD_DEPLOYED_STATE_KEY,
      inspector_name: 'CLOUD_DEPLOYED_REGISTRY',
      form_data: {
        deployedForms: forms,
        deletedIds: deletedIds,
        updatedAt: timestamp,
        clientTimestamp: lastLocalDeployedPushTime,
      },
      attachments: [],
    };

    // First check if an existing record exists to update it, or insert
    const { data: existing } = await supabase
      .from('inspections')
      .select('id')
      .eq('item_code', CLOUD_DEPLOYED_STATE_KEY)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from('inspections')
        .update(payload)
        .eq('id', existing[0].id);
    } else {
      await supabase.from('inspections').insert(payload);
    }
  } catch (err) {
    console.warn('[formsSyncService] Failed to push deployed forms to cloud:', err);
  }
}

/**
 * Pushes the latest Form Directory templates & deleted template IDs to Supabase.
 */
export async function syncTemplatesToCloud(
  templates: InspectionFormCardData[],
  deletedIds: string[]
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const timestamp = new Date().toISOString();
    lastLocalTemplatesPushTime = Date.now();

    const payload = {
      item_code: CLOUD_TEMPLATES_STATE_KEY,
      inspector_name: 'CLOUD_TEMPLATES_REGISTRY',
      form_data: {
        templates: templates,
        deletedIds: deletedIds,
        updatedAt: timestamp,
        clientTimestamp: lastLocalTemplatesPushTime,
      },
      attachments: [],
    };

    const { data: existing } = await supabase
      .from('inspections')
      .select('id')
      .eq('item_code', CLOUD_TEMPLATES_STATE_KEY)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from('inspections')
        .update(payload)
        .eq('id', existing[0].id);
    } else {
      await supabase.from('inspections').insert(payload);
    }
  } catch (err) {
    console.warn('[formsSyncService] Failed to push templates to cloud:', err);
  }
}

/**
 * Pulls the latest deployed forms from Supabase and applies them locally if newer.
 */
export async function pullDeployedFormsFromCloud(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { data, error } = await supabase
      .from('inspections')
      .select('id, form_data, created_at')
      .eq('item_code', CLOUD_DEPLOYED_STATE_KEY)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return false;

    const cloudData = data[0].form_data as {
      deployedForms?: DeployedInspectionForm[];
      deletedIds?: string[];
      updatedAt?: string;
      clientTimestamp?: number;
    };

    if (!cloudData) return false;

    // Skip if this change originated from this exact client within last 1.5 seconds
    if (cloudData.clientTimestamp && Math.abs(Date.now() - cloudData.clientTimestamp) < 1500) {
      return false;
    }

    // Merge cloud deleted IDs with local deleted IDs so deletions are cumulative across machines
    const localDeleted = getDeletedDeployedFormIds();
    const mergedDeleted = Array.from(new Set([...localDeleted, ...(cloudData.deletedIds || [])]));
    localStorage.setItem(LOCAL_STORAGE_DELETED_DEPLOYED_FORMS_KEY, JSON.stringify(mergedDeleted));

    if (Array.isArray(cloudData.deployedForms)) {
      const deletedSet = new Set(mergedDeleted);
      const validForms = cloudData.deployedForms.filter(f => {
        if (deletedSet.has(f.id)) return false;
        if (f.sourceFormId && deletedSet.has(f.sourceFormId)) return false;
        if (f.sourceFormId && f.targetChildCardId && deletedSet.has(`deleted-source-${f.sourceFormId}-${f.targetChildCardId}`)) return false;
        return true;
      });
      localStorage.setItem(LOCAL_STORAGE_DEPLOYED_FORMS_KEY, JSON.stringify(validForms));
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(DEPLOYED_FORMS_UPDATED_EVENT, { detail: validForms }));
      }
      return true;
    }
  } catch (err) {
    console.warn('[formsSyncService] Error pulling deployed forms from cloud:', err);
  }
  return false;
}

/**
 * Pulls the latest Form Directory templates from Supabase and applies them locally.
 */
export async function pullTemplatesFromCloud(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { data, error } = await supabase
      .from('inspections')
      .select('id, form_data, created_at')
      .eq('item_code', CLOUD_TEMPLATES_STATE_KEY)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return false;

    const cloudData = data[0].form_data as {
      templates?: InspectionFormCardData[];
      deletedIds?: string[];
      updatedAt?: string;
      clientTimestamp?: number;
    };

    if (!cloudData) return false;

    if (cloudData.clientTimestamp && Math.abs(Date.now() - cloudData.clientTimestamp) < 1500) {
      return false;
    }

    const localDeleted = getDeletedTemplateIds();
    const mergedDeleted = Array.from(new Set([...localDeleted, ...(cloudData.deletedIds || [])]));
    localStorage.setItem(LOCAL_STORAGE_DELETED_TEMPLATES_KEY, JSON.stringify(mergedDeleted));

    if (Array.isArray(cloudData.templates)) {
      const deletedSet = new Set(mergedDeleted);
      const validTemplates = cloudData.templates.filter(t => !deletedSet.has(t.id) && (!t.name || !deletedSet.has(t.name)));
      localStorage.setItem(LOCAL_STORAGE_FORMS_KEY, JSON.stringify(validTemplates));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(TEMPLATES_UPDATED_EVENT, { detail: validTemplates }));
      }
      return true;
    }
  } catch (err) {
    console.warn('[formsSyncService] Error pulling templates from cloud:', err);
  }
  return false;
}

/**
 * Initializes continuous Cloud Realtime and background sync for forms across all computers.
 */
export function initFormsCloudSync(): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  // 1. Initial Pull on startup:
  pullDeployedFormsFromCloud();
  pullTemplatesFromCloud();

  // If this is the very first time ever and cloud has no record yet, push local defaults
  setTimeout(async () => {
    try {
      const { data: depCheck } = await supabase
        .from('inspections')
        .select('id')
        .eq('item_code', CLOUD_DEPLOYED_STATE_KEY)
        .limit(1);

      if (!depCheck || depCheck.length === 0) {
        const localDeployed = getStoredDeployedForms();
        const localDeleted = getDeletedDeployedFormIds();
        syncDeployedFormsToCloud(localDeployed, localDeleted);
      }
    } catch {}
  }, 1000);

  // 2. Realtime WebSocket Channel
  const channel = supabase.channel('cloud_forms_state_sync');

  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, payload => {
    const row = payload.new as any;
    if (!row) return;

    if (row.item_code === CLOUD_DEPLOYED_STATE_KEY) {
      const formData = row.form_data;
      if (formData?.clientTimestamp && Math.abs(Date.now() - formData.clientTimestamp) < 1500) {
        return;
      }
      pullDeployedFormsFromCloud();
    } else if (row.item_code === CLOUD_TEMPLATES_STATE_KEY) {
      const formData = row.form_data;
      if (formData?.clientTimestamp && Math.abs(Date.now() - formData.clientTimestamp) < 1500) {
        return;
      }
      pullTemplatesFromCloud();
    }
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[formsSyncService] Realtime sync subscribed successfully');
    }
  });

  // 3. Tab visibility listener: when inspector focuses window/tab on any computer, re-pull
  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      pullDeployedFormsFromCloud();
      pullTemplatesFromCloud();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // 4. Background heartbeat poll (every 15 seconds) to ensure 100% reliability
  const intervalId = setInterval(() => {
    pullDeployedFormsFromCloud();
    pullTemplatesFromCloud();
  }, 15000);

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    clearInterval(intervalId);
  };
}
