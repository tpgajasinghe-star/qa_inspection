import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

export interface InspectionCoreData {
  item_code: string;
  inspector_name: string;
}

export interface InspectionRecordResponse {
  id: string;
  item_code: string;
  inspector_name: string;
  form_data: Record<string, any>;
  attachments: string[];
  created_at?: string;
}

/**
 * Submits an inspection record to Supabase:
 * 1. Compresses all provided imageFiles via browser-image-compression
 * 2. Uploads compressed files to 'inspections-attachments' storage bucket
 * 3. Retrieves public URLs for the uploaded images
 * 4. Inserts a single record into the 'inspections' table with coreData, dynamicFormData (jsonb), and attachments array
 */
export async function submitInspection(
  coreData: InspectionCoreData,
  dynamicFormData: Record<string, any>,
  imageFiles: File[] = []
): Promise<{ success: boolean; data: any; publicUrls: string[] }> {
  console.log('[inspectionService] Starting inspection submission:', {
    coreData,
    fieldsCount: Object.keys(dynamicFormData).length,
    attachmentsCount: imageFiles.length,
  });

  const publicUrls: string[] = [];

  // 1. Image Handling & Compression + Storage Upload
  if (imageFiles && imageFiles.length > 0) {
    const compressionOptions = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        console.log(`[inspectionService] Processing file ${i + 1}/${imageFiles.length}:`, file.name, `(${(file.size / 1024).toFixed(1)} KB)`);
        
        let fileToUpload: File = file;
        // Apply compression for image file types
        if (file.type.startsWith('image/')) {
          try {
            fileToUpload = await imageCompression(file, compressionOptions);
            console.log(`[inspectionService] Compressed ${file.name}: ${(file.size / 1024).toFixed(1)} KB -> ${(fileToUpload.size / 1024).toFixed(1)} KB`);
          } catch (compErr) {
            console.warn(`[inspectionService] Compression skipped/failed for ${file.name}, using original:`, compErr);
            fileToUpload = file;
          }
        }

        // Generate sanitized unique file name
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('inspections-attachments')
          .upload(uniqueFileName, fileToUpload, {
            contentType: file.type || 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadErr) {
          console.error('[inspectionService] Storage upload error for file:', file.name, uploadErr);
          throw new Error(`Failed to upload attachment ${file.name}: ${uploadErr.message}`);
        }

        // Get public URL of the uploaded image
        const { data: urlData } = supabase.storage
          .from('inspections-attachments')
          .getPublicUrl(uniqueFileName);

        if (urlData?.publicUrl) {
          publicUrls.push(urlData.publicUrl);
          console.log('[inspectionService] Attachment uploaded successfully:', urlData.publicUrl);
        }
      } catch (fileErr: any) {
        console.error('[inspectionService] Error processing image file:', file.name, fileErr);
        throw fileErr;
      }
    }
  }

  // 2. Database Insert into 'inspections' table
  // Columns: id (uuid PK), item_code (text), inspector_name (text), form_data (jsonb), attachments (text[])
  const payload = {
    item_code: coreData.item_code.trim() || 'N/A',
    inspector_name: coreData.inspector_name.trim() || 'QC Inspector',
    form_data: dynamicFormData,
    attachments: publicUrls,
  };

  console.log('[inspectionService] Inserting record into inspections table:', {
    item_code: payload.item_code,
    inspector_name: payload.inspector_name,
    attachmentsCount: payload.attachments.length,
  });

  const { data: insertedData, error: insertError } = await supabase
    .from('inspections')
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.error('[inspectionService] Error inserting inspection record:', insertError);
    throw new Error(`Database error: ${insertError.message}`);
  }

  console.log('[inspectionService] Inspection record successfully saved with ID:', insertedData?.id);

  // Immediate UI Sync: Cache locally and broadcast custom event
  if (typeof window !== 'undefined' && insertedData) {
    try {
      const recentKey = 'qc_recent_submissions';
      const existingStr = localStorage.getItem(recentKey);
      const existing: any[] = existingStr ? JSON.parse(existingStr) : [];
      const itemToSave = {
        id: String(insertedData.id),
        item_code: String(insertedData.item_code || coreData.item_code),
        inspector_name: String(insertedData.inspector_name || coreData.inspector_name),
        created_at: insertedData.created_at || dynamicFormData.submittedAt || new Date().toISOString(),
        form_data: insertedData.form_data || dynamicFormData,
        attachments: insertedData.attachments || publicUrls,
      };
      const updated = [itemToSave, ...existing.filter((x: any) => x.id !== insertedData.id)].slice(0, 50);
      localStorage.setItem(recentKey, JSON.stringify(updated));

      window.dispatchEvent(new CustomEvent('inspection-submitted', { 
        detail: itemToSave
      }));
    } catch (e) {
      console.warn('[inspectionService] Failed to cache/dispatch inspection-submitted event:', e);
    }
  }

  return {
    success: true,
    data: insertedData,
    publicUrls,
  };
}

