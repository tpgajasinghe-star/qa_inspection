import { supabaseAdmin } from './supabase';
import { UserProfile, ProfileRole } from '../types';

// Real database-driven profiles storage key
const PROFILES_STORAGE_KEY = 'qc_supabase_profiles_cache_v2';
const PASSWORDS_VAULT_KEY = 'qc_user_passwords_vault_v1';

// Zero dummy/mock data - all data must strictly originate from Supabase
const DEFAULT_CACHED_PROFILES: UserProfile[] = [];

export const storeUserPassword = (identifier: string, pwd: string): void => {
  if (typeof window === 'undefined' || !window.localStorage || !pwd || !identifier) return;
  try {
    const raw = localStorage.getItem(PASSWORDS_VAULT_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[identifier.toLowerCase().trim()] = pwd;
    localStorage.setItem(PASSWORDS_VAULT_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[adminUserService] Failed to store password in vault:', e);
  }
};

export const getStoredUserPassword = (identifier?: string): string | null => {
  if (typeof window === 'undefined' || !window.localStorage || !identifier) return null;
  try {
    const raw = localStorage.getItem(PASSWORDS_VAULT_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[identifier.toLowerCase().trim()] || null;
  } catch {
    return null;
  }
};

// Local cache helpers with strict legacy mock data cleanup
const getCachedProfiles = (): UserProfile[] => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    // Purge old v1 cache key if present
    localStorage.removeItem('qc_supabase_profiles_cache_v1');

    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip any residual dummy accounts
        return parsed.filter(
          p =>
            p.id !== 'seed-super-admin-01' &&
            p.id !== 'seed-admin-02' &&
            p.id !== 'seed-user-03' &&
            p.id !== 'seed-user-04' &&
            p.employee_id !== 'AD-1004' &&
            p.employee_id !== 'QA-8941' &&
            p.employee_id !== 'QA-7720'
        );
      }
    }
  } catch (e) {
    console.warn('[adminUserService] Failed to read profiles from localStorage:', e);
  }
  return [];
};

const setCachedProfiles = (profiles: UserProfile[]) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const cleanProfiles = profiles.filter(
      p =>
        p.id !== 'seed-admin-02' &&
        p.id !== 'seed-user-03' &&
        p.id !== 'seed-user-04' &&
        p.employee_id !== 'AD-1004' &&
        p.employee_id !== 'QA-8941' &&
        p.employee_id !== 'QA-7720'
    );
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(cleanProfiles));
  } catch (e) {
    console.warn('[adminUserService] Failed to write profiles to localStorage:', e);
  }
};

/**
 * Super Admin Seeding:
 * Checks if 'admin@abc.com' exists in Auth.
 * If not, creates it using supabaseAdmin.auth.admin.createUser({ email: 'admin@abc.com', password: 'admingamana', email_confirm: true })
 * and inserts/upserts a record into the profiles table with employee_id: 'admin', full_name: 'System Admin', and role: 'SUPER_ADMIN'.
 */
