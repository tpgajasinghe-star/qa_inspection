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

  // Immediate UI Sync: Broadcast custom event so active UI components instantly prepend this record
  if (typeof window !== 'undefined' && insertedData) {
    try {
      window.dispatchEvent(new CustomEvent('inspection-submitted', { 
        detail: {
          id: insertedData.id,
          item_code: insertedData.item_code,
          inspector_name: insertedData.inspector_name,
          created_at: insertedData.created_at || new Date().toISOString(),
          form_data: insertedData.form_data,
          attachments: insertedData.attachments || [],
        } 
      }));
    } catch (e) {
      console.warn('[inspectionService] Failed to dispatch inspection-submitted event:', e);
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
}

/**
 * Lightweight Summary Fetch (Lazy Loading)
 * ONLY selects id, item_code, inspector_name, and created_at from the inspections table.
 * Does NOT fetch the heavy form_data or attachments initially.
 */
export async function getInspectionSummaries(itemCode?: string): Promise<InspectionSummary[]> {
  try {
    let query = supabase
      .from('inspections')
      .select('id, item_code, inspector_name, created_at')
      .order('created_at', { ascending: false });

    if (itemCode && itemCode.trim() && itemCode !== 'all') {
      query = query.eq('item_code', itemCode.trim());
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[inspectionService] getInspectionSummaries error:', error.message);
      return [];
    }

    return (data || []) as InspectionSummary[];
  } catch (err) {
    console.warn('[inspectionService] getInspectionSummaries exception:', err);
    return [];
  }
}

/**
 * On-Demand Full Data Fetch
 * When a user clicks on a specific past record card, execute this function to
 * fetch the complete row (including form_data and attachments) from the database.
 */
export async function getInspectionDetails(id: string): Promise<InspectionRecordResponse | null> {
  try {
    console.log('[inspectionService] Fetching full details on-demand for record ID:', id);
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[inspectionService] getInspectionDetails error:', error);
      throw error;
    }

    return data as InspectionRecordResponse;
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
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[inspectionService] Failed to fetch inspections:', error);
    return [];
  }

  return (data || []) as InspectionRecordResponse[];
}