export interface InspectionSummary {
  id: string;
  item_code: string;
  inspector_name: string;
  created_at: string;
  child_card_name?: string;
  product_desc?: string;
  lot_number?: string;
  batch_id?: string;
  status?: string;
}

/**
 * Lightweight Summary Fetch (Lazy Loading)
 * Robust fetch that handles schemas with or without created_at,
 * merges local recently submitted cache, and safely formats records.
 */
export async function getInspectionSummaries(itemCode?: string): Promise<InspectionSummary[]> {
  try {
    let rawRows: any[] = [];

    // 1. Query Supabase
    try {
      let query = supabase.from('inspections').select('*');
      if (itemCode && itemCode.trim() && itemCode !== 'all') {
        query = query.eq('item_code', itemCode.trim());
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        rawRows = data;
      } else if (error) {
        console.warn('[inspectionService] getInspectionSummaries remote query error:', error.message);
      }
    } catch (dbErr) {
      console.warn('[inspectionService] Remote query exception:', dbErr);
    }

    // 2. Also merge recently submitted records from localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const cachedStr = localStorage.getItem('qc_recent_submissions');
        if (cachedStr) {
          const cached: any[] = JSON.parse(cachedStr);
          const existingIds = new Set(rawRows.map(r => String(r.id)));
          cached.forEach(c => {
            if (!existingIds.has(String(c.id))) {
              if (!itemCode || itemCode === 'all' || String(c.item_code).trim() === itemCode.trim()) {
                rawRows.unshift(c);
              }
            }
          });
        }
      } catch (cacheErr) {
        console.warn('[inspectionService] Cache read error:', cacheErr);
      }
    }

    // 3. Sort by created_at or submittedAt descending
    rawRows.sort((a, b) => {
      const timeA = new Date(a.created_at || a.form_data?.submittedAt || a.form_data?.auditMetadata?.auditDate || 0).getTime();
      const timeB = new Date(b.created_at || b.form_data?.submittedAt || b.form_data?.auditMetadata?.auditDate || 0).getTime();
      return timeB - timeA;
    });

    // 4. Safely map to InspectionSummary format with complete null-checks
    return rawRows.map((row: any) => {
      const createdAt = 
        row.created_at || 
        row.form_data?.submittedAt || 
        row.form_data?.auditMetadata?.auditDate || 
        new Date().toISOString();

      return {
        id: String(row.id || ''),
        item_code: String(row.item_code || row.form_data?.auditMetadata?.itemCode || 'N/A'),
        inspector_name: String(row.inspector_name || row.form_data?.auditMetadata?.onlineInspectorName || 'Certified QC Inspector'),
        created_at: String(createdAt),
        child_card_name: String(row.form_data?.hierarchy?.childCardName || row.form_data?.childCardName || ''),
        product_desc: String(row.form_data?.auditMetadata?.productDescription || row.form_data?.documentHeader?.productType || ''),
        lot_number: String(row.form_data?.auditMetadata?.lotNumber || ''),
        batch_id: String(row.form_data?.auditMetadata?.batchId || ''),
        status: String(row.form_data?.status || (row.form_data?.hasFailures ? 'fail' : 'pass')),
      };
    });
  } catch (err) {
    console.warn('[inspectionService] getInspectionSummaries fallback exception:', err);
    return [];
  }
}

/**
 * On-Demand Full Data Fetch
 * When a user clicks on a specific past record card, execute this function to
 * fetch the complete row (including form_data and attachments) from the database or local cache.
 */
export async function getInspectionDetails(id: string): Promise<InspectionRecordResponse | null> {
  try {
    console.log('[inspectionService] Fetching full details on-demand for record ID:', id);

    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return {
          id: String(data.id),
          item_code: String(data.item_code || 'N/A'),
          inspector_name: String(data.inspector_name || 'QC Inspector'),
          form_data: data.form_data || {},
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
          created_at: data.created_at || data.form_data?.submittedAt || new Date().toISOString(),
        };
      }
    } catch (dbErr) {
      console.warn('[inspectionService] Supabase getInspectionDetails query failed:', dbErr);
    }

    // 2. Check local recent cache
    if (typeof window !== 'undefined') {
      try {
        const cachedStr = localStorage.getItem('qc_recent_submissions');
        if (cachedStr) {
          const cached: any[] = JSON.parse(cachedStr);
          const match = cached.find((c: any) => String(c.id) === String(id));
          if (match) {
            return match;
          }
        }
      } catch (cacheErr) {
        console.warn('[inspectionService] Cache read error for details:', cacheErr);
      }
    }

    return null;
  } catch (err) {
    console.error('[inspectionService] Error in getInspectionDetails:', err);
    throw err;
  }
}

/**
 * Optional helper to fetch historical inspections from the inspections table
 */
export async function fetchInspections(): Promise<InspectionRecordResponse[]> {
  const { data, error } = await supabase
    .from('inspections')
    .select('*');

  if (error) {
    console.warn('[inspectionService] Failed to fetch inspections:', error);
    return [];
  }

  return (data || []) as InspectionRecordResponse[];
}