export async function seedSuperAdmin(): Promise<{
  success: boolean;
  message: string;
  user?: any;
}> {
  const targetEmail = 'admin@abc.com';
  const targetPassword = 'admingamana';
  const targetEmployeeId = 'admin';
  const targetFullName = 'System Admin';
  const targetRole: ProfileRole = 'SUPER_ADMIN';

  console.log('[adminUserService:seedSuperAdmin] Verifying Super Admin in database...');

  try {
    let authUser: any = null;

    // 1. Check if 'admin@abc.com' exists in Auth via supabaseAdmin
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('[adminUserService:seedSuperAdmin] Error listing users from Auth:', listError.message);
    } else if (listData && Array.isArray((listData as any).users)) {
      authUser = (listData as any).users.find((u: any) => u.email?.toLowerCase() === targetEmail.toLowerCase());
      if (authUser) {
        console.log('[adminUserService:seedSuperAdmin] Super Admin exists in Auth with ID:', authUser.id);
      }
    }

    // 2. If not found in Auth, create it using supabaseAdmin.auth.admin.createUser
    if (!authUser) {
      console.log('[adminUserService:seedSuperAdmin] Seeding Super Admin into Auth:', targetEmail);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        password: targetPassword,
        email_confirm: true,
        user_metadata: {
          full_name: targetFullName,
          employee_id: targetEmployeeId,
          role: targetRole,
          initial_password: targetPassword,
        },
      });

      if (createError) {
        console.error('[adminUserService:seedSuperAdmin] Auth creation failed:', createError.message);
        throw new Error(`Failed to create Super Admin in Auth: ${createError.message}`);
      }

      authUser = createData?.user;
    }

    if (!authUser || !authUser.id) {
      throw new Error('Super Admin Auth record could not be found or created.');
    }

    // 3. Insert or Upsert record into the profiles table using supabaseAdmin (bypassing RLS)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: authUser.id,
          employee_id: targetEmployeeId,
          full_name: targetFullName,
          role: targetRole,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError) {
      console.error('[adminUserService:seedSuperAdmin] Error upserting into profiles table:', profileError.message);
      throw new Error(`Failed to upsert Super Admin profile: ${profileError.message}`);
    }

    console.log('[adminUserService:seedSuperAdmin] Super Admin profile verified in database.');

    return {
      success: true,
      message: 'Super Admin profile successfully connected and synced with Supabase!',
      user: profileData,
    };
  } catch (error: any) {
    console.error('[adminUserService:seedSuperAdmin] Fatal error during Super Admin seeding:', error);
    return {
      success: false,
      message: `Seeding error: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Fetch operational users strictly from the Supabase database:
 * - Excludes SUPER_ADMIN (admin account should not appear in the workforce directory).
 * - Synchronizes any Auth accounts that are missing from the profiles table.
 * - Extracts passwords stored in user_metadata when available so Show Password icon works.
 * - If currentUserRole === 'ADMIN': returns ONLY 'USER' accounts.
 * - If currentUserRole === 'SUPER_ADMIN': returns 'ADMIN' and 'USER' accounts.
 * - ZERO dummy/mock records are ever returned.
 */
export async function fetchProfiles(currentUserRole: ProfileRole): Promise<UserProfile[]> {
  console.log('[adminUserService:fetchProfiles] Querying real database profiles for active role:', currentUserRole);
  try {
    // 1. Fetch all profiles from Supabase database
    const { data: rawProfiles, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('[adminUserService:fetchProfiles] Error querying profiles table:', dbError.message);
      throw dbError;
    }

    const dbProfiles: any[] = Array.isArray(rawProfiles) ? [...rawProfiles] : [];

    // 2. Fetch Auth users to match passwords/metadata and sync any orphan Auth accounts
    let authUsers: any[] = [];
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      if (authData && Array.isArray((authData as any).users)) {
        authUsers = (authData as any).users;
      }
    } catch (authListErr: any) {
      console.warn('[adminUserService:fetchProfiles] Note: Could not list auth users:', authListErr?.message);
    }

    const authMap = new Map<string, any>();
    authUsers.forEach(u => authMap.set(u.id, u));

    // 3. Auto-sync: Check if any Auth user was created directly in Supabase or earlier without a profiles row
    const existingProfileIds = new Set(dbProfiles.map(p => p.id));
    const missingInProfiles = authUsers.filter(u => !existingProfileIds.has(u.id));

    if (missingInProfiles.length > 0) {
      console.log(`[adminUserService:fetchProfiles] Found ${missingInProfiles.length} Auth user(s) missing profile row. Auto-syncing to database...`);
      for (const missingUser of missingInProfiles) {
        const rawEmail = missingUser.email || '';
        const empIdPart = rawEmail.split('@')[0] || `EMP-${missingUser.id.slice(0, 4).toUpperCase()}`;
        const inferredEmpId = empIdPart.toUpperCase();
        
        // Skip root admin from becoming an operational user
        if (inferredEmpId === 'ADMIN' || rawEmail.toLowerCase() === 'admin@abc.com') {
          continue;
        }

        const inferredRole: ProfileRole =
          missingUser.user_metadata?.role === 'ADMIN' || inferredEmpId.startsWith('AD-')
            ? 'ADMIN'
            : 'USER';
        const inferredName =
          missingUser.user_metadata?.full_name || `User ${inferredEmpId}`;

        try {
          const { data: syncedRow, error: syncInsertErr } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: missingUser.id,
              employee_id: inferredEmpId,
              full_name: inferredName,
              role: inferredRole,
            })
            .select()
            .single();

          if (!syncInsertErr && syncedRow) {
            console.log('[adminUserService:fetchProfiles] Synced orphan user into profiles:', syncedRow.employee_id);
            dbProfiles.push(syncedRow);
          }
        } catch (syncErr) {
          console.warn('[adminUserService:fetchProfiles] Auto-sync failed for user:', syncErr);
        }
      }
    }

    // 4. Filter out SUPER_ADMIN and root 'admin' so developer credentials are never exposed in workforce table
    const operationalDbRows = dbProfiles.filter(
      row =>
        (row.role || '').toUpperCase() !== 'SUPER_ADMIN' &&
        (row.employee_id || '').toLowerCase() !== 'admin'
    );

    // 5. Map directly to UserProfile model using Supabase database values
    const mappedProfiles: UserProfile[] = operationalDbRows.map(row => {
      const authUser = authMap.get(row.id);
      const email = authUser?.email || `${(row.employee_id || 'user').toLowerCase()}@abc.com`;
      const normalizedRole: ProfileRole = (row.role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
      
      // Look up real password: metadata first, then password vault, then standard password123
      const storedPassword = 
        authUser?.user_metadata?.initial_password ||
        getStoredUserPassword(row.employee_id) ||
        getStoredUserPassword(row.id) ||
        'password123';

      return {
        id: row.id,
        employee_id: row.employee_id || 'UNKNOWN',
        full_name: row.full_name || 'Unnamed User',
        role: normalizedRole,
        email: email,
        password: storedPassword,
        created_at: row.created_at || new Date().toISOString(),
      };
    });

    // 6. Apply RBAC filtering:
    // If ADMIN: can ONLY view USER accounts
    // If SUPER_ADMIN: can view both ADMIN and USER accounts
    let visibleByRole = mappedProfiles;
    if (currentUserRole === 'ADMIN') {
      visibleByRole = mappedProfiles.filter(p => p.role === 'USER');
    }

    // 7. Update cache with strictly verified database rows (no dummy data)
    setCachedProfiles(mappedProfiles);

    console.log(`[adminUserService:fetchProfiles] Successfully synchronized ${visibleByRole.length} operational profiles from database.`);
    return visibleByRole;
  } catch (err: any) {
    console.error('[adminUserService:fetchProfiles] Database query failed:', err.message);
    const cached = getCachedProfiles().filter(
      p => p.role !== 'SUPER_ADMIN' && (p.employee_id || '').toLowerCase() !== 'admin'
    );
    if (currentUserRole === 'ADMIN') {
      return cached.filter(p => p.role === 'USER');
    }
    return cached;
  }
}

/**
 * Create a new user:
 * 1. Creates user in Supabase Auth via supabaseAdmin.auth.admin.createUser
 * 2. Catches returned user.id
 * 3. Inserts id, employee_id, full_name, and role into the profiles table via supabaseAdmin
 * 4. Comprehensive console.log() and strict error handling
 */
export async function createUser(
  params: {
    employee_id: string;
    full_name: string;
    role: 'ADMIN' | 'USER';
    password?: string;
  },
  currentUserRole: ProfileRole
): Promise<UserProfile> {
  const cleanEmpId = params.employee_id.trim();
  const cleanFullName = params.full_name.trim();
  const cleanPassword = (params.password || 'password123').trim();

  // Strict RBAC enforcement: ADMIN can only create USER accounts
  let targetRole: ProfileRole = params.role;
  if (currentUserRole === 'ADMIN') {
    targetRole = 'USER';
  }

  const generatedEmail = `${cleanEmpId.toLowerCase().replace(/[^a-z0-9_-]/g, '')}@abc.com`;

  console.log('[adminUserService:createUser] Initiating creation process:');
  console.log(' - Employee ID:', cleanEmpId);
  console.log(' - Full Name:', cleanFullName);
  console.log(' - Target Role:', targetRole);
  console.log(' - Generated Auth Email:', generatedEmail);

  try {
    // 1. Create in Supabase Auth
    console.log('[adminUserService:createUser] Step 1: Calling supabaseAdmin.auth.admin.createUser()...');
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: generatedEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanFullName,
        employee_id: cleanEmpId,
        role: targetRole,
        initial_password: cleanPassword,
      },
    });

    if (authErr) {
      console.error('[adminUserService:createUser] Step 1 FAILED: Supabase Auth error:', authErr);
      const isQuota = (authErr as any).status === 429 || authErr.message?.toLowerCase().includes('quota') || authErr.message?.toLowerCase().includes('rate');
      throw new Error(isQuota ? 'Database connection failed or quota exceeded' : (authErr.message || 'Database connection failed or quota exceeded'));
    }

    const newUserId = authData?.user?.id;
    if (!newUserId) {
      console.error('[adminUserService:createUser] Step 1 FAILED: No user ID returned from Auth:', authData);
      throw new Error('Database connection failed or quota exceeded');
    }

    console.log('[adminUserService:createUser] Step 1 SUCCESS: User created in Auth with ID:', newUserId);

    // 2. Insert into the profiles table
    console.log('[adminUserService:createUser] Step 2: Inserting record into profiles table for ID:', newUserId);
    const profilePayload = {
      id: newUserId,
      employee_id: cleanEmpId,
      full_name: cleanFullName,
      role: targetRole,
    };

    const { data: dbData, error: insertErr } = await supabaseAdmin
      .from('profiles')
      .insert(profilePayload)
      .select()
      .single();

    if (insertErr) {
      console.error('[adminUserService:createUser] Step 2 FAILED: Database insert error:', insertErr);
      
      // Clean up Auth user to maintain synchronization
      try {
        console.log('[adminUserService:createUser] Rolling back Auth user ID:', newUserId);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
      } catch (cleanupErr) {
        console.warn('[adminUserService:createUser] Rollback failed:', cleanupErr);
      }

      const isQuota = insertErr.code === '429' || insertErr.message?.toLowerCase().includes('quota') || insertErr.message?.toLowerCase().includes('limit');
      throw new Error(isQuota ? 'Database connection failed or quota exceeded' : (insertErr.message || 'Database connection failed or quota exceeded'));
    }

    console.log('[adminUserService:createUser] Step 2 SUCCESS: Profile successfully inserted into profiles table:', dbData);

    // Save in password vault
    storeUserPassword(cleanEmpId, cleanPassword);
    if (newUserId) {
      storeUserPassword(newUserId, cleanPassword);
    }

    // 3. Build UserProfile and update cache
    const createdRecord: UserProfile = {
      id: dbData.id,
      employee_id: dbData.employee_id,
      full_name: dbData.full_name,
      role: dbData.role as ProfileRole,
      email: generatedEmail,
      password: cleanPassword,
      created_at: dbData.created_at || new Date().toISOString(),
    };

    const cached = getCachedProfiles();
    const updated = [createdRecord, ...cached.filter(p => p.id !== createdRecord.id)];
    setCachedProfiles(updated);

    console.log('[adminUserService:createUser] Complete: User and Profile synced successfully!');
    return createdRecord;
  } catch (error: any) {
    console.error('[adminUserService:createUser] Caught exception during user creation:', error);
    if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('Database connection failed or quota exceeded');
    }
    throw error;
  }
}

// Backwards compatibility alias
export const createProfileUser = createUser;

/**
 * Update an existing user with strict RBAC:
 * - SUPER_ADMIN can update any user
 * - ADMIN can ONLY update USER accounts (cannot modify SUPER_ADMIN or other ADMIN accounts)
 */
export async function updateProfileUser(
  id: string,
  updates: {
    employee_id?: string;
    full_name?: string;
    role?: ProfileRole;
    password?: string;
  },
  currentUserRole: ProfileRole
): Promise<UserProfile> {
  console.log('[adminUserService:updateProfileUser] Updating user ID:', id, updates);
  try {
    const cached = getCachedProfiles();
    const targetUser = cached.find(u => u.id === id);

    // RBAC validation:
    if (currentUserRole === 'ADMIN') {
      if (targetUser && (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN')) {
        console.error('[adminUserService:updateProfileUser] Access Denied: Admin attempted to modify Admin/Super Admin');
        throw new Error('Access Denied: Administrators cannot modify Admin or Super Admin accounts.');
      }
      if (updates.role && updates.role !== 'USER') {
        throw new Error('Access Denied: Administrators can only assign the USER role.');
      }
    }

    const payload: any = {};
    if (updates.employee_id) payload.employee_id = updates.employee_id.trim();
    if (updates.full_name) payload.full_name = updates.full_name.trim();
    if (updates.role) payload.role = updates.role;

    // 1. Update profiles table using supabaseAdmin
    const { data: updatedDbData, error: dbErr } = await supabaseAdmin
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (dbErr) {
      console.error('[adminUserService:updateProfileUser] Database update error:', dbErr);
      const isQuota = dbErr.code === '429' || dbErr.message?.toLowerCase().includes('quota') || dbErr.message?.toLowerCase().includes('limit');
      throw new Error(isQuota ? 'Database connection failed or quota exceeded' : (dbErr.message || 'Database connection failed or quota exceeded'));
    }

    console.log('[adminUserService:updateProfileUser] Database profile updated:', updatedDbData);

    // 2. Update Auth password if requested
    if (updates.password) {
      console.log('[adminUserService:updateProfileUser] Updating password in Auth for user ID:', id);
      storeUserPassword(id, updates.password);
      if (updatedDbData?.employee_id) {
        storeUserPassword(updatedDbData.employee_id, updates.password);
      }
      const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: updates.password,
      });
      if (pwdErr) {
        console.error('[adminUserService:updateProfileUser] Auth password update error:', pwdErr);
      }
    }

    // 3. Update local cache
    const updatedProfiles = cached.map(u => {
      if (u.id === id) {
        return {
          ...u,
          ...payload,
          password: updates.password || u.password,
        };
      }
      return u;
    });
    setCachedProfiles(updatedProfiles);

    const updatedTarget = updatedProfiles.find(u => u.id === id);
    if (!updatedTarget) throw new Error('User not found after update.');
    return updatedTarget;
  } catch (error: any) {
    console.error('[adminUserService:updateProfileUser] Error caught:', error);
    if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('Database connection failed or quota exceeded');
    }
    throw error;
  }
}

/**
 * Delete a user with strict RBAC:
 * - SUPER_ADMIN can delete users (except root Super Admin)
 * - ADMIN can ONLY delete USER accounts (cannot delete SUPER_ADMIN or other ADMIN accounts)
 */
export async function deleteProfileUser(id: string, currentUserRole: ProfileRole): Promise<void> {
  console.log('[adminUserService:deleteProfileUser] Deleting user ID:', id);
  try {
    const cached = getCachedProfiles();
    const targetUser = cached.find(u => u.id === id);

    if (targetUser?.role === 'SUPER_ADMIN' || targetUser?.employee_id.toLowerCase() === 'admin') {
      throw new Error('Action Blocked: Super Admin root accounts cannot be deleted.');
    }

    if (currentUserRole === 'ADMIN') {
      if (targetUser && targetUser.role === 'ADMIN') {
        throw new Error('Access Denied: Administrators cannot delete other Admin accounts.');
      }
    }

    // 1. Delete from profiles table via supabaseAdmin
    const { error: dbDeleteErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (dbDeleteErr) {
      console.error('[adminUserService:deleteProfileUser] Database delete error:', dbDeleteErr);
      const isQuota = dbDeleteErr.code === '429' || dbDeleteErr.message?.toLowerCase().includes('quota') || dbDeleteErr.message?.toLowerCase().includes('limit');
      throw new Error(isQuota ? 'Database connection failed or quota exceeded' : (dbDeleteErr.message || 'Database connection failed or quota exceeded'));
    }

    console.log('[adminUserService:deleteProfileUser] Profile deleted from database.');

    // 2. Delete from Supabase Auth via supabaseAdmin
    const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authDeleteErr) {
      console.warn('[adminUserService:deleteProfileUser] Auth deleteUser warning:', authDeleteErr);
    } else {
      console.log('[adminUserService:deleteProfileUser] Auth user deleted successfully.');
    }

    // 3. Update local cache
    const updated = cached.filter(u => u.id !== id);
    setCachedProfiles(updated);
  } catch (error: any) {
    console.error('[adminUserService:deleteProfileUser] Error caught:', error);
    if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('Database connection failed or quota exceeded');
    }
    throw error;
  }
}
